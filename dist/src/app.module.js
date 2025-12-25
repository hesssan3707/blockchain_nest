"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const typeorm_options_1 = require("./database/typeorm-options");
const blockchain_module_1 = require("./modules/blockchain/blockchain.module");
const currency_module_1 = require("./modules/currency/currency.module");
const provider_module_1 = require("./modules/provider/provider.module");
const sync_module_1 = require("./modules/sync/sync.module");
const user_module_1 = require("./modules/user/user.module");
const wallet_module_1 = require("./modules/wallet/wallet.module");
const setting_module_1 = require("./modules/setting/setting.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            schedule_1.ScheduleModule.forRoot(),
            typeorm_1.TypeOrmModule.forRootAsync({ useFactory: typeorm_options_1.typeOrmOptions }),
            user_module_1.UserModule,
            blockchain_module_1.BlockchainModule,
            currency_module_1.CurrencyModule,
            wallet_module_1.WalletModule,
            provider_module_1.ProviderModule,
            sync_module_1.SyncModule,
            setting_module_1.SettingModule,
            dashboard_module_1.DashboardModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map