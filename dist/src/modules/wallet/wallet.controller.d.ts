import { CreateWalletDto } from './dto/create-wallet.dto';
import { SwapDto } from './dto/swap.dto';
import { WalletService } from './wallet.service';
import { TransactionService } from './transaction.service';
import { SwapService } from './swap.service';
export declare class WalletController {
    private readonly walletService;
    private readonly transactionService;
    private readonly swapService;
    constructor(walletService: WalletService, transactionService: TransactionService, swapService: SwapService);
    getWalletAddress(userIdentifier: string, blockchainName: string): Promise<{
        data: {
            address: string;
            memo: number | null;
            blockchain_name: string;
        };
        message: string;
        status: number;
    }>;
    getBalance(userIdentifier: string, blockchainName?: string): Promise<{
        data: {
            data: {
                blockchain_name: string;
                wallet_address: string;
                assets: {
                    currency_symbol: string;
                    value: number;
                }[];
            };
            message: string;
            status: number;
        } | {
            data: any[];
            message: string;
            status: number;
        };
        message: string;
        status: number;
    }>;
    getOrCreate(dto: CreateWalletDto): Promise<{
        data: {
            id: number;
            publicKey: string;
            memo: number | null;
            blockchain: string;
            user: string;
            createdAt: Date;
            updatedAt: Date;
        };
        message: string;
        status: number;
    }>;
    getTransactions(ids: string | string[]): Promise<{
        data: {
            data: import("./transaction.entity").Transaction[];
            message: string;
            status: number;
        };
        message: string;
        status: number;
    }>;
    storeTransaction(dto: any): Promise<{
        data: {
            data: string | null;
            message: string;
            status: number;
        };
        message: string;
        status: number;
    }>;
    listTransactions(userIdentifier: string): Promise<{
        data: import("./transaction.entity").Transaction[];
        message: string;
        status: number;
    }>;
    swap(dto: SwapDto): Promise<{
        data: number;
        message: string;
        status: number;
    }>;
}
