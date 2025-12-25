import { BaseEntity } from '../../common/entities/base.entity';
import { Blockchain } from '../blockchain/blockchain.entity';
export declare class BlockHistory extends BaseEntity {
    blockchainId: number;
    blockchain: Blockchain;
    number: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
