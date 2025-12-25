import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { SwapDto } from './dto/swap.dto';
import { WalletService } from './wallet.service';
import { TransactionService } from './transaction.service';
import { SwapService } from './swap.service';

@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly transactionService: TransactionService,
    private readonly swapService: SwapService,
  ) {}

  @Get('wallet_address')
  async getWalletAddress(
    @Query('user_identifier') userIdentifier: string,
    @Query('blockchain_name') blockchainName: string,
  ) {
    const wallet = await this.walletService.getWalletAddress(userIdentifier, blockchainName);
    return {
      data: {
        address: wallet.publicKey,
        memo: wallet.memo,
        blockchain_name: wallet.blockchain?.name,
      },
      message: 'Wallet retrieved/created successfully',
      status: 200,
    };
  }

  @Get('balance')
  async getBalance(
    @Query('user_identifier') userIdentifier: string,
    @Query('blockchain_name') blockchainName?: string,
  ) {
    const data = await this.walletService.getBalances(userIdentifier, blockchainName);
    return {
      data,
      message: 'Balances retrieved successfully',
      status: 200,
    };
  }

  @Post('register')
  async getOrCreate(@Body() dto: CreateWalletDto) {
    const wallet = await this.walletService.getOrCreateWallet(dto);
    return {
      data: {
        id: wallet.id,
        publicKey: wallet.publicKey,
        memo: wallet.memo,
        blockchain: wallet.blockchain?.name,
        user: wallet.user?.identifier,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      },
      message: 'Wallet created/retrieved successfully',
      status: 200,
    };
  }

  @Get('transaction')
  async getTransactions(@Query('ids') ids: string | string[]) {
    const data = await this.transactionService.getByIds(ids);
    return {
      data,
      message: 'Transactions retrieved successfully',
      status: 200,
    };
  }

  @Post('transaction')
  async storeTransaction(@Body() dto: any) {
    const data = await this.transactionService.store(dto);
    return {
      data,
      message: 'Transaction stored successfully',
      status: 200,
    };
  }

  @Get('transaction_list')
  async listTransactions(@Query('user_identifier') userIdentifier: string) {
    const transactions = await this.transactionService.listByUser(userIdentifier);
    return {
      data: transactions,
      message: 'User transactions retrieved successfully',
      status: 200,
    };
  }

  @Post('swap')
  async swap(@Body() dto: SwapDto) {
    const txId = await this.swapService.swap(dto);
    return {
      data: txId,
      message: 'Swap processed successfully',
      status: 200,
    };
  }
}
