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
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wallet_encryption_1 = require("../../common/security/wallet-encryption");
const blockchain_entity_1 = require("../blockchain/blockchain.entity");
const user_entity_1 = require("../user/user.entity");
const wallet_entity_1 = require("./wallet.entity");
const wallet_balance_entity_1 = require("./wallet-balance.entity");
const wallet_generator_service_1 = require("./wallet-generator.service");
let WalletService = class WalletService {
    constructor(walletRepo, balanceRepo, userRepo, blockchainRepo, walletGenerator) {
        this.walletRepo = walletRepo;
        this.balanceRepo = balanceRepo;
        this.userRepo = userRepo;
        this.blockchainRepo = blockchainRepo;
        this.walletGenerator = walletGenerator;
    }
    async getOrCreateWallet(dto) {
        const userIdentifier = dto.userIdentifier.trim();
        const blockchainName = dto.blockchainName.trim().toUpperCase();
        const user = await this.userRepo.findOne({
            where: { identifier: userIdentifier },
        });
        const blockchain = await this.blockchainRepo.findOne({
            where: { name: blockchainName },
        });
        if (!user || !blockchain) {
            throw new common_1.NotFoundException({
                data: null,
                status: 404,
                message: 'User or Blockchain Not Found',
            });
        }
        const existing = await this.walletRepo.findOne({
            where: {
                user: { id: user.id },
                blockchain: { id: blockchain.id },
                isActive: true,
            },
            relations: { user: true, blockchain: true },
        });
        if (existing)
            return existing;
        if (!dto.publicKey) {
            const generated = await this.walletGenerator.generate(blockchainName);
            const wallet = this.walletRepo.create({
                user,
                blockchain,
                publicKey: generated.address,
                privateKey: generated.privateKey ? (0, wallet_encryption_1.encryptWalletData)(generated.privateKey) : null,
                mnemonic: generated.mnemonic ? (0, wallet_encryption_1.encryptWalletData)(generated.mnemonic) : null,
                memo: generated.memo ?? null,
                adminWallet: false,
                exchangeWallet: false,
                isActive: true,
            });
            return this.walletRepo.save(wallet);
        }
        const wallet = this.walletRepo.create({
            user,
            blockchain,
            publicKey: dto.publicKey,
            privateKey: dto.privateKey
                ? (0, wallet_encryption_1.encryptWalletData)(dto.privateKey)
                : null,
            mnemonic: dto.mnemonic ? (0, wallet_encryption_1.encryptWalletData)(dto.mnemonic) : null,
            memo: dto.memo ?? null,
            adminWallet: false,
            exchangeWallet: false,
            description: null,
            isActive: true,
        });
        return this.walletRepo.save(wallet);
    }
    async getWalletAddress(userIdentifier, blockchainName) {
        const wallet = await this.getOrCreateWallet({
            userIdentifier,
            blockchainName,
        });
        return wallet;
    }
    async getBalances(userIdentifier, blockchainName) {
        if (userIdentifier === undefined || userIdentifier === null) {
            throw new common_1.BadRequestException({
                data: null,
                message: 'user_identifier query param is required',
                status: 400,
            });
        }
        const user = await this.userRepo.findOne({ where: { identifier: userIdentifier } });
        if (!user) {
            throw new common_1.NotFoundException({
                data: null,
                message: 'User not found',
                status: 404
            });
        }
        if (blockchainName) {
            const wallet = await this.walletRepo.findOne({
                where: { user: { id: user.id }, blockchain: { name: blockchainName.toUpperCase() }, isActive: true },
                relations: { blockchain: true },
            });
            if (!wallet) {
                throw new common_1.NotFoundException({
                    data: null,
                    message: 'Wallet not found',
                    status: 404
                });
            }
            const wallet_balances = await this.balanceRepo.find({
                where: { wallet: { id: wallet.id } },
                relations: { currency: true },
            });
            const user_assets = {
                blockchain_name: wallet.blockchain.name,
                wallet_address: wallet.publicKey,
                assets: wallet_balances.map(wb => ({
                    currency_symbol: wb.currency.symbol,
                    value: wb.userBalance,
                })),
            };
            return { data: user_assets, message: '', status: 200 };
        }
        else {
            const user_assets = [];
            const wallets = await this.walletRepo.find({
                where: { user: { id: user.id }, isActive: true },
                relations: { blockchain: true },
            });
            for (const wallet of wallets) {
                const wallet_balances = await this.balanceRepo.find({
                    where: { wallet: { id: wallet.id } },
                    relations: { currency: true },
                });
                user_assets.push({
                    blockchain_name: wallet.blockchain.name,
                    wallet_address: wallet.publicKey,
                    assets: wallet_balances.map(wb => ({
                        currency_symbol: wb.currency.symbol,
                        value: wb.userBalance,
                    })),
                });
            }
            return { data: user_assets, message: '', status: 200 };
        }
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wallet_entity_1.Wallet)),
    __param(1, (0, typeorm_1.InjectRepository)(wallet_balance_entity_1.WalletBalance)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(blockchain_entity_1.Blockchain)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        wallet_generator_service_1.WalletGeneratorService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map