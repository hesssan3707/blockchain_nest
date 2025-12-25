import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import axios from 'axios';
import { md5Hex } from '../../common/security/hashing';
import { Blockchain } from '../blockchain/blockchain.entity';
import { Currency } from '../currency/currency.entity';
import { User } from '../user/user.entity';
import { Wallet } from './wallet.entity';
import { WalletBalance } from './wallet-balance.entity';
import { Revenue } from './revenue.entity';
import { PriceService } from '../price/price.service';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from './transaction.entity';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Blockchain)
    private readonly blockchainRepo: Repository<Blockchain>,
    @InjectRepository(Currency)
    private readonly currencyRepo: Repository<Currency>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(WalletBalance)
    private readonly balanceRepo: Repository<WalletBalance>,
    @InjectRepository(Revenue)
    private readonly revenueRepo: Repository<Revenue>,
    private readonly priceService: PriceService,
  ) {}

  async processConfirmedTransaction(tx: Transaction, networkFee: number, networkFeeCurrency?: Currency): Promise<void> {
    tx.status = TransactionStatus.SUCCESS;
    tx.isConfirmed = true;
    tx.networkFee = networkFee;
    if (networkFeeCurrency) {
      tx.networkFeeCurrency = networkFeeCurrency;
      tx.networkFeeCurrencyId = networkFeeCurrency.id;
    }
    await this.txRepo.save(tx);

    // Update Wallet Balance
    await this.updateWalletBalance(tx);

    // Calculate Revenue
    if (tx.type === TransactionType.WITHDRAWAL || tx.type === TransactionType.BALANCE_COLLECTOR) {
      const revenue = new Revenue();
      revenue.user = tx.user;
      revenue.userId = tx.userId;
      revenue.blockchain = tx.blockchain;
      revenue.blockchainId = tx.blockchainId;
      revenue.currency = tx.currency;
      revenue.currencyId = tx.currencyId;
      revenue.transaction = tx;
      revenue.transactionId = tx.id;
      revenue.agreedFee = tx.agreedFee;
      revenue.networkFee = tx.networkFee;
      revenue.networkFeeCurrency = tx.networkFeeCurrency || tx.currency;
      revenue.networkFeeCurrencyId = tx.networkFeeCurrencyId || tx.currencyId;

      // Calculate revenue value
      // To get a meaningful difference, we convert both to USD
      try {
        const agreedFeeUsd = await this.priceService.convertToUsd(tx.currency.symbol, tx.agreedFee);
        const networkFeeCurrencySymbol = networkFeeCurrency ? networkFeeCurrency.symbol : (tx.blockchain.name === 'TRON' ? 'TRX' : tx.blockchain.name); // Better fallback
        const networkFeeUsd = await this.priceService.convertToUsd(networkFeeCurrencySymbol, tx.networkFee);
        
        revenue.revenue = agreedFeeUsd - networkFeeUsd; // This is revenue in USD
        revenue.description = `Revenue from ${tx.type}: ${tx.agreedFee} ${tx.currency.symbol} (agreed) - ${tx.networkFee} ${networkFeeCurrencySymbol} (network)`;
      } catch (error) {
        this.logger.error(`Failed to calculate revenue USD for tx ${tx.id}: ${error.message}`);
        revenue.revenue = 0; // Fallback
      }

      await this.revenueRepo.save(revenue);
    }
  }

  async updateWalletBalance(tx: Transaction): Promise<void> {
    if (!tx.walletId || tx.status !== TransactionStatus.SUCCESS) return;

    let balance = await this.balanceRepo.findOne({
      where: { walletId: tx.walletId, currencyId: tx.currencyId },
    });

    if (!balance) {
      balance = this.balanceRepo.create({
        walletId: tx.walletId,
        currencyId: tx.currencyId,
        userBalance: 0,
        networkBalance: 0,
      });
    }

    if (tx.type === TransactionType.DEPOSIT) {
      balance.userBalance += tx.value;
      balance.networkBalance += tx.value;
    } else if (tx.type === TransactionType.WITHDRAWAL) {
      // For withdrawals, value is what user gets, but we also charge agreed_fee
      balance.userBalance -= (tx.value + tx.agreedFee);
      balance.networkBalance -= tx.value;
      // network fee handled below if it's in the same or different currency
    } else if (tx.type === TransactionType.BALANCE_COLLECTOR) {
      // Balance collector moves funds from wallet to safe wallet
      balance.networkBalance -= tx.value;
      // userBalance doesn't change because it's already deducted or it's just a move
    }

    await this.balanceRepo.save(balance);

    // Handle Network Fee deduction from networkBalance
    if (tx.networkFee > 0 && (tx.type === TransactionType.WITHDRAWAL || tx.type === TransactionType.BALANCE_COLLECTOR)) {
      const feeCurrencyId = tx.networkFeeCurrencyId || tx.currencyId;
      
      if (feeCurrencyId === tx.currencyId) {
        balance.networkBalance -= tx.networkFee;
        await this.balanceRepo.save(balance);
      } else {
        // Fee in different currency (e.g. native currency for token transfer)
        let feeBalance = await this.balanceRepo.findOne({
          where: { walletId: tx.walletId, currencyId: feeCurrencyId },
        });
        
        if (!feeBalance) {
          feeBalance = this.balanceRepo.create({
            walletId: tx.walletId,
            currencyId: feeCurrencyId,
            userBalance: 0,
            networkBalance: 0,
          });
        }
        
        feeBalance.networkBalance -= tx.networkFee;
        await this.balanceRepo.save(feeBalance);
      }
    }

    this.logger.log(`Updated balance for wallet ${tx.walletId}, currency ${tx.currencyId}. New userBalance: ${balance.userBalance}`);
  }

  async setStatusByHash(
    transactionHash: string,
    status: TransactionStatus,
    description?: string,
  ): Promise<void> {
    const updateData: any = { status };
    if (description) {
      updateData.description = description;
    }

    await this.txRepo
      .createQueryBuilder()
      .update(Transaction)
      .set(updateData)
      .where('transaction_hash = :transactionHash', { transactionHash })
      .execute();
  }

  async getByIds(ids: string | string[]) {
    if (!ids) {
      throw new BadRequestException({
        data: null,
        message: 'No valid ids provided',
        status: 400
      });
    }
    const idArray = Array.isArray(ids) ? ids : [ids];
    const transactions = await this.txRepo.find({
      where: { transactionId: In(idArray) },
      relations: { user: true, blockchain: true, currency: true },
    });

    if (transactions.length === 0) {
      throw new NotFoundException({
        data: null,
        message: 'No transactions found for the provided IDs',
        status: 404
      });
    }

    return {
      data: transactions,
      message: 'User transactions retrieved successfully',
      status: 200
    };
  }

  async listByUser(userIdentifier: string): Promise<Transaction[]> {
    return this.txRepo.find({
      where: { user: { identifier: userIdentifier } },
      relations: { blockchain: true, currency: true },
      order: { createdAt: 'DESC' },
    });
  }

  async store(dto: any) {
    // Note: This method mimics the TransactionView post method which seems to handle withdrawals.
    // However, the original python code calls withdrawal task or Nobitex.withdrawal.
    // The store method here seems to be creating a transaction record directly, which might be a misunderstanding of the python code.
    // The python code:
    // 1. Validates TransactionRequestSerializer
    // 2. Calls withdrawal task (which returns a tx_id) or Nobitex
    // 3. Returns success response with tx_id
    // The actual transaction creation in DB happens inside the withdrawal task in python.

    // Given the instructions, we should align validation first.
    // But since this is a service method called by controller, we can keep the logic here for now or move it.
    // Let's assume this method is intended to initiate the withdrawal process.

    // Validation
    const user = await this.userRepo.findOne({ where: { identifier: dto.user_identifier } });
    if (!user) throw new BadRequestException('User not found');

    const blockchain = await this.blockchainRepo.findOne({ where: { name: dto.blockchain_name.toUpperCase() } });
    if (!blockchain) throw new BadRequestException('Blockchain not found');

    const currency = await this.currencyRepo.findOne({
      where: { symbol: dto.currency_symbol.toUpperCase(), blockchain: { id: blockchain.id } },
    });
    if (!currency) throw new BadRequestException('Currency not found for this blockchain');

    // Check for duplicate transaction_id
    if (dto.transaction_id) {
      const existingTx = await this.txRepo.findOne({
        where: { transactionId: dto.transaction_id.toString() }
      });
      if (existingTx) {
        throw new BadRequestException('A transaction with this transaction_id already exists.');
      }
    }

    // In python, the withdrawal task creates the transaction.
    // Here we are creating it directly.
    const wallet = await this.walletRepo.findOne({
      where: { publicKey: dto.wallet_address, blockchain: { id: blockchain.id } },
    });

    const tx = this.txRepo.create({
      user,
      blockchain,
      currency,
      wallet: wallet || null,
      value: parseFloat(dto.amount),
      transactionId: dto.transaction_id?.toString(),
      type: TransactionType.WITHDRAWAL,
      status: TransactionStatus.WAITING,
      agreedFee: parseFloat(dto.agreed_fee || 0),
      externalWallet: dto.wallet_address,
      description: dto.description || null,
      isActive: true,
      checksum: md5Hex(`${currency.id}${blockchain.id}${dto.transaction_id}${dto.amount}${TransactionType.WITHDRAWAL}`),
    });

    await this.txRepo.save(tx);
    
    return {
      data: tx.transactionId,
      message: 'Created Successfully',
      status: 200
    };
  }

  async createIfNotExists(input: {
    currency: Currency;
    blockchain: Blockchain;
    user?: User;
    wallet: Wallet | null;
    transactionHash: string;
    value: number;
    type: TransactionType;
    status: TransactionStatus;
    externalWallet?: string | null;
    memo?: string | null;
    description?: string | null;
    uuid?: string | null;
    transactionId?: string | null;
    confirmations?: number;
    isConfirmed?: boolean;
    agreedFee?: number;
  }): Promise<Transaction | null> {
    const existing = await this.txRepo.findOne({
      where: { transactionHash: input.transactionHash },
    });
    if (existing) {
      let changed = false;
      if (input.confirmations !== undefined) {
        existing.confirmations = input.confirmations;
        existing.isConfirmed = input.isConfirmed ?? existing.isConfirmed;
        changed = true;
      }
      if (input.status === TransactionStatus.SUCCESS && existing.status !== TransactionStatus.SUCCESS) {
        existing.status = TransactionStatus.SUCCESS;
        existing.isConfirmed = true;
        if (!existing.description) {
          existing.description = 'Transaction confirmed successfully on the blockchain.';
        }
        changed = true;
        await this.txRepo.save(existing);
        await this.updateWalletBalance(existing);
        return existing;
      }
      if (changed) {
        return this.txRepo.save(existing);
      }
      return null;
    }

    if (!input.user || !input.user.id) {
      return null;
    }

    const checksumData = `${input.currency.id}${input.blockchain.id}${input.transactionHash}${input.value}${input.type}`;
    let description = input.description ?? null;
    if (input.status === TransactionStatus.SUCCESS && !description) {
      description = 'Transaction confirmed successfully on the blockchain.';
    }

    const tx = this.txRepo.create({
      currency: input.currency,
      blockchain: input.blockchain,
      user: input.user,
      wallet: input.wallet,
      transactionHash: input.transactionHash,
      value: input.value,
      type: input.type,
      status: input.status,
      externalWallet: input.externalWallet ?? null,
      memo: input.memo ?? null,
      description: description,
      uuid: input.uuid ?? null,
      transactionId: input.transactionId ?? null,
      confirmations: input.confirmations ?? 0,
      isConfirmed: input.isConfirmed ?? (input.status === TransactionStatus.SUCCESS),
      checksum: md5Hex(checksumData),
      isActive: true,
      agreedFee: input.agreedFee ?? 0,
      networkFee: 0,
    });
    
    const savedTx = await this.txRepo.save(tx);
    
    if (savedTx.status === TransactionStatus.SUCCESS) {
      await this.updateWalletBalance(savedTx);
    }
    
    // Callback logic
    const callbackUrl = process.env.TRANSACTION_CALLBACK_URL;
    if (callbackUrl) {
      this.sendTransactionCallback(callbackUrl, savedTx).catch(err => {
        this.logger.error(`Failed to send transaction callback for ${savedTx.transactionHash}: ${err.message}`);
      });
    }

    return savedTx;
  }

  private async sendTransactionCallback(url: string, tx: Transaction) {
    const payload = {
      external_wallet: tx.externalWallet,
      to: tx.wallet?.publicKey,
      transaction_hash: tx.transactionHash,
      value: tx.value,
      type: tx.type,
      status: tx.status,
      currency_symbol: tx.currency?.symbol,
      blockchain_name: tx.blockchain?.name,
      memo: tx.memo || "",
      created_at_timestamp: Math.floor(tx.createdAt.getTime() / 1000)
    };

    await axios.post(url, payload, { timeout: 5000 });
  }
}
