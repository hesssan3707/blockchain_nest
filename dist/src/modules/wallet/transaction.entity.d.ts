import { BaseEntity } from '../../common/entities/base.entity';
import { Blockchain } from '../blockchain/blockchain.entity';
import { Currency } from '../currency/currency.entity';
import { User } from '../user/user.entity';
import { Wallet } from './wallet.entity';
export declare enum TransactionType {
    WITHDRAWAL = "withdrawal",
    DEPOSIT = "deposit",
    NETWORK_FEE = "network_fee",
    BALANCE_COLLECTOR = "balance_collector",
    SWAP_WITHDRAWAL = "swap_withdrawal",
    SWAP_DEPOSIT = "swap_deposit"
}
export declare enum TransactionStatus {
    WAITING = "waiting",
    SUCCESS = "success",
    FAILED = "failed"
}
export declare class Transaction extends BaseEntity {
    userId: number;
    user: User;
    walletId: number | null;
    wallet: Wallet | null;
    blockchainId: number;
    blockchain: Blockchain;
    currencyId: number;
    currency: Currency;
    uuid: string | null;
    transactionId: string | null;
    transactionHash: string | null;
    value: number;
    type: TransactionType;
    status: TransactionStatus;
    agreedFee: number;
    networkFee: number;
    networkFeeCurrencyId: number | null;
    networkFeeCurrency: Currency | null;
    confirmations: number;
    isConfirmed: boolean;
    externalWallet: string | null;
    memo: string | null;
    checksum: string | null;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
