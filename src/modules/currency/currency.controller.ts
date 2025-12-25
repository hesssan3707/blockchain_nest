import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { CurrencyService } from './currency.service';

@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get()
  async list(@Query('blockchain') blockchain?: string) {
    let data;
    if (blockchain) {
      data = await this.currencyService.listByBlockchain(blockchain);
    } else {
      data = await this.currencyService.listAll();
    }
    return {
      data,
      message: 'Currencies retrieved successfully',
      status: 200,
    };
  }

  @Get(':symbol')
  async show(@Param('symbol') symbol: string, @Query('blockchain') blockchain?: string) {
    let data;
    if (blockchain) {
      data = await this.currencyService.getBySymbolAndBlockchain(symbol, blockchain);
    } else {
      data = await this.currencyService.listBySymbol(symbol);
    }
    return {
      data,
      message: 'Currency retrieved successfully',
      status: 200,
    };
  }

  @Post('register')
  async create(@Body() dto: CreateCurrencyDto) {
    const data = await this.currencyService.create(dto);
    return {
      data,
      message: 'Currency registered successfully',
      status: 201,
    };
  }

  @Patch('update')
  async update(@Body() dto: any) {
    const data = await this.currencyService.update(dto);
    return {
      data,
      message: 'Currency updated successfully',
      status: 200,
    };
  }

  @Post('sync')
  async sync(@Body() dto: { currencies: any[] }) {
    await this.currencyService.sync(dto);
    return {
      data: null,
      message: 'Currencies synced successfully',
      status: 200,
    };
  }

  @Post('toggle')
  async toggle(@Body() dto: any) {
    const data = await this.currencyService.toggle(dto);
    return {
      data,
      message: 'Currency status toggled successfully',
      status: 200,
    };
  }
}
