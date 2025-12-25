import { Repository } from 'typeorm';
import { Transaction } from '../wallet/transaction.entity';
import { Wallet } from '../wallet/wallet.entity';
import { Revenue } from '../wallet/revenue.entity';
import { Blockchain } from '../blockchain/blockchain.entity';
import { Currency } from '../currency/currency.entity';
import { BlockHistory } from '../wallet/block-history.entity';
import { User } from '../user/user.entity';
import { Setting } from '../setting/setting.entity';
export declare class DashboardService {
    private readonly transactionRepo;
    private readonly walletRepo;
    private readonly revenueRepo;
    private readonly blockchainRepo;
    private readonly currencyRepo;
    private readonly blockHistoryRepo;
    private readonly userRepo;
    private readonly settingRepo;
    constructor(transactionRepo: Repository<Transaction>, walletRepo: Repository<Wallet>, revenueRepo: Repository<Revenue>, blockchainRepo: Repository<Blockchain>, currencyRepo: Repository<Currency>, blockHistoryRepo: Repository<BlockHistory>, userRepo: Repository<User>, settingRepo: Repository<Setting>);
    getStats(userId?: string): Promise<{
        totalTransactions: number;
        pendingWithdrawals: number;
        totalWallets: number;
        activeBlockchains: number;
        totalRevenue: number;
    }>;
    getRecentTransactions(limit?: number, userId?: string): Promise<Transaction[]>;
    getBlockchainStats(userId?: string): Promise<{
        id: number;
        name: string;
        bpm: number;
        transactionCount: number;
        status: string;
    }[]>;
    getRevenueChartData(days?: number, userId?: string): Promise<{
        date: any;
        amount: number;
    }[]>;
    getWalletStats(userId?: string): Promise<{
        id: number;
        address: string;
        user: string;
        blockchain: string;
        isActive: boolean;
        createdAt: Date;
        balances: {
            currency: string;
            userBalance: number;
            networkBalance: number;
        }[];
    }[]>;
    getRevenueStats(userId?: string): Promise<Revenue[]>;
    getUsers(): Promise<User[]>;
    getSyncStatus(): Promise<({
        blockchain: string;
        latestBlock: number;
        gaps: never[];
        isHealthy: boolean;
        lastSync: null;
        oldestBlock?: undefined;
        history?: undefined;
    } | {
        blockchain: string;
        latestBlock: number;
        oldestBlock: number;
        history: {
            number: number;
            createdAt: Date;
        }[];
        gaps: number[];
        isHealthy: boolean;
        lastSync: Date;
    })[]>;
    getSettings(): Promise<Setting[]>;
}
