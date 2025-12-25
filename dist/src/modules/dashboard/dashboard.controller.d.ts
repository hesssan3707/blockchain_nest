import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getStats(userId?: string): Promise<{
        totalTransactions: number;
        pendingWithdrawals: number;
        totalWallets: number;
        activeBlockchains: number;
        totalRevenue: number;
    }>;
    getRecentTransactions(limit?: number, userId?: string): Promise<import("../wallet/transaction.entity").Transaction[]>;
    getBlockchainStats(userId?: string): Promise<{
        id: number;
        name: string;
        bpm: number;
        transactionCount: number;
        status: string;
    }[]>;
    getRevenueChart(days?: number, userId?: string): Promise<{
        date: any;
        amount: number;
    }[]>;
    getWallets(userId?: string): Promise<{
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
    getRevenues(userId?: string): Promise<import("../wallet/revenue.entity").Revenue[]>;
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
    getSettings(): Promise<import("../setting/setting.entity").Setting[]>;
    getUsers(): Promise<import("../user/user.entity").User[]>;
}
