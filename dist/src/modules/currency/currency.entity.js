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
exports.Currency = exports.CurrencyType = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const blockchain_entity_1 = require("../blockchain/blockchain.entity");
var CurrencyType;
(function (CurrencyType) {
    CurrencyType["COIN"] = "coin";
    CurrencyType["TOKEN"] = "token";
})(CurrencyType || (exports.CurrencyType = CurrencyType = {}));
let Currency = class Currency extends base_entity_1.BaseEntity {
};
exports.Currency = Currency;
__decorate([
    (0, typeorm_1.Column)({ name: 'blockchain_id', type: 'int' }),
    __metadata("design:type", Number)
], Currency.prototype, "blockchainId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => blockchain_entity_1.Blockchain, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'blockchain_id' }),
    __metadata("design:type", blockchain_entity_1.Blockchain)
], Currency.prototype, "blockchain", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Currency.prototype, "symbol", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 5 }),
    __metadata("design:type", String)
], Currency.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({
        name: 'token_address',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Currency.prototype, "tokenAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'token_abi', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Currency.prototype, "tokenAbi", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], Currency.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'min_withdrawal_amount', type: 'float', default: 0 }),
    __metadata("design:type", Number)
], Currency.prototype, "minWithdrawalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'min_balance_collector_amount', type: 'float', default: 0 }),
    __metadata("design:type", Number)
], Currency.prototype, "minBalanceCollectorAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Currency.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Currency.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Currency.prototype, "updatedAt", void 0);
exports.Currency = Currency = __decorate([
    (0, typeorm_1.Entity)({ name: 'currencies' }),
    (0, typeorm_1.Unique)('UQ_currency_symbol_blockchain', ['symbol', 'blockchain'])
], Currency);
//# sourceMappingURL=currency.entity.js.map