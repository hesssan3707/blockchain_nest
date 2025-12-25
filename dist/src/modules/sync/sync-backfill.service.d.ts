import { Repository } from 'typeorm';
import { Blockchain } from '../blockchain/blockchain.entity';
import { BlockHistory } from '../wallet/block-history.entity';
import { BlockchainSyncService } from './sync.service';
export declare class SyncBackfillService {
    private readonly syncService;
    private readonly blockchainRepo;
    private readonly blockHistoryRepo;
    private readonly logger;
    constructor(syncService: BlockchainSyncService, blockchainRepo: Repository<Blockchain>, blockHistoryRepo: Repository<BlockHistory>);
    backfillMissingBlocks(): Promise<void>;
    private computeMissingBlocks;
    private cleanupOldInactiveBlockHistory;
}
