import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blockchain } from '../blockchain/blockchain.entity';
import { Currency, CurrencyType } from './currency.entity';
import { CreateCurrencyDto } from './dto/create-currency.dto';

@Injectable()
export class CurrencyService {
  constructor(
    @InjectRepository(Currency)
    private readonly currencyRepo: Repository<Currency>,
    @InjectRepository(Blockchain)
    private readonly blockchainRepo: Repository<Blockchain>,
  ) {}

  async create(dto: CreateCurrencyDto): Promise<Currency> {
    const blockchainName = dto.blockchain.trim().toUpperCase();
    const blockchain = await this.blockchainRepo.findOne({
      where: { name: blockchainName },
    });
    if (!blockchain) throw new NotFoundException('بلاکچین مورد نظر یافت نشد');

    const symbol = dto.symbol.trim().toUpperCase();
    const token_address = dto.token_address;
    const token_abi = dto.token_abi;

    // Cross-field validation for token address and ABI
    if ((token_address && !token_abi) || (token_abi && !token_address)) {
      throw new BadRequestException('ادرس توکن و abi توکن باید باهم پرشده باشند');
    }

    const type = (token_address && token_abi) ? CurrencyType.TOKEN : CurrencyType.COIN;

    // Check if coin already exists on this blockchain
    if (type === CurrencyType.COIN) {
      const existingCoin = await this.currencyRepo.findOne({
        where: { blockchain: { id: blockchain.id }, type: CurrencyType.COIN },
      });
      if (existingCoin) {
        throw new ConflictException(` روی شبکه '${blockchainName}' یک ارز به عنوان کوین تعریف شده است `);
      }
    }

    // Check if symbol + blockchain exists
    const existing = await this.currencyRepo.findOne({
      where: { symbol, blockchain: { id: blockchain.id } },
    });
    if (existing) throw new ConflictException('Currency already exists.');

    const currency = this.currencyRepo.create({
      symbol,
      blockchain,
      type,
      tokenAddress: token_address ?? null,
      tokenAbi: token_abi ?? null,
      priority: 1,
      minWithdrawalAmount: dto.min_withdrawal_amount,
      minBalanceCollectorAmount: dto.min_balance_collector_amount,
      isActive: true,
    });
    return this.currencyRepo.save(currency);
  }

  async listByBlockchain(blockchainName: string): Promise<Currency[]> {
    return this.currencyRepo.find({
      where: {
        blockchain: { name: blockchainName.trim().toUpperCase() },
      },
      relations: { blockchain: true },
      order: { priority: 'ASC' },
    });
  }

  async listAll(): Promise<Currency[]> {
    return this.currencyRepo.find({ relations: { blockchain: true } });
  }

  async listBySymbol(symbol: string): Promise<Currency[]> {
    return this.currencyRepo.find({
      where: { symbol: symbol.trim().toUpperCase() },
      relations: { blockchain: true },
    });
  }

  async getBySymbolAndBlockchain(symbol: string, blockchainName: string): Promise<Currency | null> {
    return this.currencyRepo.findOne({
      where: {
        symbol: symbol.trim().toUpperCase(),
        blockchain: { name: blockchainName.trim().toUpperCase() },
      },
      relations: { blockchain: true },
    });
  }

  async update(dto: any): Promise<Currency> {
    const symbol = dto.symbol.trim().toUpperCase();
    const blockchain_name = dto.blockchain.trim();

    const currency = await this.getBySymbolAndBlockchain(symbol, blockchain_name);
    if (!currency) throw new NotFoundException('ارز مورد روی شبکه وارد شده یافت نشد');

    if (dto.token_address !== undefined) {
      if (dto.token_address !== null && dto.token_address.trim() === '') {
        throw new BadRequestException('ادرس توکن وارد شده معتبر نیست');
      }

      // Check if this token address is already registered elsewhere
      const existing = await this.currencyRepo.createQueryBuilder('currency')
        .leftJoinAndSelect('currency.blockchain', 'blockchain')
        .where('currency.tokenAddress = :address', { address: dto.token_address })
        .andWhere('(LOWER(currency.symbol) != LOWER(:symbol) OR LOWER(blockchain.name) != LOWER(:blockchain))', {
          symbol,
          blockchain: blockchain_name
        })
        .getOne();

      if (existing) {
        throw new BadRequestException('در حال حاضر ارز دیجیتالی با این ادرس توکن ثبت شده است');
      }

      currency.tokenAddress = dto.token_address;
    }

    if (dto.min_withdrawal_amount !== undefined) currency.minWithdrawalAmount = dto.min_withdrawal_amount;
    if (dto.min_balance_collector_amount !== undefined) currency.minBalanceCollectorAmount = dto.min_balance_collector_amount;
    if (dto.is_active !== undefined) currency.isActive = dto.is_active === 1 || dto.is_active === true;
    if (dto.token_abi !== undefined) currency.tokenAbi = dto.token_abi;

    return this.currencyRepo.save(currency);
  }

