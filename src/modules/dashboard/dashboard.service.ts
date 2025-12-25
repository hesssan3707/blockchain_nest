import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Transaction, TransactionStatus, TransactionType } from '../wallet/transaction.entity';
import { Wallet } from '../wallet/wallet.entity';
import { Revenue } from '../wallet/revenue.entity';
import { Blockchain } from '../blockchain/blockchain.entity';
import { Currency } from '../currency/currency.entity';
import { BlockHistory } from '../wallet/block-history.entity';
import { User } from '../user/user.entity';
import { Setting } from '../setting/setting.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(Revenue)
    private readonly revenueRepo: Repository<Revenue>,
    @InjectRepository(Blockchain)
    private readonly blockchainRepo: Repository<Blockchain>,
    @InjectRepository(Currency)
    private readonly currencyRepo: Repository<Currency>,
    @InjectRepository(BlockHistory)
    private readonly blockHistoryRepo: Repository<BlockHistory>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Setting)
    private readonly settingRepo: Repository<Setting>,
  ) {}

  async getStats(userId?: string) {
    const userCondition = userId ? { wallet: { user: { id: parseInt(userId) } } } : {};
    
    const totalTransactions = await this.transactionRepo.count({
      where: userCondition
    });
    const pendingWithdrawals = await this.transactionRepo.count({
      where: { 
        ...userCondition,
        type: TransactionType.WITHDRAWAL, 
        status: TransactionStatus.WAITING 
      },
    });
    
    const walletCondition = userId ? { user: { id: parseInt(userId) } } : {};
    const totalWallets = await this.walletRepo.count({
      where: walletCondition
    });
    const activeBlockchains = await this.blockchainRepo.count({ where: { isActive: true } });

    // Calculate total revenue
    const revenueQuery = this.revenueRepo.createQueryBuilder('revenue');
    if (userId) {
      revenueQuery.innerJoin('revenue.wallet', 'wallet')
        .innerJoin('wallet.user', 'user')
        .where('user.id = :userId', { userId });
    }
    const revenueStats = await revenueQuery
      .select('SUM(revenue.revenue)', 'totalRevenue')
      .getRawOne();

    return {
      totalTransactions,
      pendingWithdrawals,
      totalWallets,
      activeBlockchains,
      totalRevenue: parseFloat(revenueStats.totalRevenue || 0),
    };
  }

  async getRecentTransactions(limit = 10, userId?: string) {
    const where: any = {};
    if (userId) {
      where.wallet = { user: { id: parseInt(userId) } };
    }
    
    return this.transactionRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['blockchain', 'currency', 'wallet', 'wallet.user'],
    });
  }

  async getBlockchainStats(userId?: string) {
    const blockchains = await this.blockchainRepo.find({ where: { isActive: true } });
    const stats = await Promise.all(
      blockchains.map(async (bc) => {
        const txWhere: any = { blockchain: { id: bc.id } };
        if (userId) {
          txWhere.wallet = { user: { id: parseInt(userId) } };
        }
        const txCount = await this.transactionRepo.count({ where: txWhere });
        return {
          id: bc.id,
          name: bc.name,
          bpm: bc.bpm,
          transactionCount: txCount,
          status: bc.isActive ? 'Active' : 'Inactive',
        };
      }),
    );
    return stats;
  }

  async getRevenueChartData(days = 7, userId?: string) {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const query = this.revenueRepo.createQueryBuilder('revenue')
      .select("DATE_FORMAT(revenue.createdAt, '%Y-%m-%d')", 'date')
      .addSelect('SUM(revenue.revenue)', 'amount')
      .where('revenue.createdAt >= :date', { date });

    if (userId) {
      query.innerJoin('revenue.wallet', 'wallet')
        .innerJoin('wallet.user', 'user')
        .andWhere('user.id = :userId', { userId });
    }

    const data = await query
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return data.map((item) => ({
      date: item.date,
      amount: parseFloat(item.amount || 0),
    }));
  }

  async getWalletStats(userId?: string) {
    const where: any = {};
    if (userId) {
      where.user = { id: parseInt(userId) };
    }

    const wallets = await this.walletRepo.find({
      where,
      relations: ['user', 'blockchain', 'balances', 'balances.currency'],
      take: 50,
      order: { createdAt: 'DESC' }
    });

    return wallets.map(w => ({
      id: w.id,
      address: w.publicKey,
      user: w.user?.identifier || 'N/A',
      blockchain: w.blockchain?.name,
      isActive: w.isActive,
      createdAt: w.createdAt,
      balances: w.balances?.map(b => ({
        currency: b.currency?.symbol,
        userBalance: b.userBalance,
        networkBalance: b.networkBalance
      })) || []
    }));
  }

  async getRevenueStats(userId?: string) {
    const where: any = {};
    if (userId) {
      where.wallet = { user: { id: parseInt(userId) } };
    }

    const revenues = await this.revenueRepo.find({
      where,
      relations: ['blockchain', 'currency', 'wallet', 'wallet.user'],
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return revenues;
  }

  async getUsers() {
    return this.userRepo.find({
      select: ['id', 'identifier'],
      where: { isActive: true },
      order: { identifier: 'ASC' }
    });
  }

  async getSyncStatus() {
    const blockchains = await this.blockchainRepo.find({ where: { isActive: true } });
    const status = await Promise.all(
      blockchains.map(async (bc) => {
        // Get last 50 block history records for this blockchain
        const history = await this.blockHistoryRepo.find({
          where: { blockchainId: bc.id },
          order: { number: 'DESC' },
          take: 50
        });

        if (history.length === 0) {
          return {
            blockchain: bc.name,
            latestBlock: 0,
            gaps: [],
            isHealthy: false,
            lastSync: null
          };
        }

        const latestBlock = history[0].number;
        const oldestBlock = history[history.length - 1].number;
        
        // Find gaps in the sequence
        const gaps: number[] = [];
        const existingBlocks = new Set(history.map(h => h.number));
        
        for (let i = latestBlock; i >= oldestBlock; i--) {
          if (!existingBlocks.has(i)) {
            gaps.push(i);
          }
        }

        return {
          blockchain: bc.name,
          latestBlock,
          oldestBlock,
          history: history.map(h => ({ number: h.number, createdAt: h.createdAt })),
          gaps,
          isHealthy: gaps.length === 0,
          lastSync: history[0].createdAt
        };
      })
    );
    return status;
  }

  async getSettings() {
    const settings = await this.settingRepo.find();
    return settings;
  }
}
