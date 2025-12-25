import { BaseEntity } from '../../common/entities/base.entity';
import { Blockchain } from '../blockchain/blockchain.entity';
export declare enum CurrencyType {
    COIN = "coin",
    TOKEN = "token"
}
export declare class Currency extends BaseEntity {
    blockchainId: number;
    blockchain: Blockchain;
    symbol: string;
    type: CurrencyType;
    tokenAddress: string | null;
    tokenAbi: Record<string, unknown> | null;
    priority: number;
    minWithdrawalAmount: number;
    minBalanceCollectorAmount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
