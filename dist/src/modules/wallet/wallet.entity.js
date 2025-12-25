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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const blockchain_entity_1 = require("../blockchain/blockchain.entity");
const user_entity_1 = require("../user/user.entity");
const wallet_balance_entity_1 = require("./wallet-balance.entity");
let Wallet = class Wallet extends base_entity_1.BaseEntity {
};
exports.Wallet = Wallet;
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'int' }),
    __metadata("design:type", Number)
], Wallet.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Wallet.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'blockchain_id', type: 'int' }),
    __metadata("design:type", Number)
], Wallet.prototype, "blockchainId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => blockchain_entity_1.Blockchain, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'blockchain_id' }),
    __metadata("design:type", blockchain_entity_1.Blockchain)
], Wallet.prototype, "blockchain", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => wallet_balance_entity_1.WalletBalance, (balance) => balance.wallet),
    __metadata("design:type", Array)
], Wallet.prototype, "balances", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'public_key', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Wallet.prototype, "publicKey", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'private_key', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Wallet.prototype, "privateKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Wallet.prototype, "mnemonic", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Wallet.prototype, "memo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'admin_wallet', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Wallet.prototype, "adminWallet", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'exchange_wallet', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Wallet.prototype, "exchangeWallet", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Wallet.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Wallet.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Wallet.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Wallet.prototype, "updatedAt", void 0);
exports.Wallet = Wallet = __decorate([
    (0, typeorm_1.Entity)({ name: 'wallets' }),
    (0, typeorm_1.Unique)('UQ_wallet_user_blockchain', ['user', 'blockchain'])
], Wallet);
//# sourceMappingURL=wallet.entity.js.map