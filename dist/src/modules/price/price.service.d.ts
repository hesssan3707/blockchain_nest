import { ConfigService } from '@nestjs/config';
export declare class PriceService {
    private readonly configService;
    private readonly apiKey;
    constructor(configService: ConfigService);
    priceConverter(from: string, to: string): Promise<number>;
    convertToUsd(symbol: string, amount: number): Promise<number>;
}
