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
exports.ProviderService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const provider_entity_1 = require("./provider.entity");
let ProviderService = class ProviderService {
    constructor(providerRepo) {
        this.providerRepo = providerRepo;
    }
    async getBestProviderForBlockchain(blockchainName) {
        const name = blockchainName.trim().toUpperCase();
        const providers = await this.providerRepo.find({
            where: { blockchainName: name, isActive: true },
            order: { priority: 'DESC' },
        });
        let best = null;
        let bestScore = 0;
        for (const provider of providers) {
            const score = this.getWorthyScore(provider);
            if (score > bestScore) {
                bestScore = score;
                best = provider;
            }
        }
        return best;
    }
    getWorthyScore(provider) {
        if (!provider.isActive)
            return 0;
        const remaining = provider.freeRequest - provider.todayRequest;
        if (remaining <= 0)
            return 0;
        const failureBudget = provider.failLimit - provider.failRequests;
        if (failureBudget <= 0)
            return 0;
        return provider.priority * remaining * failureBudget;
    }
};
exports.ProviderService = ProviderService;
exports.ProviderService = ProviderService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(provider_entity_1.Provider)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProviderService);
//# sourceMappingURL=provider.service.js.map