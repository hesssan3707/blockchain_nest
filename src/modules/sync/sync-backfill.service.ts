import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blockchain } from '../blockchain/blockchain.entity';
import { BlockHistory } from '../wallet/block-history.entity';
import { BlockchainSyncService } from './sync.service';

@Injectable()
export class SyncBackfillService {
  private readonly logger = new Logger(SyncBackfillService.name);

  constructor(
    private readonly syncService: BlockchainSyncService,
    @InjectRepository(Blockchain)
    private readonly blockchainRepo: Repository<Blockchain>,
    @InjectRepository(BlockHistory)
    private readonly blockHistoryRepo: Repository<BlockHistory>,
  ) {}

  @Interval(1 * 60 * 1000) // Run every minute for small, fast chunks
  async backfillMissingBlocks(): Promise<void> {
    this.logger.log('Starting backfill process for missing blocks...');
    const blockchains = await this.blockchainRepo.find({
      where: { isActive: true },
    });

    for (const blockchain of blockchains) {
      try {
        const { missingBlocks, processedUpTo, hasAnyBlocks } =
          await this.computeMissingBlocks(blockchain);
        
        if (!hasAnyBlocks) continue;

        if (missingBlocks.length > 0) {
          this.logger.log(`Backfilling ${missingBlocks.length} blocks for ${blockchain.name}`);
          // Sync the missing blocks
          await this.syncService.syncBlockchainSpecificBlocks(blockchain, missingBlocks);
        }

        // Mark blocks as checked (isActive = false) up to processedUpTo
        // This ensures we don't scan them again next time
        if (processedUpTo > 0) {
          await this.blockHistoryRepo
            .createQueryBuilder()
            .update(BlockHistory)
            .set({ isActive: false })
            .where('blockchain_id = :blockchainId', { blockchainId: blockchain.id })
            .andWhere('number <= :processedUpTo', { processedUpTo })
            .andWhere('isActive = :isActive', { isActive: true })
            .execute();
        }

        await this.cleanupOldInactiveBlockHistory();
      } catch (err) {
        this.logger.error(`Error in backfill for ${blockchain.name}: ${err.message}`);
      }
    }
  }

  private async computeMissingBlocks(blockchain: Blockchain): Promise<{
    missingBlocks: number[];
    processedUpTo: number;
    hasAnyBlocks: boolean;
  }> {
    // Only check blocks that are still "active" (not yet marked as gap-free)
    const rows = await this.blockHistoryRepo.find({
      where: { 
        blockchainId: blockchain.id,
        isActive: true 
      },
      select: { number: true },
      order: { number: 'ASC' },
      take: 1000, // Look at a chunk of active blocks
    });
    
    if (rows.length < 2) {
      return { missingBlocks: [], processedUpTo: 0, hasAnyBlocks: rows.length > 0 };
    }

    const existing = new Set<number>(rows.map((r) => r.number));
    const min = rows[0].number;
    const max = rows[rows.length - 1].number;

    const missing: number[] = [];
    let processedUpTo = min;
    
    // We limit to 50 missing blocks per cycle. 
    // Running every minute means we can process up to 3000 blocks per hour,
    // which is plenty for catching up while keeping each request light.
    const MAX_MISSING_PER_CYCLE = 50;

    for (let n = min; n <= max; n++) {
      if (!existing.has(n)) {
        missing.push(n);
        if (missing.length >= MAX_MISSING_PER_CYCLE) {
          // If we hit the limit, we only mark up to the block before the first missing block we DIDN'T fetch
          // But since we stop here, we just mark up to the last successful check
          break;
        }
      } else {
        // If we haven't hit a gap yet, or we're filling gaps, 
        // we can potentially mark this block as checked.
        // We only mark blocks as "processedUpTo" if we've successfully verified the sequence.
        if (missing.length === 0) {
          processedUpTo = n;
        }
      }
    }
    
    return {
      missingBlocks: missing,
      processedUpTo: processedUpTo,
      hasAnyBlocks: true,
    };
  }

  private async cleanupOldInactiveBlockHistory(): Promise<void> {
    const cutoff = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days
    await this.blockHistoryRepo
      .createQueryBuilder()
      .delete()
      .from(BlockHistory)
      .where('isActive = :isActive', { isActive: false })
      .andWhere('createdAt < :cutoff', { cutoff })
      .execute();
  }
}
