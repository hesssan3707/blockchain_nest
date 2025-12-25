import { BaseEntity } from '../../common/entities/base.entity';
import { Blockchain } from '../blockchain/blockchain.entity';
import { Currency } from '../currency/currency.entity';
import { User } from '../user/user.entity';
import { Transaction } from './transaction.entity';
export declare class Revenue extends BaseEntity {
    userId: number;
    user: User;
    blockchainId: number;
    blockchain: Blockchain;
    currencyId: number;
    currency: Currency;
    transactionId: number | null;
    transaction: Transaction | null;
    agreedFee: number;
    networkFee: number;
    networkFeeCurrencyId: number | null;
    networkFeeCurrency: Currency | null;
    revenue: number;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
