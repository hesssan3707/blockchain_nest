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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyController = void 0;
const common_1 = require("@nestjs/common");
const create_currency_dto_1 = require("./dto/create-currency.dto");
const currency_service_1 = require("./currency.service");
let CurrencyController = class CurrencyController {
    constructor(currencyService) {
        this.currencyService = currencyService;
    }
    async list(blockchain) {
        let data;
        if (blockchain) {
            data = await this.currencyService.listByBlockchain(blockchain);
        }
        else {
            data = await this.currencyService.listAll();
        }
        return {
            data,
            message: 'Currencies retrieved successfully',
            status: 200,
        };
    }
    async show(symbol, blockchain) {
        let data;
        if (blockchain) {
            data = await this.currencyService.getBySymbolAndBlockchain(symbol, blockchain);
        }
        else {
            data = await this.currencyService.listBySymbol(symbol);
        }
        return {
            data,
            message: 'Currency retrieved successfully',
            status: 200,
        };
    }
    async create(dto) {
        const data = await this.currencyService.create(dto);
        return {
            data,
            message: 'Currency registered successfully',
            status: 201,
        };
    }
    async update(dto) {
        const data = await this.currencyService.update(dto);
        return {
            data,
            message: 'Currency updated successfully',
            status: 200,
        };
    }
    async sync(dto) {
        await this.currencyService.sync(dto);
        return {
            data: null,
            message: 'Currencies synced successfully',
            status: 200,
        };
    }
    async toggle(dto) {
        const data = await this.currencyService.toggle(dto);
        return {
            data,
            message: 'Currency status toggled successfully',
            status: 200,
        };
    }
};
exports.CurrencyController = CurrencyController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('blockchain')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CurrencyController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':symbol'),
    __param(0, (0, common_1.Param)('symbol')),
    __param(1, (0, common_1.Query)('blockchain')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CurrencyController.prototype, "show", null);
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_currency_dto_1.CreateCurrencyDto]),
    __metadata("design:returntype", Promise)
], CurrencyController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('update'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CurrencyController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('sync'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CurrencyController.prototype, "sync", null);
__decorate([
    (0, common_1.Post)('toggle'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CurrencyController.prototype, "toggle", null);
exports.CurrencyController = CurrencyController = __decorate([
    (0, common_1.Controller)('currency'),
    __metadata("design:paramtypes", [currency_service_1.CurrencyService])
], CurrencyController);
//# sourceMappingURL=currency.controller.js.map