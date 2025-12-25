import { BaseEntity } from '../../common/entities/base.entity';
import { Blockchain } from '../blockchain/blockchain.entity';
import { User } from '../user/user.entity';
import { WalletBalance } from './wallet-balance.entity';
export declare class Wallet extends BaseEntity {
    userId: number;
    user: User;
    blockchainId: number;
    blockchain: Blockchain;
    balances: WalletBalance[];
    publicKey: string;
    privateKey: string | null;
    mnemonic: string | null;
    memo: number | null;
    adminWallet: boolean;
    exchangeWallet: boolean;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
