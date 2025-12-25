import { Repository } from 'typeorm';
import { Blockchain } from '../blockchain/blockchain.entity';
import { Currency } from '../currency/currency.entity';
import { User } from '../user/user.entity';
import { Wallet } from './wallet.entity';
import { WalletBalance } from './wallet-balance.entity';
import { Revenue } from './revenue.entity';
import { PriceService } from '../price/price.service';
import { Transaction, TransactionStatus, TransactionType } from './transaction.entity';
export declare class TransactionService {
    private readonly txRepo;
    private readonly userRepo;
    private readonly blockchainRepo;
    private readonly currencyRepo;
    private readonly walletRepo;
    private readonly balanceRepo;
    private readonly revenueRepo;
    private readonly priceService;
    private readonly logger;
    constructor(txRepo: Repository<Transaction>, userRepo: Repository<User>, blockchainRepo: Repository<Blockchain>, currencyRepo: Repository<Currency>, walletRepo: Repository<Wallet>, balanceRepo: Repository<WalletBalance>, revenueRepo: Repository<Revenue>, priceService: PriceService);
    processConfirmedTransaction(tx: Transaction, networkFee: number, networkFeeCurrency?: Currency): Promise<void>;
    updateWalletBalance(tx: Transaction): Promise<void>;
    setStatusByHash(transactionHash: string, status: TransactionStatus, description?: string): Promise<void>;
    getByIds(ids: string | string[]): Promise<{
        data: Transaction[];
        message: string;
        status: number;
    }>;
    listByUser(userIdentifier: string): Promise<Transaction[]>;
    store(dto: any): Promise<{
        data: string | null;
        message: string;
        status: number;
    }>;
    createIfNotExists(input: {
        currency: Currency;
        blockchain: Blockchain;
        user?: User;
        wallet: Wallet | null;
        transactionHash: string;
        value: number;
        type: TransactionType;
        status: TransactionStatus;
        externalWallet?: string | null;
        memo?: string | null;
        description?: string | null;
        uuid?: string | null;
        transactionId?: string | null;
        confirmations?: number;
        isConfirmed?: boolean;
        agreedFee?: number;
    }): Promise<Transaction | null>;
    private sendTransactionCallback;
}
