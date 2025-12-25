import { BaseEntity } from '../../common/entities/base.entity';
import { Currency } from '../currency/currency.entity';
import { Wallet } from './wallet.entity';
export declare class WalletBalance extends BaseEntity {
    walletId: number;
    wallet: Wallet;
    currencyId: number;
    currency: Currency;
    userBalance: number;
    networkBalance: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
