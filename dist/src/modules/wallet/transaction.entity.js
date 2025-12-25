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
exports.Transaction = exports.TransactionStatus = exports.TransactionType = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const blockchain_entity_1 = require("../blockchain/blockchain.entity");
const currency_entity_1 = require("../currency/currency.entity");
const user_entity_1 = require("../user/user.entity");
const wallet_entity_1 = require("./wallet.entity");
var TransactionType;
(function (TransactionType) {
    TransactionType["WITHDRAWAL"] = "withdrawal";
    TransactionType["DEPOSIT"] = "deposit";
    TransactionType["NETWORK_FEE"] = "network_fee";
    TransactionType["BALANCE_COLLECTOR"] = "balance_collector";
    TransactionType["SWAP_WITHDRAWAL"] = "swap_withdrawal";
    TransactionType["SWAP_DEPOSIT"] = "swap_deposit";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["WAITING"] = "waiting";
    TransactionStatus["SUCCESS"] = "success";
    TransactionStatus["FAILED"] = "failed";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
let Transaction = class Transaction extends base_entity_1.BaseEntity {
};
exports.Transaction = Transaction;
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'int' }),
    __metadata("design:type", Number)
], Transaction.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Transaction.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'wallet_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Transaction.prototype, "walletId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => wallet_entity_1.Wallet, { onDelete: 'CASCADE', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'wallet_id' }),
    __metadata("design:type", Object)
], Transaction.prototype, "wallet", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'blockchain_id', type: 'int' }),
    __metadata("design:type", Number)
], Transaction.prototype, "blockchainId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => blockchain_entity_1.Blockchain, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'blockchain_id' }),
    __metadata("design:type", blockchain_entity_1.Blockchain)
], Transaction.prototype, "blockchain", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'currency_id', type: 'int' }),
    __metadata("design:type", Number)
], Transaction.prototype, "currencyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => currency_entity_1.Currency, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'currency_id' }),
    __metadata("design:type", currency_entity_1.Currency)
], Transaction.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'char', length: 36, nullable: true }),
    __metadata("design:type", Object)
], Transaction.prototype, "uuid", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'transaction_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], Transaction.prototype, "transactionId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({
        name: 'transaction_hash',
        type: 'varchar',
        length: 100,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Transaction.prototype, "transactionHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], Transaction.prototype, "value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], Transaction.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], Transaction.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'agreed_fee', type: 'float', default: 0 }),
    __metadata("design:type", Number)
], Transaction.prototype, "agreedFee", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'network_fee', type: 'float', default: 0 }),
    __metadata("design:type", Number)
], Transaction.prototype, "networkFee", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'network_fee_currency_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Transaction.prototype, "networkFeeCurrencyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => currency_entity_1.Currency, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'network_fee_currency_id' }),
    __metadata("design:type", Object)
], Transaction.prototype, "networkFeeCurrency", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'confirmations', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Transaction.prototype, "confirmations", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_confirmed', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Transaction.prototype, "isConfirmed", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'external_wallet',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Transaction.prototype, "externalWallet", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 60, nullable: true }),
    __metadata("design:type", Object)
], Transaction.prototype, "memo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", Object)
], Transaction.prototype, "checksum", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Transaction.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Transaction.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Transaction.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Transaction.prototype, "updatedAt", void 0);
exports.Transaction = Transaction = __decorate([
    (0, typeorm_1.Entity)({ name: 'transactions' })
], Transaction);
//# sourceMappingURL=transaction.entity.js.map