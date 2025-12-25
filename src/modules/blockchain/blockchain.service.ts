import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blockchain } from './blockchain.entity';
import { CreateBlockchainDto } from './dto/create-blockchain.dto';

@Injectable()
export class BlockchainService {
  constructor(
    @InjectRepository(Blockchain)
    private readonly blockchainRepo: Repository<Blockchain>,
  ) {}

  async create(dto: CreateBlockchainDto): Promise<Blockchain> {
    const name = dto.name.trim().toUpperCase();
    const existing = await this.blockchainRepo.findOne({ where: { name } });
    if (existing) throw new BadRequestException('blockchain already exists');

    const blockchain = this.blockchainRepo.create({
      name,
      bpm: dto.bpm ?? 1,
      extraInfo: null,
      isActive: true,
    });
    return this.blockchainRepo.save(blockchain);
  }

  async listActive(): Promise<Blockchain[]> {
    return this.blockchainRepo.find({ where: { isActive: true } });
  }

  async listAll(): Promise<Blockchain[]> {
    return this.blockchainRepo.find();
  }

  async toggle(symbol: string, isActive: boolean): Promise<Blockchain> {
    const blockchain = await this.getByName(symbol);
    if (!blockchain) {
      throw new NotFoundException({
        data: null,
        message: 'زیرساخت شبکه مورد نظر اماده نیست',
        status: 404
      });
    }

    blockchain.isActive = isActive;
    const msg = isActive ? 'شبکه مورد نظر فعال شد' : 'شبکه مورد نظر غیر فعال شد';
    // Note: PeriodicTask management is handled by Celery Beat which would be a separate service in NestJS
    // but for now we focus on the status and messages.
    return this.blockchainRepo.save(blockchain);
  }

  async toggleAll(isActive: boolean): Promise<void> {
    const blockchains = await this.blockchainRepo.find();
    for (const blockchain of blockchains) {
      if (blockchain.isActive !== isActive) {
        blockchain.isActive = isActive;
        await this.blockchainRepo.save(blockchain);
      }
    }
  }

  async getByName(name: string): Promise<Blockchain | null> {
    return this.blockchainRepo.findOne({
      where: { name: name.trim().toUpperCase() },
    });
  }
}
