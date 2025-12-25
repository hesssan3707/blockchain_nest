import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blockchain } from './blockchain.entity';
import { BlockchainController } from './blockchain.controller';
import { BlockchainService } from './blockchain.service';
import { BlockHistory } from '../wallet/block-history.entity';
import { Wallet } from '../wallet/wallet.entity';
import { Transaction } from '../wallet/transaction.entity';
import { Currency } from '../currency/currency.entity';
import { ProviderModule } from '../provider/provider.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Blockchain, BlockHistory, Wallet, Transaction, Currency]),
    ProviderModule,
  ],
  controllers: [BlockchainController],
  providers: [BlockchainService],
  exports: [BlockchainService, TypeOrmModule],
})
export class BlockchainModule {}
