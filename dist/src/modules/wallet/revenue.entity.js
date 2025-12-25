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
exports.Revenue = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const blockchain_entity_1 = require("../blockchain/blockchain.entity");
const currency_entity_1 = require("../currency/currency.entity");
const user_entity_1 = require("../user/user.entity");
const transaction_entity_1 = require("./transaction.entity");
let Revenue = class Revenue extends base_entity_1.BaseEntity {
};
exports.Revenue = Revenue;
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'int' }),
    __metadata("design:type", Number)
], Revenue.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Revenue.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'blockchain_id', type: 'int' }),
    __metadata("design:type", Number)
], Revenue.prototype, "blockchainId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => blockchain_entity_1.Blockchain, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'blockchain_id' }),
    __metadata("design:type", blockchain_entity_1.Blockchain)
], Revenue.prototype, "blockchain", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'currency_id', type: 'int' }),
    __metadata("design:type", Number)
], Revenue.prototype, "currencyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => currency_entity_1.Currency, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'currency_id' }),
    __metadata("design:type", currency_entity_1.Currency)
], Revenue.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'transaction_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Revenue.prototype, "transactionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => transaction_entity_1.Transaction, { onDelete: 'CASCADE', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'transaction_id' }),
    __metadata("design:type", Object)
], Revenue.prototype, "transaction", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'agreed_fee', type: 'float', default: 0 }),
    __metadata("design:type", Number)
], Revenue.prototype, "agreedFee", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'network_fee', type: 'float', default: 0 }),
    __metadata("design:type", Number)
], Revenue.prototype, "networkFee", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'network_fee_currency_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Revenue.prototype, "networkFeeCurrencyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => currency_entity_1.Currency, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'network_fee_currency_id' }),
    __metadata("design:type", Object)
], Revenue.prototype, "networkFeeCurrency", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'revenue', type: 'float', default: 0 }),
    __metadata("design:type", Number)
], Revenue.prototype, "revenue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'description', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Revenue.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Revenue.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Revenue.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Revenue.prototype, "updatedAt", void 0);
exports.Revenue = Revenue = __decorate([
    (0, typeorm_1.Entity)({ name: 'revenues' })
], Revenue);
//# sourceMappingURL=revenue.entity.js.map