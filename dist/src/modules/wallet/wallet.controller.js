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
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const create_wallet_dto_1 = require("./dto/create-wallet.dto");
const swap_dto_1 = require("./dto/swap.dto");
const wallet_service_1 = require("./wallet.service");
const transaction_service_1 = require("./transaction.service");
const swap_service_1 = require("./swap.service");
let WalletController = class WalletController {
    constructor(walletService, transactionService, swapService) {
        this.walletService = walletService;
        this.transactionService = transactionService;
        this.swapService = swapService;
    }
    async getWalletAddress(userIdentifier, blockchainName) {
        const wallet = await this.walletService.getWalletAddress(userIdentifier, blockchainName);
        return {
            data: {
                address: wallet.publicKey,
                memo: wallet.memo,
                blockchain_name: wallet.blockchain?.name,
            },
            message: 'Wallet retrieved/created successfully',
            status: 200,
        };
    }
    async getBalance(userIdentifier, blockchainName) {
        const data = await this.walletService.getBalances(userIdentifier, blockchainName);
        return {
            data,
            message: 'Balances retrieved successfully',
            status: 200,
        };
    }
    async getOrCreate(dto) {
        const wallet = await this.walletService.getOrCreateWallet(dto);
        return {
            data: {
                id: wallet.id,
                publicKey: wallet.publicKey,
                memo: wallet.memo,
                blockchain: wallet.blockchain?.name,
                user: wallet.user?.identifier,
                createdAt: wallet.createdAt,
                updatedAt: wallet.updatedAt,
            },
            message: 'Wallet created/retrieved successfully',
            status: 200,
        };
    }
    async getTransactions(ids) {
        const data = await this.transactionService.getByIds(ids);
        return {
            data,
            message: 'Transactions retrieved successfully',
            status: 200,
        };
    }
    async storeTransaction(dto) {
        const data = await this.transactionService.store(dto);
        return {
            data,
            message: 'Transaction stored successfully',
            status: 200,
        };
    }
    async listTransactions(userIdentifier) {
        const transactions = await this.transactionService.listByUser(userIdentifier);
        return {
            data: transactions,
            message: 'User transactions retrieved successfully',
            status: 200,
        };
    }
    async swap(dto) {
        const txId = await this.swapService.swap(dto);
        return {
            data: txId,
            message: 'Swap processed successfully',
            status: 200,
        };
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Get)('wallet_address'),
    __param(0, (0, common_1.Query)('user_identifier')),
    __param(1, (0, common_1.Query)('blockchain_name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getWalletAddress", null);
__decorate([
    (0, common_1.Get)('balance'),
    __param(0, (0, common_1.Query)('user_identifier')),
    __param(1, (0, common_1.Query)('blockchain_name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_wallet_dto_1.CreateWalletDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getOrCreate", null);
__decorate([
    (0, common_1.Get)('transaction'),
    __param(0, (0, common_1.Query)('ids')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Post)('transaction'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "storeTransaction", null);
__decorate([
    (0, common_1.Get)('transaction_list'),
    __param(0, (0, common_1.Query)('user_identifier')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "listTransactions", null);
__decorate([
    (0, common_1.Post)('swap'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [swap_dto_1.SwapDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "swap", null);
exports.WalletController = WalletController = __decorate([
    (0, common_1.Controller)('wallet'),
    __metadata("design:paramtypes", [wallet_service_1.WalletService,
        transaction_service_1.TransactionService,
        swap_service_1.SwapService])
], WalletController);
//# sourceMappingURL=wallet.controller.js.map