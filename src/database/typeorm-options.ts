import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { Blockchain } from '../modules/blockchain/blockchain.entity';
import { Currency } from '../modules/currency/currency.entity';
import { Provider } from '../modules/provider/provider.entity';
import { Setting } from '../modules/setting/setting.entity';
import { User } from '../modules/user/user.entity';
import { BlockHistory } from '../modules/wallet/block-history.entity';
import { FeeInventory } from '../modules/wallet/fee-inventory.entity';
import { Revenue } from '../modules/wallet/revenue.entity';
import { Transaction } from '../modules/wallet/transaction.entity';
import { WalletBalance } from '../modules/wallet/wallet-balance.entity';
import { Wallet } from '../modules/wallet/wallet.entity';

export const ormEntities = [
  Blockchain,
  Currency,
  Setting,
  User,
  Wallet,
  WalletBalance,
  Transaction,
  BlockHistory,
  FeeInventory,
  Revenue,
  Provider,
] as const;

export const typeOrmOptions = (): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DB,
  entities: [...ormEntities],
  synchronize: false,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});

export const typeOrmDataSourceOptions = (): DataSourceOptions => ({
  type: 'mysql',
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DB,
  entities: [...ormEntities],
  synchronize: false,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
