"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
let PriceService = class PriceService {
    constructor(configService) {
        this.configService = configService;
        this.apiKey = this.configService.get('CMC_API_KEY') || '';
    }
    async priceConverter(from, to) {
        if (from.toUpperCase() === to.toUpperCase())
            return 1;
        try {
            const response = await axios_1.default.get('https://pro-api.coinmarketcap.com/v2/tools/price-conversion', {
                params: {
                    amount: 1,
                    symbol: from.toUpperCase(),
                    convert: to.toUpperCase(),
                },
                headers: {
                    'X-CMC_PRO_API_KEY': this.apiKey,
                },
            });
            const price = response.data?.data[0]?.quote[to.toUpperCase()]?.price;
            return price ? parseFloat(price) : 0;
        }
        catch (error) {
            console.error(`Error converting price from ${from} to ${to}:`, error);
            return 0;
        }
    }
    async convertToUsd(symbol, amount) {
        const rate = await this.priceConverter(symbol, 'USD');
        return rate * amount;
    }
};
exports.PriceService = PriceService;
exports.PriceService = PriceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PriceService);
//# sourceMappingURL=price.service.js.map