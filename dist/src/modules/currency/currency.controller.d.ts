import { CreateCurrencyDto } from './dto/create-currency.dto';
import { CurrencyService } from './currency.service';
export declare class CurrencyController {
    private readonly currencyService;
    constructor(currencyService: CurrencyService);
    list(blockchain?: string): Promise<{
        data: any;
        message: string;
        status: number;
    }>;
    show(symbol: string, blockchain?: string): Promise<{
        data: any;
        message: string;
        status: number;
    }>;
    create(dto: CreateCurrencyDto): Promise<{
        data: import("./currency.entity").Currency;
        message: string;
        status: number;
    }>;
    update(dto: any): Promise<{
        data: import("./currency.entity").Currency;
        message: string;
        status: number;
    }>;
    sync(dto: {
        currencies: any[];
    }): Promise<{
        data: null;
        message: string;
        status: number;
    }>;
    toggle(dto: any): Promise<{
        data: import("./currency.entity").Currency;
        message: string;
        status: number;
    }>;
}
