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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const dashboard_service_1 = require("./dashboard.service");
const swagger_1 = require("@nestjs/swagger");
let DashboardController = class DashboardController {
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    async getStats(userId) {
        return this.dashboardService.getStats(userId);
    }
    async getRecentTransactions(limit, userId) {
        return this.dashboardService.getRecentTransactions(limit || 10, userId);
    }
    async getBlockchainStats(userId) {
        return this.dashboardService.getBlockchainStats(userId);
    }
    async getRevenueChart(days, userId) {
        return this.dashboardService.getRevenueChartData(days || 7, userId);
    }
    async getWallets(userId) {
        return this.dashboardService.getWalletStats(userId);
    }
    async getRevenues(userId) {
        return this.dashboardService.getRevenueStats(userId);
    }
    async getSyncStatus() {
        return this.dashboardService.getSyncStatus();
    }
    async getSettings() {
        return this.dashboardService.getSettings();
    }
    async getUsers() {
        return this.dashboardService.getUsers();
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get overall system statistics' }),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('recent-transactions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get most recent transactions' }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getRecentTransactions", null);
__decorate([
    (0, common_1.Get)('blockchains'),
    (0, swagger_1.ApiOperation)({ summary: 'Get blockchain-specific statistics' }),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getBlockchainStats", null);
__decorate([
    (0, common_1.Get)('revenue-chart'),
    (0, swagger_1.ApiOperation)({ summary: 'Get revenue data for charts' }),
    __param(0, (0, common_1.Query)('days')),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getRevenueChart", null);
__decorate([
    (0, common_1.Get)('wallets'),
    (0, swagger_1.ApiOperation)({ summary: 'Get wallet list for dashboard' }),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getWallets", null);
__decorate([
    (0, common_1.Get)('revenues'),
    (0, swagger_1.ApiOperation)({ summary: 'Get recent revenues' }),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getRevenues", null);
__decorate([
    (0, common_1.Get)('sync-status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get block synchronization status' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getSyncStatus", null);
__decorate([
    (0, common_1.Get)('settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system settings' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of users for filter' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getUsers", null);
exports.DashboardController = DashboardController = __decorate([
    (0, swagger_1.ApiTags)('Dashboard'),
    (0, common_1.Controller)('dashboard'),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map