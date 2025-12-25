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
exports.BlockHistory = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const blockchain_entity_1 = require("../blockchain/blockchain.entity");
let BlockHistory = class BlockHistory extends base_entity_1.BaseEntity {
};
exports.BlockHistory = BlockHistory;
__decorate([
    (0, typeorm_1.Column)({ name: 'blockchain_id', type: 'int' }),
    __metadata("design:type", Number)
], BlockHistory.prototype, "blockchainId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => blockchain_entity_1.Blockchain, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'blockchain_id' }),
    __metadata("design:type", blockchain_entity_1.Blockchain)
], BlockHistory.prototype, "blockchain", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], BlockHistory.prototype, "number", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], BlockHistory.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], BlockHistory.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], BlockHistory.prototype, "updatedAt", void 0);
exports.BlockHistory = BlockHistory = __decorate([
    (0, typeorm_1.Entity)({ name: 'block_histories' }),
    (0, typeorm_1.Unique)('UQ_blockhistory_blockchain_number', ['blockchainId', 'number'])
], BlockHistory);
//# sourceMappingURL=block-history.entity.js.map