import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Transaction } from '../wallet/transaction.entity';
import { Wallet } from '../wallet/wallet.entity';
import { Revenue } from '../wallet/revenue.entity';
import { Blockchain } from '../blockchain/blockchain.entity';
import { Currency } from '../currency/currency.entity';
import { BlockHistory } from '../wallet/block-history.entity';
import { User } from '../user/user.entity';
import { Setting } from '../setting/setting.entity';
import { WalletBalance } from '../wallet/wallet-balance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      Wallet,
      Revenue,
      Blockchain,
      Currency,
      BlockHistory,
      User,
      Setting,
      WalletBalance,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
