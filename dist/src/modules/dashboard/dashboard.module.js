"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const dashboard_controller_1 = require("./dashboard.controller");
const dashboard_service_1 = require("./dashboard.service");
const transaction_entity_1 = require("../wallet/transaction.entity");
const wallet_entity_1 = require("../wallet/wallet.entity");
const revenue_entity_1 = require("../wallet/revenue.entity");
const blockchain_entity_1 = require("../blockchain/blockchain.entity");
const currency_entity_1 = require("../currency/currency.entity");
const block_history_entity_1 = require("../wallet/block-history.entity");
const user_entity_1 = require("../user/user.entity");
const setting_entity_1 = require("../setting/setting.entity");
const wallet_balance_entity_1 = require("../wallet/wallet-balance.entity");
let DashboardModule = class DashboardModule {
};
exports.DashboardModule = DashboardModule;
exports.DashboardModule = DashboardModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                transaction_entity_1.Transaction,
                wallet_entity_1.Wallet,
                revenue_entity_1.Revenue,
                blockchain_entity_1.Blockchain,
                currency_entity_1.Currency,
                block_history_entity_1.BlockHistory,
                user_entity_1.User,
                setting_entity_1.Setting,
                wallet_balance_entity_1.WalletBalance,
            ]),
        ],
        controllers: [dashboard_controller_1.DashboardController],
        providers: [dashboard_service_1.DashboardService],
    })
], DashboardModule);
//# sourceMappingURL=dashboard.module.js.map