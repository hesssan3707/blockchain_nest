import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PriceService {
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('CMC_API_KEY') || '';
  }

  async priceConverter(from: string, to: string): Promise<number> {
    if (from.toUpperCase() === to.toUpperCase()) return 1;

    try {
      const response = await axios.get(
        'https://pro-api.coinmarketcap.com/v2/tools/price-conversion',
        {
          params: {
            amount: 1,
            symbol: from.toUpperCase(),
            convert: to.toUpperCase(),
          },
          headers: {
            'X-CMC_PRO_API_KEY': this.apiKey,
          },
        },
      );

      const price = response.data?.data[0]?.quote[to.toUpperCase()]?.price;
      return price ? parseFloat(price) : 0;
    } catch (error) {
      console.error(`Error converting price from ${from} to ${to}:`, error);
      return 0;
    }
  }

  async convertToUsd(symbol: string, amount: number): Promise<number> {
    const rate = await this.priceConverter(symbol, 'USD');
    return rate * amount;
  }
}
