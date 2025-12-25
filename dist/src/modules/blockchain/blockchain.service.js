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
exports.BlockchainService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const blockchain_entity_1 = require("./blockchain.entity");
let BlockchainService = class BlockchainService {
    constructor(blockchainRepo) {
        this.blockchainRepo = blockchainRepo;
    }
    async create(dto) {
        const name = dto.name.trim().toUpperCase();
        const existing = await this.blockchainRepo.findOne({ where: { name } });
        if (existing)
            throw new common_1.BadRequestException('blockchain already exists');
        const blockchain = this.blockchainRepo.create({
            name,
            bpm: dto.bpm ?? 1,
            extraInfo: null,
            isActive: true,
        });
        return this.blockchainRepo.save(blockchain);
    }
    async listActive() {
        return this.blockchainRepo.find({ where: { isActive: true } });
    }
    async listAll() {
        return this.blockchainRepo.find();
    }
    async toggle(symbol, isActive) {
        const blockchain = await this.getByName(symbol);
        if (!blockchain) {
            throw new common_1.NotFoundException({
                data: null,
                message: 'زیرساخت شبکه مورد نظر اماده نیست',
                status: 404
            });
        }
        blockchain.isActive = isActive;
        const msg = isActive ? 'شبکه مورد نظر فعال شد' : 'شبکه مورد نظر غیر فعال شد';
        return this.blockchainRepo.save(blockchain);
    }
    async toggleAll(isActive) {
        const blockchains = await this.blockchainRepo.find();
        for (const blockchain of blockchains) {
            if (blockchain.isActive !== isActive) {
                blockchain.isActive = isActive;
                await this.blockchainRepo.save(blockchain);
            }
        }
    }
    async getByName(name) {
        return this.blockchainRepo.findOne({
            where: { name: name.trim().toUpperCase() },
        });
    }
};
exports.BlockchainService = BlockchainService;
exports.BlockchainService = BlockchainService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(blockchain_entity_1.Blockchain)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], BlockchainService);
//# sourceMappingURL=blockchain.service.js.map