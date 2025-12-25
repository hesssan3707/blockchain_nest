"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const blockchain_entity_1 = require("../blockchain/blockchain.entity");
const currency_entity_1 = require("../currency/currency.entity");
const user_entity_1 = require("../user/user.entity");
const block_history_entity_1 = require("./block-history.entity");
const transaction_entity_1 = require("./transaction.entity");
const wallet_entity_1 = require("./wallet.entity");
const wallet_balance_entity_1 = require("./wallet-balance.entity");
const revenue_entity_1 = require("./revenue.entity");
const transaction_service_1 = require("./transaction.service");
const wallet_controller_1 = require("./wallet.controller");
const wallet_service_1 = require("./wallet.service");
const wallet_task_service_1 = require("./wallet-task.service");
const swap_service_1 = require("./swap.service");
const wallet_generator_service_1 = require("./wallet-generator.service");
const price_module_1 = require("../price/price.module");
const setting_module_1 = require("../setting/setting.module");
const provider_module_1 = require("../provider/provider.module");
let WalletModule = class WalletModule {
};
exports.WalletModule = WalletModule;
exports.WalletModule = WalletModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                wallet_entity_1.Wallet,
                user_entity_1.User,
                blockchain_entity_1.Blockchain,
                currency_entity_1.Currency,
                transaction_entity_1.Transaction,
                block_history_entity_1.BlockHistory,
                wallet_balance_entity_1.WalletBalance,
                revenue_entity_1.Revenue,
            ]),
            price_module_1.PriceModule,
            setting_module_1.SettingModule,
            provider_module_1.ProviderModule,
        ],
        controllers: [wallet_controller_1.WalletController],
        providers: [
            wallet_service_1.WalletService,
            transaction_service_1.TransactionService,
            wallet_task_service_1.WalletTaskService,
            swap_service_1.SwapService,
            wallet_generator_service_1.WalletGeneratorService,
        ],
        exports: [
            wallet_service_1.WalletService,
            transaction_service_1.TransactionService,
            wallet_task_service_1.WalletTaskService,
            swap_service_1.SwapService,
            wallet_generator_service_1.WalletGeneratorService,
            typeorm_1.TypeOrmModule,
        ],
    })
], WalletModule);
//# sourceMappingURL=wallet.module.js.map