"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transaction_entity_1 = require("../wallet/transaction.entity");
const wallet_entity_1 = require("../wallet/wallet.entity");
const revenue_entity_1 = require("../wallet/revenue.entity");
const blockchain_entity_1 = require("../blockchain/blockchain.entity");
const currency_entity_1 = require("../currency/currency.entity");
const block_history_entity_1 = require("../wallet/block-history.entity");
const user_entity_1 = require("../user/user.entity");
const setting_entity_1 = require("../setting/setting.entity");
let DashboardService = class DashboardService {
    constructor(transactionRepo, walletRepo, revenueRepo, blockchainRepo, currencyRepo, blockHistoryRepo, userRepo, settingRepo) {
        this.transactionRepo = transactionRepo;
        this.walletRepo = walletRepo;
        this.revenueRepo = revenueRepo;
        this.blockchainRepo = blockchainRepo;
        this.currencyRepo = currencyRepo;
        this.blockHistoryRepo = blockHistoryRepo;
        this.userRepo = userRepo;
        this.settingRepo = settingRepo;
    }
    async getStats(userId) {
        const userCondition = userId ? { wallet: { user: { id: parseInt(userId) } } } : {};
        const totalTransactions = await this.transactionRepo.count({
            where: userCondition
        });
        const pendingWithdrawals = await this.transactionRepo.count({
            where: {
                ...userCondition,
                type: transaction_entity_1.TransactionType.WITHDRAWAL,
                status: transaction_entity_1.TransactionStatus.WAITING
            },
        });
        const walletCondition = userId ? { user: { id: parseInt(userId) } } : {};
        const totalWallets = await this.walletRepo.count({
            where: walletCondition
        });
        const activeBlockchains = await this.blockchainRepo.count({ where: { isActive: true } });
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
    async getRecentTransactions(limit = 10, userId) {
        const where = {};
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
    async getBlockchainStats(userId) {
        const blockchains = await this.blockchainRepo.find({ where: { isActive: true } });
        const stats = await Promise.all(blockchains.map(async (bc) => {
            const txWhere = { blockchain: { id: bc.id } };
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
        }));
        return stats;
    }
    async getRevenueChartData(days = 7, userId) {
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
    async getWalletStats(userId) {
        const where = {};
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
    async getRevenueStats(userId) {
        const where = {};
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
        const status = await Promise.all(blockchains.map(async (bc) => {
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
            const gaps = [];
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
        }));
        return status;
    }
    async getSettings() {
        const settings = await this.settingRepo.find();
        return settings;
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __param(1, (0, typeorm_1.InjectRepository)(wallet_entity_1.Wallet)),
    __param(2, (0, typeorm_1.InjectRepository)(revenue_entity_1.Revenue)),
    __param(3, (0, typeorm_1.InjectRepository)(blockchain_entity_1.Blockchain)),
    __param(4, (0, typeorm_1.InjectRepository)(currency_entity_1.Currency)),
    __param(5, (0, typeorm_1.InjectRepository)(block_history_entity_1.BlockHistory)),
    __param(6, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(7, (0, typeorm_1.InjectRepository)(setting_entity_1.Setting)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map