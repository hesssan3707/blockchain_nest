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
exports.BlockchainController = void 0;
const common_1 = require("@nestjs/common");
const create_blockchain_dto_1 = require("./dto/create-blockchain.dto");
const blockchain_service_1 = require("./blockchain.service");
let BlockchainController = class BlockchainController {
    constructor(blockchainService) {
        this.blockchainService = blockchainService;
    }
    async list() {
        const blockchains = await this.blockchainService.listAll();
        return {
            data: blockchains,
            message: 'Blockchains retrieved successfully',
            status: 200,
        };
    }
    async toggle(body) {
        const isActive = typeof body.is_active === 'number' ? body.is_active === 1 : body.is_active;
        const blockchain = await this.blockchainService.toggle(body.symbol, isActive);
        const message = isActive ? 'Blockchain activated' : 'Blockchain deactivated';
        return {
            data: blockchain,
            message,
            status: 200,
        };
    }
    async toggleAll(body) {
        const isActive = typeof body.is_active === 'number' ? body.is_active === 1 : body.is_active;
        await this.blockchainService.toggleAll(isActive);
        const message = isActive ? 'All blockchains activated' : 'All blockchains deactivated';
        return {
            data: null,
            message,
            status: 200,
        };
    }
    async create(dto) {
        const blockchain = await this.blockchainService.create(dto);
        return {
            data: blockchain,
            message: 'Blockchain registered successfully',
            status: 201,
        };
    }
};
exports.BlockchainController = BlockchainController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BlockchainController.prototype, "list", null);
__decorate([
    (0, common_1.Post)('toggle'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BlockchainController.prototype, "toggle", null);
__decorate([
    (0, common_1.Post)('toggle-all'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BlockchainController.prototype, "toggleAll", null);
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_blockchain_dto_1.CreateBlockchainDto]),
    __metadata("design:returntype", Promise)
], BlockchainController.prototype, "create", null);
exports.BlockchainController = BlockchainController = __decorate([
    (0, common_1.Controller)('blockchain'),
    __metadata("design:paramtypes", [blockchain_service_1.BlockchainService])
], BlockchainController);
//# sourceMappingURL=blockchain.controller.js.map