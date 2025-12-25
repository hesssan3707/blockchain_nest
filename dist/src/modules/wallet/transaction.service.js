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
var TransactionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = require("axios");
const hashing_1 = require("../../common/security/hashing");
const blockchain_entity_1 = require("../blockchain/blockchain.entity");
const currency_entity_1 = require("../currency/currency.entity");
const user_entity_1 = require("../user/user.entity");
const wallet_entity_1 = require("./wallet.entity");
const wallet_balance_entity_1 = require("./wallet-balance.entity");
const revenue_entity_1 = require("./revenue.entity");
const price_service_1 = require("../price/price.service");
const transaction_entity_1 = require("./transaction.entity");
let TransactionService = TransactionService_1 = class TransactionService {
    constructor(txRepo, userRepo, blockchainRepo, currencyRepo, walletRepo, balanceRepo, revenueRepo, priceService) {
        this.txRepo = txRepo;
        this.userRepo = userRepo;
        this.blockchainRepo = blockchainRepo;
        this.currencyRepo = currencyRepo;
        this.walletRepo = walletRepo;
        this.balanceRepo = balanceRepo;
        this.revenueRepo = revenueRepo;
        this.priceService = priceService;
        this.logger = new common_1.Logger(TransactionService_1.name);
    }
    async processConfirmedTransaction(tx, networkFee, networkFeeCurrency) {
        tx.status = transaction_entity_1.TransactionStatus.SUCCESS;
        tx.isConfirmed = true;
        tx.networkFee = networkFee;
        if (networkFeeCurrency) {
            tx.networkFeeCurrency = networkFeeCurrency;
            tx.networkFeeCurrencyId = networkFeeCurrency.id;
        }
        await this.txRepo.save(tx);
        await this.updateWalletBalance(tx);
        if (tx.type === transaction_entity_1.TransactionType.WITHDRAWAL || tx.type === transaction_entity_1.TransactionType.BALANCE_COLLECTOR) {
            const revenue = new revenue_entity_1.Revenue();
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
            try {
                const agreedFeeUsd = await this.priceService.convertToUsd(tx.currency.symbol, tx.agreedFee);
                const networkFeeCurrencySymbol = networkFeeCurrency ? networkFeeCurrency.symbol : (tx.blockchain.name === 'TRON' ? 'TRX' : tx.blockchain.name);
                const networkFeeUsd = await this.priceService.convertToUsd(networkFeeCurrencySymbol, tx.networkFee);
                revenue.revenue = agreedFeeUsd - networkFeeUsd;
                revenue.description = `Revenue from ${tx.type}: ${tx.agreedFee} ${tx.currency.symbol} (agreed) - ${tx.networkFee} ${networkFeeCurrencySymbol} (network)`;
            }
            catch (error) {
                this.logger.error(`Failed to calculate revenue USD for tx ${tx.id}: ${error.message}`);
                revenue.revenue = 0;
            }
            await this.revenueRepo.save(revenue);
        }
    }
    async updateWalletBalance(tx) {
        if (!tx.walletId || tx.status !== transaction_entity_1.TransactionStatus.SUCCESS)
            return;
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
        if (tx.type === transaction_entity_1.TransactionType.DEPOSIT) {
            balance.userBalance += tx.value;
            balance.networkBalance += tx.value;
        }
        else if (tx.type === transaction_entity_1.TransactionType.WITHDRAWAL) {
            balance.userBalance -= (tx.value + tx.agreedFee);
            balance.networkBalance -= tx.value;
        }
        else if (tx.type === transaction_entity_1.TransactionType.BALANCE_COLLECTOR) {
            balance.networkBalance -= tx.value;
        }
        await this.balanceRepo.save(balance);
        if (tx.networkFee > 0 && (tx.type === transaction_entity_1.TransactionType.WITHDRAWAL || tx.type === transaction_entity_1.TransactionType.BALANCE_COLLECTOR)) {
            const feeCurrencyId = tx.networkFeeCurrencyId || tx.currencyId;
            if (feeCurrencyId === tx.currencyId) {
                balance.networkBalance -= tx.networkFee;
                await this.balanceRepo.save(balance);
            }
            else {
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
    async setStatusByHash(transactionHash, status, description) {
        const updateData = { status };
        if (description) {
            updateData.description = description;
        }
        await this.txRepo
            .createQueryBuilder()
            .update(transaction_entity_1.Transaction)
            .set(updateData)
            .where('transaction_hash = :transactionHash', { transactionHash })
            .execute();
    }
    async getByIds(ids) {
        if (!ids) {
            throw new common_1.BadRequestException({
                data: null,
                message: 'No valid ids provided',
                status: 400
            });
        }
        const idArray = Array.isArray(ids) ? ids : [ids];
        const transactions = await this.txRepo.find({
            where: { transactionId: (0, typeorm_2.In)(idArray) },
            relations: { user: true, blockchain: true, currency: true },
        });
        if (transactions.length === 0) {
            throw new common_1.NotFoundException({
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
    async listByUser(userIdentifier) {
        return this.txRepo.find({
            where: { user: { identifier: userIdentifier } },
            relations: { blockchain: true, currency: true },
            order: { createdAt: 'DESC' },
        });
    }
    async store(dto) {
        const user = await this.userRepo.findOne({ where: { identifier: dto.user_identifier } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        const blockchain = await this.blockchainRepo.findOne({ where: { name: dto.blockchain_name.toUpperCase() } });
        if (!blockchain)
            throw new common_1.BadRequestException('Blockchain not found');
        const currency = await this.currencyRepo.findOne({
            where: { symbol: dto.currency_symbol.toUpperCase(), blockchain: { id: blockchain.id } },
        });
        if (!currency)
            throw new common_1.BadRequestException('Currency not found for this blockchain');
        if (dto.transaction_id) {
            const existingTx = await this.txRepo.findOne({
                where: { transactionId: dto.transaction_id.toString() }
            });
            if (existingTx) {
                throw new common_1.BadRequestException('A transaction with this transaction_id already exists.');
            }
        }
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
            type: transaction_entity_1.TransactionType.WITHDRAWAL,
            status: transaction_entity_1.TransactionStatus.WAITING,
            agreedFee: parseFloat(dto.agreed_fee || 0),
            externalWallet: dto.wallet_address,
            description: dto.description || null,
            isActive: true,
            checksum: (0, hashing_1.md5Hex)(`${currency.id}${blockchain.id}${dto.transaction_id}${dto.amount}${transaction_entity_1.TransactionType.WITHDRAWAL}`),
        });
        await this.txRepo.save(tx);
        return {
            data: tx.transactionId,
            message: 'Created Successfully',
            status: 200
        };
    }
    async createIfNotExists(input) {
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
            if (input.status === transaction_entity_1.TransactionStatus.SUCCESS && existing.status !== transaction_entity_1.TransactionStatus.SUCCESS) {
                existing.status = transaction_entity_1.TransactionStatus.SUCCESS;
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
        if (input.status === transaction_entity_1.TransactionStatus.SUCCESS && !description) {
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
            isConfirmed: input.isConfirmed ?? (input.status === transaction_entity_1.TransactionStatus.SUCCESS),
            checksum: (0, hashing_1.md5Hex)(checksumData),
            isActive: true,
            agreedFee: input.agreedFee ?? 0,
            networkFee: 0,
        });
        const savedTx = await this.txRepo.save(tx);
        if (savedTx.status === transaction_entity_1.TransactionStatus.SUCCESS) {
            await this.updateWalletBalance(savedTx);
        }
        const callbackUrl = process.env.TRANSACTION_CALLBACK_URL;
        if (callbackUrl) {
            this.sendTransactionCallback(callbackUrl, savedTx).catch(err => {
                this.logger.error(`Failed to send transaction callback for ${savedTx.transactionHash}: ${err.message}`);
            });
        }
        return savedTx;
    }
    async sendTransactionCallback(url, tx) {
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
        await axios_1.default.post(url, payload, { timeout: 5000 });
    }
};
exports.TransactionService = TransactionService;
exports.TransactionService = TransactionService = TransactionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(blockchain_entity_1.Blockchain)),
    __param(3, (0, typeorm_1.InjectRepository)(currency_entity_1.Currency)),
    __param(4, (0, typeorm_1.InjectRepository)(wallet_entity_1.Wallet)),
    __param(5, (0, typeorm_1.InjectRepository)(wallet_balance_entity_1.WalletBalance)),
    __param(6, (0, typeorm_1.InjectRepository)(revenue_entity_1.Revenue)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        price_service_1.PriceService])
], TransactionService);
//# sourceMappingURL=transaction.service.js.map