import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateBlockchainDto } from './dto/create-blockchain.dto';
import { BlockchainService } from './blockchain.service';

@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Get()
  async list() {
    const blockchains = await this.blockchainService.listAll();
    return {
      data: blockchains,
      message: 'Blockchains retrieved successfully',
      status: 200,
    };
  }

  @Post('toggle')
  async toggle(@Body() body: { symbol: string; is_active: number | boolean }) {
    const isActive = typeof body.is_active === 'number' ? body.is_active === 1 : body.is_active;
    const blockchain = await this.blockchainService.toggle(body.symbol, isActive);
    const message = isActive ? 'Blockchain activated' : 'Blockchain deactivated';
    return {
      data: blockchain,
      message,
      status: 200,
    };
  }

  @Post('toggle-all')
  async toggleAll(@Body() body: { is_active: number | boolean }) {
    const isActive = typeof body.is_active === 'number' ? body.is_active === 1 : body.is_active;
    await this.blockchainService.toggleAll(isActive);
    const message = isActive ? 'All blockchains activated' : 'All blockchains deactivated';
    return {
      data: null,
      message,
      status: 200,
    };
  }

  @Post('register')
  async create(@Body() dto: CreateBlockchainDto) {
    const blockchain = await this.blockchainService.create(dto);
    return {
      data: blockchain,
      message: 'Blockchain registered successfully',
      status: 201,
    };
  }
}
