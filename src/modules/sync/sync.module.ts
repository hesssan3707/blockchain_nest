import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blockchain } from '../blockchain/blockchain.entity';
import { Currency } from '../currency/currency.entity';
import { ProviderModule } from '../provider/provider.module';
import { Wallet } from '../wallet/wallet.entity';
import { BlockHistory } from '../wallet/block-history.entity';
import { WalletModule } from '../wallet/wallet.module';
import { BlockchainSyncService } from './sync.service';
import { SyncBackfillService } from './sync-backfill.service';

@Module({
  imports: [
    ProviderModule,
    WalletModule,
    TypeOrmModule.forFeature([Blockchain, Wallet, Currency, BlockHistory]),
  ],
  providers: [BlockchainSyncService, SyncBackfillService],
})
export class SyncModule {}
