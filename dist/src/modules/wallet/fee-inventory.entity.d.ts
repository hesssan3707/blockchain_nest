import { BaseEntity } from '../../common/entities/base.entity';
import { Wallet } from './wallet.entity';
export declare class FeeInventory extends BaseEntity {
    walletId: number;
    wallet: Wallet;
    amount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
