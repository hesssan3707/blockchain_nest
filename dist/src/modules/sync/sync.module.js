"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const blockchain_entity_1 = require("../blockchain/blockchain.entity");
const currency_entity_1 = require("../currency/currency.entity");
const provider_module_1 = require("../provider/provider.module");
const wallet_entity_1 = require("../wallet/wallet.entity");
const block_history_entity_1 = require("../wallet/block-history.entity");
const wallet_module_1 = require("../wallet/wallet.module");
const sync_service_1 = require("./sync.service");
const sync_backfill_service_1 = require("./sync-backfill.service");
let SyncModule = class SyncModule {
};
exports.SyncModule = SyncModule;
exports.SyncModule = SyncModule = __decorate([
    (0, common_1.Module)({
        imports: [
            provider_module_1.ProviderModule,
            wallet_module_1.WalletModule,
            typeorm_1.TypeOrmModule.forFeature([blockchain_entity_1.Blockchain, wallet_entity_1.Wallet, currency_entity_1.Currency, block_history_entity_1.BlockHistory]),
        ],
        providers: [sync_service_1.BlockchainSyncService, sync_backfill_service_1.SyncBackfillService],
    })
], SyncModule);
//# sourceMappingURL=sync.module.js.map