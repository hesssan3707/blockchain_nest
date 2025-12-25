import { Repository } from 'typeorm';
import { Blockchain } from '../blockchain/blockchain.entity';
import { Currency } from './currency.entity';
import { CreateCurrencyDto } from './dto/create-currency.dto';
export declare class CurrencyService {
    private readonly currencyRepo;
    private readonly blockchainRepo;
    constructor(currencyRepo: Repository<Currency>, blockchainRepo: Repository<Blockchain>);
    create(dto: CreateCurrencyDto): Promise<Currency>;
    listByBlockchain(blockchainName: string): Promise<Currency[]>;
    listAll(): Promise<Currency[]>;
    listBySymbol(symbol: string): Promise<Currency[]>;
    getBySymbolAndBlockchain(symbol: string, blockchainName: string): Promise<Currency | null>;
    update(dto: any): Promise<Currency>;
    toggle(dto: any): Promise<Currency>;
    sync(dto: {
        currencies: any[];
    }): Promise<void>;
    getNativeByBlockchain(chain: string): Promise<Currency | null>;
}
