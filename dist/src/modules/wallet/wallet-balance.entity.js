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
exports.WalletBalance = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const currency_entity_1 = require("../currency/currency.entity");
const wallet_entity_1 = require("./wallet.entity");
let WalletBalance = class WalletBalance extends base_entity_1.BaseEntity {
};
exports.WalletBalance = WalletBalance;
__decorate([
    (0, typeorm_1.Column)({ name: 'wallet_id', type: 'int' }),
    __metadata("design:type", Number)
], WalletBalance.prototype, "walletId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => wallet_entity_1.Wallet, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'wallet_id' }),
    __metadata("design:type", wallet_entity_1.Wallet)
], WalletBalance.prototype, "wallet", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'currency_id', type: 'int' }),
    __metadata("design:type", Number)
], WalletBalance.prototype, "currencyId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => currency_entity_1.Currency, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'currency_id' }),
    __metadata("design:type", currency_entity_1.Currency)
], WalletBalance.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_balance', type: 'float', default: 0 }),
    __metadata("design:type", Number)
], WalletBalance.prototype, "userBalance", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'network_balance', type: 'float', default: 0 }),
    __metadata("design:type", Number)
], WalletBalance.prototype, "networkBalance", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], WalletBalance.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], WalletBalance.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], WalletBalance.prototype, "updatedAt", void 0);
exports.WalletBalance = WalletBalance = __decorate([
    (0, typeorm_1.Entity)({ name: 'wallet_balances' })
], WalletBalance);
//# sourceMappingURL=wallet-balance.entity.js.map