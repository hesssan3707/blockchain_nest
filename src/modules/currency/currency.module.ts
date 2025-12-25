import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blockchain } from '../blockchain/blockchain.entity';
import { Currency } from './currency.entity';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';

@Module({
  imports: [TypeOrmModule.forFeature([Currency, Blockchain])],
  controllers: [CurrencyController],
  providers: [CurrencyService],
  exports: [CurrencyService, TypeOrmModule],
})
export class CurrencyModule {}
