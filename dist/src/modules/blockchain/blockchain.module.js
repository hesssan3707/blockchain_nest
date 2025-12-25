"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const blockchain_entity_1 = require("./blockchain.entity");
const blockchain_controller_1 = require("./blockchain.controller");
const blockchain_service_1 = require("./blockchain.service");
const block_history_entity_1 = require("../wallet/block-history.entity");
const wallet_entity_1 = require("../wallet/wallet.entity");
const transaction_entity_1 = require("../wallet/transaction.entity");
const currency_entity_1 = require("../currency/currency.entity");
const provider_module_1 = require("../provider/provider.module");
let BlockchainModule = class BlockchainModule {
};
exports.BlockchainModule = BlockchainModule;
exports.BlockchainModule = BlockchainModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([blockchain_entity_1.Blockchain, block_history_entity_1.BlockHistory, wallet_entity_1.Wallet, transaction_entity_1.Transaction, currency_entity_1.Currency]),
            provider_module_1.ProviderModule,
        ],
        controllers: [blockchain_controller_1.BlockchainController],
        providers: [blockchain_service_1.BlockchainService],
        exports: [blockchain_service_1.BlockchainService, typeorm_1.TypeOrmModule],
    })
], BlockchainModule);
//# sourceMappingURL=blockchain.module.js.map