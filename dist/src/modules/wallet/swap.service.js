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
exports.SwapService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../user/user.entity");
const currency_entity_1 = require("../currency/currency.entity");
const blockchain_entity_1 = require("../blockchain/blockchain.entity");
const wallet_entity_1 = require("./wallet.entity");
const wallet_balance_entity_1 = require("./wallet-balance.entity");
const transaction_entity_1 = require("./transaction.entity");
const provider_service_1 = require("../provider/provider.service");
const price_service_1 = require("../price/price.service");
let SwapService = class SwapService {
    constructor(userRepo, currencyRepo, blockchainRepo, walletRepo, balanceRepo, transactionRepo, providerService, priceService) {
        this.userRepo = userRepo;
        this.currencyRepo = currencyRepo;
        this.blockchainRepo = blockchainRepo;
        this.walletRepo = walletRepo;
        this.balanceRepo = balanceRepo;
        this.transactionRepo = transactionRepo;
        this.providerService = providerService;
        this.priceService = priceService;
    }
    async swap(dto) {
        const user = await this.userRepo.findOne({ where: { identifier: dto.user_identifier } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        const blockchain = await this.blockchainRepo.findOne({ where: { name: dto.blockchain_name.toUpperCase() } });
        if (!blockchain)
            throw new common_1.BadRequestException('Blockchain not found');
        const currencySource = await this.currencyRepo.findOne({
            where: { symbol: dto.currency_source.toUpperCase(), blockchain: { id: blockchain.id } },
        });
        if (!currencySource)
            throw new common_1.BadRequestException('Source currency not found');
        const currencyDest = await this.currencyRepo.findOne({
            where: { symbol: dto.currency_dest.toUpperCase(), blockchain: { id: blockchain.id } },
        });
        if (!currencyDest)
            throw new common_1.BadRequestException('Destination currency not found');
        const wallet = await this.walletRepo.findOne({
            where: { user: { id: user.id }, blockchain: { id: blockchain.id }, isActive: true },
        });
        if (!wallet)
            throw new common_1.BadRequestException('User wallet not found');
        const balance = await this.balanceRepo.findOne({
            where: { wallet: { id: wallet.id }, currency: { id: currencySource.id } },
        });
        if (!balance || balance.userBalance < dto.amount) {
            throw new common_1.BadRequestException('Insufficient balance');
        }
        const rate = await this.priceService.priceConverter(dto.currency_source, dto.currency_dest);
        if (rate <= 0)
            throw new common_1.BadRequestException('Could not get exchange rate');
        const destAmount = dto.amount * rate;
        return await this.transactionRepo.manager.transaction(async (manager) => {
            const txWithdrawal = manager.create(transaction_entity_1.Transaction, {
                user,
                blockchain,
                currency: currencySource,
                wallet,
                value: dto.amount,
                type: transaction_entity_1.TransactionType.SWAP_WITHDRAWAL,
                status: transaction_entity_1.TransactionStatus.SUCCESS,
                description: `Swap ${dto.amount} ${dto.currency_source} to ${dto.currency_dest}`,
                isActive: true,
            });
            await manager.save(txWithdrawal);
            const txDeposit = manager.create(transaction_entity_1.Transaction, {
                user,
                blockchain,
                currency: currencyDest,
                wallet,
                value: destAmount,
                type: transaction_entity_1.TransactionType.SWAP_DEPOSIT,
                status: transaction_entity_1.TransactionStatus.SUCCESS,
                description: `Swap ${dto.amount} ${dto.currency_source} to ${dto.currency_dest}`,
                isActive: true,
            });
            await manager.save(txDeposit);
            balance.userBalance -= dto.amount;
            await manager.save(balance);
            let destBalance = await manager.findOne(wallet_balance_entity_1.WalletBalance, {
                where: { wallet: { id: wallet.id }, currency: { id: currencyDest.id } },
            });
            if (!destBalance) {
                destBalance = manager.create(wallet_balance_entity_1.WalletBalance, {
                    wallet,
                    currency: currencyDest,
                    userBalance: destAmount,
                    networkBalance: 0,
                });
            }
            else {
                destBalance.userBalance += destAmount;
            }
            await manager.save(destBalance);
            return txWithdrawal.id;
        });
    }
};
exports.SwapService = SwapService;
exports.SwapService = SwapService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(currency_entity_1.Currency)),
    __param(2, (0, typeorm_1.InjectRepository)(blockchain_entity_1.Blockchain)),
    __param(3, (0, typeorm_1.InjectRepository)(wallet_entity_1.Wallet)),
    __param(4, (0, typeorm_1.InjectRepository)(wallet_balance_entity_1.WalletBalance)),
    __param(5, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        provider_service_1.ProviderService,
        price_service_1.PriceService])
], SwapService);
//# sourceMappingURL=swap.service.js.map