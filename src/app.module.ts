import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmOptions } from './database/typeorm-options';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { CurrencyModule } from './modules/currency/currency.module';
import { ProviderModule } from './modules/provider/provider.module';
import { SyncModule } from './modules/sync/sync.module';
import { UserModule } from './modules/user/user.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { SettingModule } from './modules/setting/setting.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({ useFactory: typeOrmOptions }),
    UserModule,
    BlockchainModule,
    CurrencyModule,
    WalletModule,
    ProviderModule,
    SyncModule,
    SettingModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
