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
var SyncBackfillService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncBackfillService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const blockchain_entity_1 = require("../blockchain/blockchain.entity");
const block_history_entity_1 = require("../wallet/block-history.entity");
const sync_service_1 = require("./sync.service");
let SyncBackfillService = SyncBackfillService_1 = class SyncBackfillService {
    constructor(syncService, blockchainRepo, blockHistoryRepo) {
        this.syncService = syncService;
        this.blockchainRepo = blockchainRepo;
        this.blockHistoryRepo = blockHistoryRepo;
        this.logger = new common_1.Logger(SyncBackfillService_1.name);
    }
    async backfillMissingBlocks() {
        this.logger.log('Starting backfill process for missing blocks...');
        const blockchains = await this.blockchainRepo.find({
            where: { isActive: true },
        });
        for (const blockchain of blockchains) {
            try {
                const { missingBlocks, processedUpTo, hasAnyBlocks } = await this.computeMissingBlocks(blockchain);
                if (!hasAnyBlocks)
                    continue;
                if (missingBlocks.length > 0) {
                    this.logger.log(`Backfilling ${missingBlocks.length} blocks for ${blockchain.name}`);
                    await this.syncService.syncBlockchainSpecificBlocks(blockchain, missingBlocks);
                }
                if (processedUpTo > 0) {
                    await this.blockHistoryRepo
                        .createQueryBuilder()
                        .update(block_history_entity_1.BlockHistory)
                        .set({ isActive: false })
                        .where('blockchain_id = :blockchainId', { blockchainId: blockchain.id })
                        .andWhere('number <= :processedUpTo', { processedUpTo })
                        .andWhere('isActive = :isActive', { isActive: true })
                        .execute();
                }
                await this.cleanupOldInactiveBlockHistory();
            }
            catch (err) {
                this.logger.error(`Error in backfill for ${blockchain.name}: ${err.message}`);
            }
        }
    }
    async computeMissingBlocks(blockchain) {
        const rows = await this.blockHistoryRepo.find({
            where: {
                blockchainId: blockchain.id,
                isActive: true
            },
            select: { number: true },
            order: { number: 'ASC' },
            take: 1000,
        });
        if (rows.length < 2) {
            return { missingBlocks: [], processedUpTo: 0, hasAnyBlocks: rows.length > 0 };
        }
        const existing = new Set(rows.map((r) => r.number));
        const min = rows[0].number;
        const max = rows[rows.length - 1].number;
        const missing = [];
        let processedUpTo = min;
        const MAX_MISSING_PER_CYCLE = 50;
        for (let n = min; n <= max; n++) {
            if (!existing.has(n)) {
                missing.push(n);
                if (missing.length >= MAX_MISSING_PER_CYCLE) {
                    break;
                }
            }
            else {
                if (missing.length === 0) {
                    processedUpTo = n;
                }
            }
        }
        return {
            missingBlocks: missing,
            processedUpTo: processedUpTo,
            hasAnyBlocks: true,
        };
    }
    async cleanupOldInactiveBlockHistory() {
        const cutoff = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
        await this.blockHistoryRepo
            .createQueryBuilder()
            .delete()
            .from(block_history_entity_1.BlockHistory)
            .where('isActive = :isActive', { isActive: false })
            .andWhere('createdAt < :cutoff', { cutoff })
            .execute();
    }
};
exports.SyncBackfillService = SyncBackfillService;
__decorate([
    (0, schedule_1.Interval)(1 * 60 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncBackfillService.prototype, "backfillMissingBlocks", null);
exports.SyncBackfillService = SyncBackfillService = SyncBackfillService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(blockchain_entity_1.Blockchain)),
    __param(2, (0, typeorm_1.InjectRepository)(block_history_entity_1.BlockHistory)),
    __metadata("design:paramtypes", [sync_service_1.BlockchainSyncService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SyncBackfillService);
//# sourceMappingURL=sync-backfill.service.js.map