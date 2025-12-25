"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeOrmDataSourceOptions = exports.typeOrmOptions = exports.ormEntities = void 0;
const blockchain_entity_1 = require("../modules/blockchain/blockchain.entity");
const currency_entity_1 = require("../modules/currency/currency.entity");
const provider_entity_1 = require("../modules/provider/provider.entity");
const setting_entity_1 = require("../modules/setting/setting.entity");
const user_entity_1 = require("../modules/user/user.entity");
const block_history_entity_1 = require("../modules/wallet/block-history.entity");
const fee_inventory_entity_1 = require("../modules/wallet/fee-inventory.entity");
const revenue_entity_1 = require("../modules/wallet/revenue.entity");
const transaction_entity_1 = require("../modules/wallet/transaction.entity");
const wallet_balance_entity_1 = require("../modules/wallet/wallet-balance.entity");
const wallet_entity_1 = require("../modules/wallet/wallet.entity");
exports.ormEntities = [
    blockchain_entity_1.Blockchain,
    currency_entity_1.Currency,
    setting_entity_1.Setting,
    user_entity_1.User,
    wallet_entity_1.Wallet,
    wallet_balance_entity_1.WalletBalance,
    transaction_entity_1.Transaction,
    block_history_entity_1.BlockHistory,
    fee_inventory_entity_1.FeeInventory,
    revenue_entity_1.Revenue,
    provider_entity_1.Provider,
];
const typeOrmOptions = () => ({
    type: 'mysql',
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB,
    entities: [...exports.ormEntities],
    synchronize: false,
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
exports.typeOrmOptions = typeOrmOptions;
const typeOrmDataSourceOptions = () => ({
    type: 'mysql',
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB,
    entities: [...exports.ormEntities],
    synchronize: false,
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
exports.typeOrmDataSourceOptions = typeOrmDataSourceOptions;
//# sourceMappingURL=typeorm-options.js.map