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
exports.Provider = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
let Provider = class Provider extends base_entity_1.BaseEntity {
};
exports.Provider = Provider;
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], Provider.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'blockchain_name', type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], Provider.prototype, "blockchainName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Provider.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'api_key', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Provider.prototype, "apiKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Provider.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'free_request', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Provider.prototype, "freeRequest", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'today_request', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Provider.prototype, "todayRequest", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fail_limit', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Provider.prototype, "failLimit", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fail_requests', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Provider.prototype, "failRequests", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'extra_info', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Provider.prototype, "extraInfo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Provider.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Provider.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Provider.prototype, "updatedAt", void 0);
exports.Provider = Provider = __decorate([
    (0, typeorm_1.Entity)({ name: 'providers' })
], Provider);
//# sourceMappingURL=provider.entity.js.map