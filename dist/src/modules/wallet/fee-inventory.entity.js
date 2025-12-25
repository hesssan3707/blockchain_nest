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
exports.FeeInventory = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const wallet_entity_1 = require("./wallet.entity");
let FeeInventory = class FeeInventory extends base_entity_1.BaseEntity {
};
exports.FeeInventory = FeeInventory;
__decorate([
    (0, typeorm_1.Column)({ name: 'wallet_id', type: 'int' }),
    __metadata("design:type", Number)
], FeeInventory.prototype, "walletId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => wallet_entity_1.Wallet, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'wallet_id' }),
    __metadata("design:type", wallet_entity_1.Wallet)
], FeeInventory.prototype, "wallet", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 0 }),
    __metadata("design:type", Number)
], FeeInventory.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], FeeInventory.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], FeeInventory.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], FeeInventory.prototype, "updatedAt", void 0);
exports.FeeInventory = FeeInventory = __decorate([
    (0, typeorm_1.Entity)({ name: 'fee_inventories' }),
    (0, typeorm_1.Unique)('UQ_feeinventory_wallet', ['wallet'])
], FeeInventory);
//# sourceMappingURL=fee-inventory.entity.js.map