  async toggle(dto: any): Promise<Currency> {
    const symbol = dto.symbol.trim().toUpperCase();
    const blockchain_name = dto.blockchain;
    const is_active = dto.is_active;

    if (is_active) {
      const currencies = await this.currencyRepo.find({
        where: { symbol },
        relations: { blockchain: true }
      });

      for (const currency of currencies) {
        if (currency.type === CurrencyType.COIN) {
          const coin_exists = await this.currencyRepo.findOne({
            where: {
              blockchain: { id: currency.blockchain.id },
              type: CurrencyType.COIN,
              isActive: true
            },
          });

          if (coin_exists && coin_exists.id !== currency.id) {
            throw new BadRequestException(
              ` روی شبکه '${currency.blockchain.name}' در حال حاظر یک ارز از نوع کوین تعریف شده است.امکان ثبت کوین جدید روی این شبکه وجود ندارد `
            );
          }
        }
      }
    }

    const currency = await this.getBySymbolAndBlockchain(symbol, blockchain_name || 'BSC');
    if (!currency) {
      const currencies = await this.currencyRepo.find({ where: { symbol } });
      if (currencies.length === 0) throw new NotFoundException('Currency not found');
      for (const c of currencies) {
        c.isActive = is_active;
        await this.currencyRepo.save(c);
      }
      return currencies[0];
    }
    currency.isActive = is_active;
    return this.currencyRepo.save(currency);
  }

  async sync(dto: { currencies: any[] }): Promise<void> {
    const seen_addresses = new Set<string>();
    const seen_coin_blockchains = new Set<string>();

    for (const item of dto.currencies) {
      const symbol = item.symbol.trim().toUpperCase();
      const blockchain_name = item.blockchain.trim();
      const token_address = item.token_address;
      const token_abi = item.token_abi;

      // Duplicate token address in request check
      if (token_address) {
        if (seen_addresses.has(token_address)) {
          throw new BadRequestException(`توکن ادرس ${token_address} دو بار وارد شده است .توکن ادرس باید یکتا باشد`);
        }
        seen_addresses.add(token_address);
      }

      // Token address and ABI cross check
      if (token_address || token_abi) {
        if (!token_address || !token_abi) {
          throw new BadRequestException("ادرس توکن و abi توکن باید باهم پرشده باشند");
        }
        if (Object.keys(token_abi).length > 100) {
          throw new BadRequestException("تعداد توابع داخل token_abi نباید بیشتر از 100 تا باشد.");
        }
      }

      // Coin blockchain uniqueness in request and DB
      if (!token_address && !token_abi) {
        if (seen_coin_blockchains.has(blockchain_name)) {
          throw new BadRequestException(`روی هر شبکه فقط یک کوین میتواند ثبت شود`);
        }
        seen_coin_blockchains.add(blockchain_name);

        const existing_coin = await this.currencyRepo.findOne({
          where: {
            blockchain: { name: blockchain_name },
            type: CurrencyType.COIN,
            isActive: true
          },
          relations: { blockchain: true }
        });

        if (existing_coin && existing_coin.symbol !== symbol) {
          throw new BadRequestException(
            ` روی شبکه '${blockchain_name}' یک ارز از نوع کوین ثبت شده است . هر شبکه یک کوین میتواند داشته باشد `
          );
        }
      }

      const existing = await this.getBySymbolAndBlockchain(symbol, blockchain_name);
      if (existing) {
        if (item.min_withdrawal_amount !== undefined) existing.minWithdrawalAmount = item.min_withdrawal_amount;
        if (item.min_balance_collector_amount !== undefined) existing.minBalanceCollectorAmount = item.min_balance_collector_amount;
        if (item.token_address !== undefined) existing.tokenAddress = item.token_address;
        if (item.token_abi !== undefined) existing.tokenAbi = item.token_abi;
        await this.currencyRepo.save(existing);
      } else {
        const blockchain = await this.blockchainRepo.findOne({ where: { name: blockchain_name.toUpperCase() } });
        if (!blockchain) continue;

        const type = (token_address && token_abi) ? CurrencyType.TOKEN : CurrencyType.COIN;

        const currency = this.currencyRepo.create({
          symbol,
          blockchain,
          type,
          tokenAddress: token_address || null,
          tokenAbi: token_abi || null,
          minWithdrawalAmount: item.min_withdrawal_amount || 0,
          minBalanceCollectorAmount: item.min_balance_collector_amount || 0,
          isActive: true,
          priority: 1,
        });
        await this.currencyRepo.save(currency);
      }
    }
  }

  async getNativeByBlockchain(chain: string): Promise<Currency | null> {
    return this.currencyRepo.findOne({
      where: { blockchain: { name: chain }, type: CurrencyType.COIN },
      relations: { blockchain: true },
    });
  }
}
