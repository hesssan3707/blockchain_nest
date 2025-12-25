import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blockchain } from '../blockchain/blockchain.entity';
import { Currency } from '../currency/currency.entity';
import { User } from '../user/user.entity';
import { BlockHistory } from './block-history.entity';
import { Transaction } from './transaction.entity';
import { Wallet } from './wallet.entity';
import { WalletBalance } from './wallet-balance.entity';
import { Revenue } from './revenue.entity';
import { TransactionService } from './transaction.service';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletTaskService } from './wallet-task.service';
import { SwapService } from './swap.service';
import { WalletGeneratorService } from './wallet-generator.service';
import { PriceModule } from '../price/price.module';
import { SettingModule } from '../setting/setting.module';
import { ProviderModule } from '../provider/provider.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Wallet,
      User,
      Blockchain,
      Currency,
      Transaction,
      BlockHistory,
      WalletBalance,
      Revenue,
    ]),
    PriceModule,
    SettingModule,
    ProviderModule,
  ],
  controllers: [WalletController],
  providers: [
    WalletService,
    TransactionService,
    WalletTaskService,
    SwapService,
    WalletGeneratorService,
  ],
  exports: [
    WalletService,
    TransactionService,
    WalletTaskService,
    SwapService,
    WalletGeneratorService,
    TypeOrmModule,
  ],
})
export class WalletModule {}
