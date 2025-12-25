import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Provider } from './provider.entity';
import { ProviderService } from './provider.service';

@Module({
  imports: [TypeOrmModule.forFeature([Provider])],
  providers: [ProviderService],
  exports: [ProviderService, TypeOrmModule],
})
export class ProviderModule {}
