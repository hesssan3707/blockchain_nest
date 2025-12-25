import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get overall system statistics' })
  async getStats(@Query('userId') userId?: string) {
    return this.dashboardService.getStats(userId);
  }

  @Get('recent-transactions')
  @ApiOperation({ summary: 'Get most recent transactions' })
  async getRecentTransactions(@Query('limit') limit?: number, @Query('userId') userId?: string) {
    return this.dashboardService.getRecentTransactions(limit || 10, userId);
  }

  @Get('blockchains')
  @ApiOperation({ summary: 'Get blockchain-specific statistics' })
  async getBlockchainStats(@Query('userId') userId?: string) {
    return this.dashboardService.getBlockchainStats(userId);
  }

  @Get('revenue-chart')
  @ApiOperation({ summary: 'Get revenue data for charts' })
  async getRevenueChart(@Query('days') days?: number, @Query('userId') userId?: string) {
    return this.dashboardService.getRevenueChartData(days || 7, userId);
  }

  @Get('wallets')
  @ApiOperation({ summary: 'Get wallet list for dashboard' })
  async getWallets(@Query('userId') userId?: string) {
    return this.dashboardService.getWalletStats(userId);
  }

  @Get('revenues')
  @ApiOperation({ summary: 'Get recent revenues' })
  async getRevenues(@Query('userId') userId?: string) {
    return this.dashboardService.getRevenueStats(userId);
  }

  @Get('sync-status')
  @ApiOperation({ summary: 'Get block synchronization status' })
  async getSyncStatus() {
    return this.dashboardService.getSyncStatus();
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get system settings' })
  async getSettings() {
    return this.dashboardService.getSettings();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get list of users for filter' })
  async getUsers() {
    return this.dashboardService.getUsers();
  }
}
