import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Interval, SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import * as crypto from 'crypto';
import { In, Repository } from 'typeorm';
import { Blockchain } from '../blockchain/blockchain.entity';
import { Currency, CurrencyType } from '../currency/currency.entity';
import { ProviderService } from '../provider/provider.service';
import { BlockHistory } from '../wallet/block-history.entity';
import { TransactionStatus, TransactionType } from '../wallet/transaction.entity';
import { TransactionService } from '../wallet/transaction.service';
import { Wallet } from '../wallet/wallet.entity';

interface JsonRpcResponse<T> {
  jsonrpc: string;
  id: number | string;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface EvmTransaction {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  input: string;
  blockNumber: string;
}

interface EvmBlock {
  number: string;
  hash: string;
  transactions: EvmTransaction[];
}

@Injectable()
export class BlockchainSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BlockchainSyncService.name);
  private readonly tokenDecimalsByAddress = new Map<string, number>();
  private readonly runningIntervals = new Set<number>();
  private readonly syncingBlockchains = new Set<number>();

  constructor(
    private readonly providerService: ProviderService,
    private readonly transactionService: TransactionService,
    private readonly schedulerRegistry: SchedulerRegistry,
    @InjectRepository(Blockchain)
    private readonly blockchainRepo: Repository<Blockchain>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(Currency)
    private readonly currencyRepo: Repository<Currency>,
    @InjectRepository(BlockHistory)
    private readonly blockHistoryRepo: Repository<BlockHistory>,
  ) {}

  async onModuleInit() {
    await this.fixDatabaseConstraints();
    await this.refreshSyncTasks();
  }

  private async fixDatabaseConstraints() {
    try {
      this.logger.log('Checking and fixing database constraints...');
      
      // Check for old constraint
      const oldConstraint = await this.blockHistoryRepo.query(`
        SELECT CONSTRAINT_NAME 
        FROM information_schema.TABLE_CONSTRAINTS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'block_histories' 
        AND CONSTRAINT_NAME = 'UQ_blockhistory_number'
      `);

      if (oldConstraint && oldConstraint.length > 0) {
        this.logger.log('Dropping old constraint UQ_blockhistory_number...');
        await this.blockHistoryRepo.query(`ALTER TABLE block_histories DROP INDEX UQ_blockhistory_number`);
      }

      // Check for new composite constraint
      const newConstraint = await this.blockHistoryRepo.query(`
        SELECT CONSTRAINT_NAME 
        FROM information_schema.TABLE_CONSTRAINTS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'block_histories' 
        AND CONSTRAINT_NAME = 'UQ_blockhistory_blockchain_number'
      `);

      if (!newConstraint || newConstraint.length === 0) {
        this.logger.log('Adding new composite constraint UQ_blockhistory_blockchain_number...');
        await this.blockHistoryRepo.query(`
          ALTER TABLE block_histories 
          ADD UNIQUE INDEX UQ_blockhistory_blockchain_number (blockchain_id, number)
        `);
      }
      
      this.logger.log('Database constraints checked successfully.');
    } catch (error) {
      this.logger.warn(`Could not fix database constraints: ${error.message}`);
    }
  }

  onModuleDestroy() {
    this.stopAllSyncTasks();
  }

  async refreshSyncTasks() {
    const blockchains = await this.blockchainRepo.find({
      where: { isActive: true },
    });

    for (const blockchain of blockchains) {
      this.startSyncTask(blockchain);
    }
  }

  private startSyncTask(blockchain: Blockchain) {
    if (this.runningIntervals.has(blockchain.id)) return;

    const delay = this.getDelayMs(blockchain.bpm);
    const intervalName = `sync_${blockchain.id}`;

    const runSync = async () => {
      if (!this.runningIntervals.has(blockchain.id)) return;
      if (this.syncingBlockchains.has(blockchain.id)) return;

      this.syncingBlockchains.add(blockchain.id);
      try {
        await this.syncBlockchainLatest(blockchain);
      } catch (error) {
        const msg = error.message || '';
        const isDuplicate = msg.includes('Duplicate entry') || error.code === 'ER_DUP_ENTRY' || error.errno === 1062;
        
        if (isDuplicate) {
          this.logger.warn(`Duplicate entry for ${blockchain.name} at some block, skipping.`);
        } else if (msg.includes('401') || msg.includes('Unauthorized')) {
          this.logger.warn(`RPC Auth failed for ${blockchain.name}. Please check provider URL/token.`);
        } else if (msg.includes('failed to detect network')) {
          this.logger.warn(`Network detection failed for ${blockchain.name}. Provider might be down.`);
        } else {
          this.logger.error(`Error syncing ${blockchain.name}: ${msg}`);
        }
      } finally {
        this.syncingBlockchains.delete(blockchain.id);
        
        try {
          this.schedulerRegistry.deleteTimeout(`${intervalName}_timeout`);
        } catch (e) {}

        if (this.runningIntervals.has(blockchain.id)) {
          const timeout = setTimeout(runSync, delay || 1000);
          this.schedulerRegistry.addTimeout(`${intervalName}_timeout`, timeout);
        }
      }
    };

    this.runningIntervals.add(blockchain.id);
    runSync();
    this.logger.log(`Started sync task for ${blockchain.name} with ${delay}ms delay`);
  }

  private stopSyncTask(blockchainId: number) {
    this.runningIntervals.delete(blockchainId);
    this.syncingBlockchains.delete(blockchainId);
    const intervalName = `sync_${blockchainId}`;
    try {
      this.schedulerRegistry.deleteTimeout(`${intervalName}_timeout`);
    } catch (e) {}
  }

  private stopAllSyncTasks() {
    for (const blockchainId of [...this.runningIntervals]) {
      this.stopSyncTask(blockchainId);
    }
  }

  @Interval(1 * 60 * 1000)
  async refreshActiveBlockchains() {
    const blockchains = await this.blockchainRepo.find();
    
    for (const blockchain of blockchains) {
      const isRunning = this.runningIntervals.has(blockchain.id);
      
      if (blockchain.isActive && !isRunning) {
        this.startSyncTask(blockchain);
      } else if (!blockchain.isActive && isRunning) {
        this.stopSyncTask(blockchain.id);
      }
    }
  }

  private async fetchTronBlocks(
    rpcUrl: string,
    numbers: number[],
    apiKey?: string,
  ): Promise<any[]> {
    if (numbers.length === 0) return [];

    const allBlocks: any[] = [];
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    const span = max - min + 1;

    const trimmed = rpcUrl.trim().replace(/\/+$/, '');
    const baseUrl = trimmed.toLowerCase().endsWith('/jsonrpc') 
      ? trimmed.slice(0, -'/jsonrpc'.length) 
      : trimmed;

    const headers: any = { 'Content-Type': 'application/json' };
    if (apiKey) {
      headers['TRON-PRO-API-KEY'] = apiKey;
    }

    // Try batch fetching using eth_getBlockByNumber (JSON-RPC 2.0)
    // This is more reliable for TronGrid as seen in Python service
    if (numbers.length > 1) {
      try {
        const batchPayload = numbers.map((n, index) => ({
          jsonrpc: '2.0',
          id: index + 1,
          method: 'eth_getBlockByNumber',
          params: ['0x' + n.toString(16), true]
        }));

        const response = await axios.post(rpcUrl, batchPayload, { 
          headers: { 
            ...headers,
            'User-Agent': 'blockchain-sync-service/1.0',
          }, 
          timeout: 30_000 
        });
        const results = Array.isArray(response.data) ? response.data : [response.data];
        
        const fetchedBlocks: any[] = [];
        for (const res of results.sort((a, b) => (a.id || 0) - (b.id || 0))) {
          if (res.result && res.result.number) {
            // TronGrid's eth_getBlockByNumber returns EVM-style blocks.
            // We need to convert them to TRON-style for syncTronBlocks to work,
            // or modify syncTronBlocks. 
            // Given the complexity of conversion, if this fails or format is wrong, 
            // we continue to TRON-native endpoints.
            const evmBlock = res.result;
            const tronBlock = {
              block_header: {
                raw_data: {
                  number: parseInt(evmBlock.number, 16),
                  timestamp: parseInt(evmBlock.timestamp, 16) * 1000,
                }
              },
              transactions: (evmBlock.transactions || []).map((tx: any) => ({
                txID: tx.hash.startsWith('0x') ? tx.hash.slice(2) : tx.hash,
                raw_data: {
                  contract: [
                    {
                      type: tx.input === '0x' ? 'TransferContract' : 'TriggerSmartContract',
                      parameter: {
                        value: {
                          amount: parseInt(tx.value || '0', 16),
                          owner_address: tx.from,
                          to_address: tx.to,
                          data: tx.input.startsWith('0x') ? tx.input.slice(2) : tx.input,
                          contract_address: tx.to, // For TRC20, it's the 'to' address
                        }
                      }
                    }
                  ]
                }
              }))
            };
            fetchedBlocks.push(tronBlock);
          }
        }
        if (fetchedBlocks.length === numbers.length) {
          this.logger.debug(`Successfully fetched ${fetchedBlocks.length} TRON blocks via eth_getBlockByNumber batch`);
          return fetchedBlocks;
        }
      } catch (err) {
        this.logger.debug(`TRON eth_getBlockByNumber batch failed: ${err.message}`);
      }
    }

    // Try batch fetching if blocks are continuous or nearly continuous via native endpoints
    if (numbers.length > 1 && span <= 100) {
      // Try both /wallet/getblockbyrange and /walletsolidity/getblockbyrange
      const endpoints = [
        `${baseUrl}/wallet/getblockbyrange`,
        `${baseUrl}/walletsolidity/getblockbyrange`,
        `${baseUrl}/getblockbyrange`,
      ];

      for (const url of endpoints) {
        let retryCount = 0;
        const maxRetries = 3;
        let success = false;

        try {
          while (retryCount <= maxRetries && !success) {
            try {
              this.logger.debug(`Attempting TRON batch fetch for range ${min}-${max} via ${url} (Attempt ${retryCount + 1})`);
              let response;
              try {
                response = await axios.post(
                  url,
                  { start_num: min, end_num: max }, // TronGrid uses start_num, end_num (snake_case)
                  { headers, timeout: 30_000 }
                );
              } catch (postErr) {
                if (postErr.response?.status === 405 || postErr.response?.status === 400) {
                  // Try GET if POST is not allowed or if 400 (some nodes use startNum/endNum with GET)
                  response = await axios.get(`${url}?startNum=${min}&endNum=${max}`, { headers, timeout: 30_000 });
                } else {
                  throw postErr;
                }
              }

              const data = response.data;
              // TronGrid batch response can be an array or { block: [...] }
              const blocks = Array.isArray(data) ? data : (data.block || []);

              if (blocks && blocks.length > 0) {
                const blockMap = new Map<number, any>();
                for (const b of blocks) {
                  if (b && b.block_header) {
                    blockMap.set(b.block_header.raw_data.number, b);
                  }
                }

                const fetchedBlocks: any[] = [];
                for (const n of numbers) {
                  if (blockMap.has(n)) {
                    fetchedBlocks.push(blockMap.get(n));
                  }
                }

                if (fetchedBlocks.length > 0) {
                  success = true;
                  this.logger.debug(`Successfully fetched ${fetchedBlocks.length} TRON blocks in range ${min}-${max} via ${url}`);
                  return fetchedBlocks;
                }
              }
              break; // If no blocks returned, try next endpoint
            } catch (err) {
              const status = err.response?.status;
              if (status === 429 && retryCount < maxRetries) {
                const delay = Math.pow(2, retryCount + 1) * 2000 + Math.floor(Math.random() * 1000);
                this.logger.warn(`TRON batch fetch rate limited (429) at ${url}, retrying in ${delay}ms...`);
                await this.sleep(delay);
                retryCount++;
              } else if (status === 405 || status === 404) {
                break; // Try next endpoint
              } else {
                throw err;
              }
            }
          }
        } catch (err) {
          // Continue to next endpoint
          this.logger.debug(`TRON batch fetch failed at ${url}: ${err.message}`);
        }
        if (success) break;
      }
    }

    // Sequential fallback
    for (const n of numbers) {
      let retryCount = 0;
      const maxRetries = 3;
      let success = false;

      while (retryCount <= maxRetries && !success) {
        try {
          let response;
          try {
            response = await axios.post(
              `${baseUrl}/wallet/getblockbynum`,
              { num: n },
              { headers, timeout: 10_000 }
            );
          } catch (postErr) {
            if (postErr.response?.status === 405 || postErr.response?.status === 400) {
              response = await axios.get(`${baseUrl}/wallet/getblockbynum?num=${n}`, { headers, timeout: 10_000 });
            } else {
              throw postErr;
            }
          }

          if (response.data && response.data.block_header) {
            allBlocks.push(response.data);
            success = true;
          } else {
            // Might be a different endpoint for some nodes
            let altResponse;
            try {
              altResponse = await axios.post(
                `${baseUrl}/getblockbynum`,
                { num: n },
                { headers, timeout: 10_000 }
              );
            } catch (postErr) {
              if (postErr.response?.status === 405 || postErr.response?.status === 400) {
                altResponse = await axios.get(`${baseUrl}/getblockbynum?num=${n}`, { headers, timeout: 10_000 });
              } else {
                throw postErr;
              }
            }
            
            if (altResponse.data && altResponse.data.block_header) {
              allBlocks.push(altResponse.data);
              success = true;
            } else {
              break;
            }
          }
        } catch (err) {
          const status = err.response?.status;
          if (status === 429 && retryCount < maxRetries) {
            const delay = Math.pow(2, retryCount) * 1000 + 500;
            await this.sleep(delay);
            retryCount++;
          } else {
            break;
          }
        }
      }

      if (success && numbers.length > 1) {
        await this.sleep(200 + Math.random() * 100);
      }
    }

    return allBlocks;
  }


  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getDelayMs(bpm: number): number {
    if (bpm >= 45) return 0;
    const seconds = Math.max(1, Math.floor(60 / Math.max(0.0001, bpm)));
    return seconds * 1000;
  }

  private async syncBlockchainLatest(blockchain: Blockchain): Promise<void> {
    const name = blockchain.name.trim().toUpperCase();
    const provider = await this.providerService.getBestProviderForBlockchain(name);
    if (!provider) return;

    // Always fetch up to the last 20 blocks from the network tip
    // Gaps further back will be filled by the SyncBackfillService
    const BATCH_SIZE = 20;

    if (this.isEvmLikeBlockchain(name)) {
      const rpcUrl = provider.url;
      const latestBlock = await this.getLatestEvmBlockNumber(rpcUrl);
      const actualStart = Math.max(0, latestBlock - BATCH_SIZE + 1);
      const actualEnd = latestBlock;
      
      const blockNumbers: number[] = [];
      for (let n = actualStart; n <= actualEnd; n++) blockNumbers.push(n);

      // Filter out blocks we already have in this range to be efficient
      const existingBlocks = await this.blockHistoryRepo.find({
        where: {
          blockchainId: blockchain.id,
          number: In(blockNumbers)
        },
        select: { number: true }
      });
      const existingSet = new Set(existingBlocks.map(b => b.number));
      const missingInBatch = blockNumbers.filter(n => !existingSet.has(n));

      if (missingInBatch.length === 0) return;
      
      this.logger.debug(`Syncing ${blockchain.name} latest batch: ${missingInBatch.length} new blocks in range ${actualStart}-${actualEnd}`);
      await this.syncEvmBlocks(blockchain, rpcUrl, missingInBatch);
      return;
    }

    if (name === 'TRON') {
      const rpcUrl = provider.url;
      const latestBlock = await this.getLatestTronBlockNumber(rpcUrl, provider.apiKey);
      const actualStart = Math.max(0, latestBlock - 5 + 1); // Reduced batch size for TRON
      const actualEnd = latestBlock;

      const blockNumbers: number[] = [];
      for (let n = actualStart; n <= actualEnd; n++) blockNumbers.push(n);

      const existingBlocks = await this.blockHistoryRepo.find({
        where: {
          blockchainId: blockchain.id,
          number: In(blockNumbers)
        },
        select: { number: true }
      });
      const existingSet = new Set(existingBlocks.map(b => b.number));
      const missingInBatch = blockNumbers.filter(n => !existingSet.has(n));

      if (missingInBatch.length === 0) return;

      this.logger.debug(`Syncing ${blockchain.name} latest batch: ${missingInBatch.length} new blocks in range ${actualStart}-${actualEnd}`);
      await this.syncTronBlocks(blockchain, rpcUrl, missingInBatch, provider.apiKey);
      return;
    }

    if (name === 'BTC' || name === 'LTC') {
      const rpcUrl = provider.url;
      const latestBlock = await this.getLatestBtcLtcBlockNumber(rpcUrl);
      const actualStart = Math.max(0, latestBlock - BATCH_SIZE + 1);
      const actualEnd = latestBlock;

      const blockNumbers: number[] = [];
      for (let n = actualStart; n <= actualEnd; n++) blockNumbers.push(n);

      const existingBlocks = await this.blockHistoryRepo.find({
        where: {
          blockchainId: blockchain.id,
          number: In(blockNumbers)
        },
        select: { number: true }
      });
      const existingSet = new Set(existingBlocks.map(b => b.number));
      const missingInBatch = blockNumbers.filter(n => !existingSet.has(n));

      if (missingInBatch.length === 0) return;

      this.logger.debug(`Syncing ${blockchain.name} latest batch: ${missingInBatch.length} new blocks in range ${actualStart}-${actualEnd}`);
      await this.syncBtcLtcBlocksBatch(blockchain, rpcUrl, missingInBatch);
      return;
    }

    if (name === 'XRP') {
      const rpcUrl = provider.url;
      await this.syncXrpLatestBatch(blockchain, rpcUrl, BATCH_SIZE);
      return;
    }
  }

  private async syncBtcLtcBlocksBatch(
    blockchain: Blockchain,
    rpcUrl: string,
    blockNumbers: number[],
  ): Promise<void> {
    const wallets = await this.walletRepo.find({
      where: { blockchain: { id: blockchain.id }, isActive: true },
      relations: { user: true, blockchain: true },
    });
    if (wallets.length === 0) return;

    const walletByAddress = new Map<string, Wallet>();
    for (const w of wallets) {
      walletByAddress.set(w.publicKey.trim(), w);
    }

    const coinCurrency = await this.currencyRepo.findOne({
      where: { blockchain: { id: blockchain.id }, type: CurrencyType.COIN },
      relations: { blockchain: true },
    });

    if (!coinCurrency) return;

    // Step 1: Get block hashes for all block numbers
    // Aligning with Python litecoin_service.py: process in chunks if needed, although batchSize is small here
    const CHUNK_SIZE = 100;
    const blockHashes: string[] = [];
    const successfulNumbers: number[] = [];

    for (let i = 0; i < blockNumbers.length; i += CHUNK_SIZE) {
      const chunk = blockNumbers.slice(i, i + CHUNK_SIZE);
      const hashPayload = chunk.map((n) => ({
        jsonrpc: '1.0',
        id: n,
        method: 'getblockhash',
        params: [n]
      }));

      try {
        const hashRes = await axios.post(rpcUrl, hashPayload, {
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'blockchain-sync-service/1.0',
          },
          timeout: 20000
        });

        const results = Array.isArray(hashRes.data) ? hashRes.data : [hashRes.data];
        for (const item of results) {
          if (item.result && !item.error) {
            blockHashes.push(item.result);
            successfulNumbers.push(Number(item.id));
          } else if (item.error) {
            this.logger.warn(`RPC error for ${blockchain.name} block ${item.id}: ${item.error.message || JSON.stringify(item.error)}`);
          }
        }
      } catch (postErr) {
        if (postErr.response?.status === 400 || postErr.response?.status === 405) {
          this.logger.debug(`${blockchain.name} batch hash fetch failed with ${postErr.response.status}, falling back to sequential`);
          await this.syncBtcLtcBlocks(blockchain, rpcUrl, chunk);
          continue;
        }
        throw postErr;
      }
    }

    if (blockHashes.length === 0) {
      this.logger.warn(`No block hashes returned for ${blockchain.name} batch`);
      return;
    }

    // Step 2: Get full block data for all hashes (verbosity 2)
    for (let i = 0; i < blockHashes.length; i += CHUNK_SIZE) {
      const chunk = blockHashes.slice(i, i + CHUNK_SIZE);
      const blockPayload = chunk.map((h) => ({
        jsonrpc: '1.0',
        id: h,
        method: 'getblock',
        params: [h, 2]
      }));

      try {
        const blockRes = await axios.post(rpcUrl, blockPayload, {
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'blockchain-sync-service/1.0',
          },
          timeout: 60000
        });

        const blocks = Array.isArray(blockRes.data) ? blockRes.data : [blockRes.data];
        for (const item of blocks) {
          if (item.error || !item.result) {
            if (item.error) this.logger.warn(`RPC error in ${blockchain.name} block fetch: ${item.error.message}`);
            continue;
          }
          const block = item.result;
          const blockNumber = block.height;

          // Update block history
          try {
            await this.blockHistoryRepo
              .createQueryBuilder()
              .insert()
              .into(BlockHistory)
              .values({ number: blockNumber, blockchainId: blockchain.id })
              .orIgnore()
              .execute();
          } catch (e) {}

          if (!block.tx) continue;
          for (const tx of block.tx) {
            if (!tx.txid) continue;
            await this.processBtcLtcTransaction(blockchain, coinCurrency, tx, walletByAddress);
          }
        }
      } catch (postErr) {
        if (postErr.response?.status === 400 || postErr.response?.status === 405) {
          this.logger.debug(`${blockchain.name} batch block fetch failed with ${postErr.response.status}, falling back to sequential`);
          // Map hashes back to numbers if possible, or just skip
          // For simplicity, we skip this chunk and log
          continue;
        }
        throw postErr;
      }
    }
  }

  private async processBtcLtcTransaction(
    blockchain: Blockchain,
    coinCurrency: Currency,
    tx: any,
    walletByAddress: Map<string, Wallet>
  ) {
    // 1. Try to update existing WAITING transaction
    const updated = await this.transactionService.createIfNotExists({
      currency: coinCurrency,
      blockchain,
      wallet: null,
      transactionHash: tx.txid,
      value: 0,
      type: TransactionType.DEPOSIT,
      status: TransactionStatus.SUCCESS,
    });
    if (updated) return;

    const transactionsToCreate: any[] = [];

    // Detect Deposits (incoming to our wallets)
    if (tx.vout) {
      for (const vout of tx.vout) {
        const scriptPubKey = vout.scriptPubKey;
        const addresses = scriptPubKey.addresses || (scriptPubKey.address ? [scriptPubKey.address] : []);
        
        for (const address of addresses) {
          const wallet = walletByAddress.get(address);
          if (wallet) {
            transactionsToCreate.push({
              currency: coinCurrency,
              blockchain,
              user: wallet.user,
              wallet,
              transactionHash: tx.txid,
              value: parseFloat(vout.value),
              type: TransactionType.DEPOSIT,
              status: TransactionStatus.SUCCESS,
              externalWallet: null,
            });
          }
        }
      }
    }

    if (transactionsToCreate.length > 0) {
      await Promise.all(
        transactionsToCreate.map((txData) =>
          this.transactionService.createIfNotExists(txData),
        ),
      );
    }
  }

  private async syncBtcLtcBlocks(
    blockchain: Blockchain,
    rpcUrl: string,
    blockNumbers: number[],
  ): Promise<void> {
    const wallets = await this.walletRepo.find({
      where: { blockchain: { id: blockchain.id }, isActive: true },
      relations: { user: true, blockchain: true },
    });
    if (wallets.length === 0) return;

    const walletByAddress = new Map<string, Wallet>();
    for (const w of wallets) {
      walletByAddress.set(w.publicKey.trim(), w);
    }

    const coinCurrency = await this.currencyRepo.findOne({
      where: { blockchain: { id: blockchain.id }, type: CurrencyType.COIN },
      relations: { blockchain: true },
    });

    if (!coinCurrency) return;

    for (const blockNumber of blockNumbers) {
      try {
        const blockHash = await this.rpcCall<string>(rpcUrl, 'getblockhash', [blockNumber], '1.0');
        const block = await this.rpcCall<any>(rpcUrl, 'getblock', [blockHash, 2], '1.0');

        if (!block || !block.tx) continue;

        // Update block history - using try/catch and orIgnore for maximum safety
        try {
          await this.blockHistoryRepo
            .createQueryBuilder()
            .insert()
            .into(BlockHistory)
            .values({ number: blockNumber, blockchainId: blockchain.id })
            .orIgnore()
            .execute();
        } catch (e) {
          // Already exists
        }

        for (const tx of block.tx) {
          if (!tx.txid) continue;
          await this.processBtcLtcTransaction(blockchain, coinCurrency, tx, walletByAddress);
        }
      } catch (err) {
        this.logger.error(`Error syncing BTC/LTC block ${blockNumber}: ${err.message}`);
      }
    }
  }

  private async syncXrpLatestBatch(blockchain: Blockchain, rpcUrl: string, batchSize: number): Promise<void> {
    try {
      const response = await this.rpcCall<any>(rpcUrl, 'ledger', [
        { ledger_index: 'validated' },
      ], '1.0');
      
      const latestLedger = parseInt(response.ledger_index || response.ledger?.ledger_index);
      if (!latestLedger) return;

      const actualStart = Math.max(0, latestLedger - batchSize + 1);
      const ledgerIndices: number[] = [];
      for (let n = actualStart; n <= latestLedger; n++) ledgerIndices.push(n);

      const existingBlocks = await this.blockHistoryRepo.find({
        where: {
          blockchainId: blockchain.id,
          number: In(ledgerIndices)
        },
        select: { number: true }
      });
      const existingSet = new Set(existingBlocks.map(b => b.number));
      const missingInBatch = ledgerIndices.filter(n => !existingSet.has(n));

      if (missingInBatch.length === 0) return;

      this.logger.debug(`Syncing XRP latest batch: ${missingInBatch.length} new ledgers in range ${actualStart}-${latestLedger}`);
      await this.syncXrpBlocks(blockchain, rpcUrl, missingInBatch);
    } catch (err) {
      this.logger.error(`Error fetching latest XRP ledger: ${err.message}`);
    }
  }

  private async syncXrpBlocks(
    blockchain: Blockchain,
    rpcUrl: string,
    ledgerIndices: number[],
  ): Promise<void> {
    const coinCurrency = await this.currencyRepo.findOne({
      where: { blockchain: { id: blockchain.id }, type: CurrencyType.COIN },
      relations: { blockchain: true },
    });

    if (!coinCurrency) return;

    const wallets = await this.walletRepo.find({
      where: { blockchain: { id: blockchain.id }, isActive: true },
      relations: { user: true, blockchain: true },
    });

    const walletByMemo = new Map<string, Wallet>();
    for (const w of wallets) {
      if (w.memo) walletByMemo.set(w.memo.toString(), w);
    }

    for (const ledgerIndex of ledgerIndices) {
      try {
        const response = await this.rpcCall<any>(rpcUrl, 'ledger', [
          { ledger_index: ledgerIndex, transactions: true, expand: true },
        ], '1.0');

        const ledger = response.ledger;
        if (!ledger || !ledger.transactions) continue;

        // Update block history - using try/catch and orIgnore for maximum safety
        try {
          await this.blockHistoryRepo
            .createQueryBuilder()
            .insert()
            .into(BlockHistory)
            .values({ number: ledgerIndex, blockchainId: blockchain.id })
            .orIgnore()
            .execute();
        } catch (e) {
          // Already exists
        }

        for (const tx of ledger.transactions) {
          if (tx.TransactionType !== 'Payment') continue;
          if (!tx.hash) continue;

          // 1. Try to update existing WAITING transaction
          const updated = await this.transactionService.createIfNotExists({
            currency: coinCurrency,
            blockchain,
            wallet: null,
            transactionHash: tx.hash,
            value: 0,
            type: TransactionType.DEPOSIT,
            status: TransactionStatus.SUCCESS,
          });
          if (updated) continue;

          if (tx.metaData?.TransactionResult !== 'tesSUCCESS') continue;

          const amountDrops = tx.Amount;
          if (typeof amountDrops !== 'string') continue;

          const amountXrp = parseInt(amountDrops) / 1_000_000;
          const destinationTag = tx.DestinationTag?.toString();
          
          if (destinationTag) {
            const recipientWallet = walletByMemo.get(destinationTag);
            if (recipientWallet && recipientWallet.publicKey === tx.Destination) {
              await this.transactionService.createIfNotExists({
                currency: coinCurrency,
                blockchain,
                user: recipientWallet.user,
                wallet: recipientWallet,
                transactionHash: tx.hash,
                value: amountXrp,
                type: TransactionType.DEPOSIT,
                status: TransactionStatus.SUCCESS,
                externalWallet: tx.Account,
              });
            }
          }

          // Check for withdrawals
          const senderWallet = wallets.find(w => w.publicKey === tx.Account);
          if (senderWallet) {
             await this.transactionService.createIfNotExists({
                currency: coinCurrency,
                blockchain,
                user: senderWallet.user,
                wallet: senderWallet,
                transactionHash: tx.hash,
                value: amountXrp,
                type: TransactionType.WITHDRAWAL,
                status: TransactionStatus.SUCCESS,
                externalWallet: tx.Destination,
              });
          }
        }
      } catch (err) {
        this.logger.error(`Error syncing XRP ledger ${ledgerIndex}: ${err.message}`);
      }
    }
  }

  private async getLatestBtcLtcBlockNumber(rpcUrl: string): Promise<number> {
    return this.rpcCall<number>(rpcUrl, 'getblockcount', [], '1.0');
  }

  private isEvmLikeBlockchain(name: string): boolean {
    return name === 'BSC' || name === 'ETH';
  }

  public async syncBlockchainSpecificBlocks(
    blockchain: Blockchain,
    blockNumbers: number[],
  ): Promise<void> {
    const name = blockchain.name.trim().toUpperCase();
    const provider = await this.providerService.getBestProviderForBlockchain(name);
    if (!provider) return;

    if (this.isEvmLikeBlockchain(name)) {
      await this.syncEvmBlocks(blockchain, provider.url, blockNumbers);
      return;
    }

    if (name === 'TRON') {
      await this.syncTronBlocks(blockchain, provider.url, blockNumbers, provider.apiKey);
      return;
    }

    if (name === 'BTC' || name === 'LTC') {
      await this.syncBtcLtcBlocks(blockchain, provider.url, blockNumbers);
      return;
    }

    if (name === 'XRP') {
      // XRP syncXrpBlocks handles latest, for specific blocks we'd need a different approach
      // but usually for XRP we just sync the latest ledger which contains all data.
      await this.syncXrpBlocks(blockchain, provider.url, blockNumbers);
      return;
    }
  }

  private async syncEvmBlocks(
    blockchain: Blockchain,
    rpcUrl: string,
    blockNumbers: number[],
  ): Promise<void> {
    const wallets = await this.walletRepo.find({
      where: {
        blockchain: { id: blockchain.id },
        isActive: true,
      },
      relations: { user: true, blockchain: true },
    });
    if (wallets.length === 0) return;

    const walletByAddress = new Map<string, Wallet>();
    for (const w of wallets) {
      walletByAddress.set(this.normalizeHexAddress(w.publicKey), w);
    }

    const [coinCurrency, tokenCurrencies] = await Promise.all([
      this.currencyRepo.findOne({
        where: {
          blockchain: { id: blockchain.id },
          type: CurrencyType.COIN,
        },
        relations: { blockchain: true },
      }),
      this.currencyRepo.find({
        where: {
          blockchain: { id: blockchain.id },
          type: CurrencyType.TOKEN,
        },
        relations: { blockchain: true },
      }),
    ]);

    const tokenCurrencyByAddress = new Map<string, Currency>();
    for (const c of tokenCurrencies) {
      if (!c.tokenAddress) continue;
      tokenCurrencyByAddress.set(this.normalizeHexAddress(c.tokenAddress), c);
    }

    const blocks = await this.fetchEvmBlocks(rpcUrl, blockNumbers);
    for (const block of blocks) {
      const blockNumber = this.hexToInt(block.number);
      
      try {
        await this.blockHistoryRepo
          .createQueryBuilder()
          .insert()
          .into(BlockHistory)
          .values({ number: blockNumber, blockchainId: blockchain.id })
          .orIgnore()
          .execute();
      } catch (e) {
        // Already exists
      }

      for (const tx of block.transactions) {
        if (!tx.hash) continue;

        // 1. Try to update existing WAITING transaction if found in block
        // This covers both withdrawals and deposits that were already known
        const updated = await this.transactionService.createIfNotExists({
          currency: coinCurrency!, // Dummy, will be ignored if exists
          blockchain,
          wallet: null,
          transactionHash: tx.hash,
          value: 0,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.SUCCESS,
        });
        if (updated) continue; // If it was an existing transaction, we are done with it

        if (!tx.to) continue;
        const txTo = this.normalizeHexAddress(tx.to);
        const fromAddress = this.normalizeHexAddress(tx.from);
        const nativeAmount = this.hexWeiToNumber(tx.value);

        // 2. Check for new native transactions (deposits or unknown withdrawals)
        if (nativeAmount > 0 && coinCurrency) {
          const recipientWallet = walletByAddress.get(txTo);
          const senderWallet = walletByAddress.get(fromAddress);

          if (recipientWallet) {
            await this.transactionService.createIfNotExists({
              currency: coinCurrency,
              blockchain,
              user: recipientWallet.user,
              wallet: recipientWallet,
              transactionHash: tx.hash,
              value: nativeAmount,
              type: TransactionType.DEPOSIT,
              status: TransactionStatus.SUCCESS,
              externalWallet: fromAddress,
            });
          } else if (senderWallet) {
            await this.transactionService.createIfNotExists({
              currency: coinCurrency,
              blockchain,
              user: senderWallet.user,
              wallet: senderWallet,
              transactionHash: tx.hash,
              value: nativeAmount,
              type: TransactionType.WITHDRAWAL,
              status: TransactionStatus.SUCCESS,
              externalWallet: txTo,
            });
          }
        }

        // 3. Check for ERC20 transactions
        const tokenCurrency = tokenCurrencyByAddress.get(txTo);
        if (tokenCurrency) {
          const transfer = this.decodeErc20TransferInput(tx.input);
          if (transfer) {
            const recipient = this.normalizeHexAddress(transfer.to);
            const recipientWallet = walletByAddress.get(recipient);
            const senderWallet = walletByAddress.get(fromAddress);

            const decimals = await this.getErc20Decimals(rpcUrl, txTo);
            const tokenAmount = this.bigIntToDecimalNumber(transfer.value, decimals);
            
            if (Number.isFinite(tokenAmount) && tokenAmount > 0) {
              if (recipientWallet) {
                await this.transactionService.createIfNotExists({
                  currency: tokenCurrency,
                  blockchain,
                  user: recipientWallet.user,
                  wallet: recipientWallet,
                  transactionHash: tx.hash,
                  value: tokenAmount,
                  type: TransactionType.DEPOSIT,
                  status: TransactionStatus.SUCCESS,
                  externalWallet: fromAddress,
                });
              } else if (senderWallet) {
                await this.transactionService.createIfNotExists({
                  currency: tokenCurrency,
                  blockchain,
                  user: senderWallet.user,
                  wallet: senderWallet,
                  transactionHash: tx.hash,
                  value: tokenAmount,
                  type: TransactionType.WITHDRAWAL,
                  status: TransactionStatus.SUCCESS,
                  externalWallet: recipient,
                });
              }
            }
          }
        }
      }
    }
  }

  private async syncTronBlocks(
    blockchain: Blockchain,
    rpcUrl: string,
    blockNumbers: number[],
    apiKey?: string,
  ): Promise<void> {
    const wallets = await this.walletRepo.find({
      where: {
        blockchain: { id: blockchain.id },
        isActive: true,
      },
      relations: { user: true, blockchain: true },
    });
    if (wallets.length === 0) return;

    const walletByAddress = new Map<string, Wallet>();
    for (const w of wallets) {
      walletByAddress.set(w.publicKey.trim(), w);
    }

    const [coinCurrency, tokenCurrencies] = await Promise.all([
      this.currencyRepo.findOne({
        where: {
          blockchain: { id: blockchain.id },
          type: CurrencyType.COIN,
        },
        relations: { blockchain: true },
      }),
      this.currencyRepo.find({
        where: {
          blockchain: { id: blockchain.id },
          type: CurrencyType.TOKEN,
        },
        relations: { blockchain: true },
      }),
    ]);

    const tokenCurrencyByAddress = new Map<string, Currency>();
    for (const c of tokenCurrencies) {
      if (!c.tokenAddress) continue;
      const addr = c.tokenAddress.trim();
      // For TRON, if it's hex, convert to base58 for consistent lookup
      const lookupAddr =
        addr.startsWith('0x') || (addr.length === 40 && /^[0-9a-fA-F]+$/.test(addr))
          ? this.toTronBase58(addr) || addr
          : addr;
      tokenCurrencyByAddress.set(lookupAddr, c);
    }

    const blocks = await this.fetchTronBlocks(rpcUrl, blockNumbers, apiKey);
    for (const block of blocks) {
      if (!block || !block.block_header) continue;
      const blockNumber = block.block_header.raw_data.number;
      
      try {
        await this.blockHistoryRepo
          .createQueryBuilder()
          .insert()
          .into(BlockHistory)
          .values({ number: blockNumber, blockchainId: blockchain.id })
          .orIgnore()
          .execute();
      } catch (e) {
        // Already exists
      }

      if (!block.transactions) continue;

      for (const tx of block.transactions) {
        const rawTx = tx as any;
        if (!rawTx.txID) continue;

        // 1. Try to update existing WAITING transaction
        const updated = await this.transactionService.createIfNotExists({
          currency: coinCurrency!,
          blockchain,
          wallet: null,
          transactionHash: rawTx.txID,
          value: 0,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.SUCCESS,
        });
        if (updated) continue;

        if (!rawTx.raw_data || !rawTx.raw_data.contract || rawTx.raw_data.contract.length === 0) continue;

        const contract = rawTx.raw_data.contract[0];
        const type = contract.type;
        const value = contract.parameter.value;

        // Handle TRX Transfer
        if (type === 'TransferContract') {
          const toAddress = this.toTronBase58(value.to_address);
          const fromAddress = this.toTronBase58(value.owner_address);
          const amount = value.amount;

          if (toAddress && coinCurrency) {
            const recipientWallet = walletByAddress.get(toAddress);
            const senderWallet = fromAddress ? walletByAddress.get(fromAddress) : null;

            const trxAmount = amount / 1_000_000;
            if (recipientWallet) {
              await this.transactionService.createIfNotExists({
                currency: coinCurrency,
                blockchain,
                user: recipientWallet.user,
                wallet: recipientWallet,
                transactionHash: rawTx.txID,
                value: trxAmount,
                type: TransactionType.DEPOSIT,
                status: TransactionStatus.SUCCESS,
                externalWallet: fromAddress || '',
              });
            } else if (senderWallet) {
              await this.transactionService.createIfNotExists({
                currency: coinCurrency,
                blockchain,
                user: senderWallet.user,
                wallet: senderWallet,
                transactionHash: rawTx.txID,
                value: trxAmount,
                type: TransactionType.WITHDRAWAL,
                status: TransactionStatus.SUCCESS,
                externalWallet: toAddress || '',
              });
            }
          }
        } 
        // Handle TRC20 Transfer
        else if (type === 'TriggerSmartContract') {
            const contractAddress = this.toTronBase58(value.contract_address);
            const tokenCurrency = tokenCurrencyByAddress.get(contractAddress || '');
            
            if (tokenCurrency && value.data && value.data.startsWith('a9059cbb')) {
                const params = value.data.substring(8);
                const toHex = '41' + params.substring(24, 64);
                const toAddress = this.toTronBase58(toHex);
                const fromAddress = this.toTronBase58(value.owner_address);
                const amountHex = params.substring(64, 128);
                const amountBigInt = BigInt('0x' + amountHex);
                
                if (toAddress) {
                    const recipientWallet = walletByAddress.get(toAddress);
                    const senderWallet = fromAddress ? walletByAddress.get(fromAddress) : null;

                    const decimals = await this.getErc20Decimals(rpcUrl, contractAddress!);
                    const tokenAmount = this.bigIntToDecimalNumber(amountBigInt, decimals);
                    
                    if (Number.isFinite(tokenAmount) && tokenAmount > 0) {
                         if (recipientWallet) {
                             await this.transactionService.createIfNotExists({
                                currency: tokenCurrency,
                                blockchain,
                                user: recipientWallet.user,
                                wallet: recipientWallet,
                                transactionHash: rawTx.txID,
                                value: tokenAmount,
                                type: TransactionType.DEPOSIT,
                                status: TransactionStatus.SUCCESS,
                                externalWallet: fromAddress || '',
                              });
                         } else if (senderWallet) {
                             await this.transactionService.createIfNotExists({
                                currency: tokenCurrency,
                                blockchain,
                                user: senderWallet.user,
                                wallet: senderWallet,
                                transactionHash: rawTx.txID,
                                value: tokenAmount,
                                type: TransactionType.WITHDRAWAL,
                                status: TransactionStatus.SUCCESS,
                                externalWallet: toAddress || '',
                              });
                         }
                    }
                }
            }
        }
      }
    }
  }

  private async getLatestEvmBlockNumber(rpcUrl: string): Promise<number> {
    const response = await this.rpcCall<string>(rpcUrl, 'eth_blockNumber', []);
    return this.hexToInt(response);
  }

  private async getLatestTronBlockNumber(rpcUrl: string, apiKey?: string): Promise<number> {
    const baseUrl = this.getTronBaseUrl(rpcUrl);
    let retryCount = 0;
    const maxRetries = 3;

    const headers: any = { 'Content-Type': 'application/json' };
    if (apiKey) {
      headers['TRON-PRO-API-KEY'] = apiKey;
    }

    while (retryCount <= maxRetries) {
      try {
        // Prefer getnowblock as it is more commonly available than getnodeinfo
        const response = await axios.post<any>(`${baseUrl}/wallet/getnowblock`, {}, {
          timeout: 20_000,
          headers
        });
        
        if (response.data && response.data.block_header) {
          return response.data.block_header.raw_data.number;
        }
        
        // Fallback to getnodeinfo if getnowblock fails or returns unexpected data
        const nodeInfoResponse = await axios.post<{ block?: string }>(`${baseUrl}/wallet/getnodeinfo`, {}, {
          timeout: 20_000,
          headers
        });
        const block = nodeInfoResponse.data.block ?? '';
        const match = block.match(/Num:(\d+)/i);
        if (match) return Number(match[1]);
        
        throw new Error('failed to parse tron block number');
      } catch (err) {
        const status = err.response?.status;
        if (status === 405 && retryCount === 0) {
          // If POST fails with 405, try GET as a last resort
          try {
            const response = await axios.get<any>(`${baseUrl}/wallet/getnowblock`, { 
              timeout: 20_000,
              headers
            });
            if (response.data && response.data.block_header) {
              return response.data.block_header.raw_data.number;
            }
          } catch (e) { /* ignore */ }
        }

        if (status === 429 && retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000 + 500;
          this.logger.warn(`Rate limited (429) fetching latest TRON block number, retrying in ${delay}ms...`);
          await this.sleep(delay);
          retryCount++;
        } else {
          throw err;
        }
      }
    }
    throw new Error(`Failed to fetch latest TRON block number after ${maxRetries} retries`);
  }

  private getTronBaseUrl(rpcUrl: string): string {
    const trimmed = rpcUrl.trim().replace(/\/+$/, '');
    if (trimmed.toLowerCase().endsWith('/jsonrpc')) {
      return trimmed.slice(0, -'/jsonrpc'.length);
    }
    return trimmed;
  }

  private async fetchEvmBlocks(
    rpcUrl: string,
    numbers: number[],
  ): Promise<EvmBlock[]> {
    if (numbers.length === 0) return [];

    // Chunk large requests to avoid RPC payload size limits or timeouts
    const CHUNK_SIZE = 10;
    const allBlocks: EvmBlock[] = [];

    for (let i = 0; i < numbers.length; i += CHUNK_SIZE) {
      const chunk = numbers.slice(i, i + CHUNK_SIZE);
      const payload = chunk.map((n) => ({
        jsonrpc: '2.0',
        id: n,
        method: 'eth_getBlockByNumber',
        params: [this.intToHex(n), true],
      }));

      try {
        let retryCount = 0;
        const maxRetries = 3;
        let success = false;

        while (retryCount <= maxRetries && !success) {
          try {
            const response = await axios.post<JsonRpcResponse<EvmBlock>[]>(
              rpcUrl,
              payload,
              {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15_000, // 15s timeout for batch
              },
            );

            for (const item of response.data) {
              if ('result' in item && item.result) allBlocks.push(item.result);
            }
            success = true;
          } catch (err) {
            const status = err.response?.status;
            if (status === 429 && retryCount < maxRetries) {
              const delay = Math.pow(2, retryCount) * 1000;
              this.logger.warn(`Rate limited (429) fetching EVM blocks chunk, retrying in ${delay}ms... (Attempt ${retryCount + 1}/${maxRetries + 1})`);
              await this.sleep(delay);
              retryCount++;
            } else {
              this.logger.error(`Failed to fetch EVM blocks chunk: ${err.message}`);
              break; // Don't retry for other errors
            }
          }
        }
      } catch (err) {
        this.logger.error(`Unexpected error fetching EVM blocks chunk: ${err.message}`);
      }
    }

    return allBlocks;
  }

  private async rpcCall<T>(
    rpcUrl: string,
    method: string,
    params: unknown[],
    version: string = '2.0',
  ): Promise<T> {
    const payload: any = { id: Math.floor(Math.random() * 100000), method, params };
    if (version === '2.0') {
      payload.jsonrpc = '2.0';
    } else if (version === '1.0') {
      payload.jsonrpc = '1.0';
    }

    let retryCount = 0;
    const maxRetries = 4;

    while (retryCount <= maxRetries) {
      try {
        const response = await axios.post(rpcUrl, payload, {
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'blockchain-sync-service/1.0',
          },
          timeout: 15_000,
        });

        const data = response.data;
        if (data.error) {
          throw new Error(data.error.message || JSON.stringify(data.error));
        }
        
        return data.result !== undefined ? data.result : data;
      } catch (err) {
        const status = err.response?.status;
        
        // Handle 404, 400, 405 - try alternative URLs on first attempt
        if ((status === 404 || status === 400 || status === 405) && retryCount === 0) {
          const alternativeUrls: string[] = [];
          const trimmed = rpcUrl.replace(/\/+$/, '');
          
          if (rpcUrl.endsWith('/')) {
            alternativeUrls.push(trimmed);
          } else {
            alternativeUrls.push(trimmed + '/');
          }
          
          alternativeUrls.push(trimmed + '/rpc');
          alternativeUrls.push(trimmed + '/mainnet');
          
          if (rpcUrl.includes('litecoin')) {
            alternativeUrls.push('https://litecoin.drpc.org');
            alternativeUrls.push('https://litecoin.publicnode.com');
          }

          for (const altUrl of alternativeUrls) {
            try {
              this.logger.debug(`Retrying RPC ${method} with alternative URL: ${altUrl}`);
              const altRes = await axios.post(altUrl, payload, {
                headers: { 
                  'Content-Type': 'application/json',
                  'User-Agent': 'blockchain-sync-service/1.0',
                },
                timeout: 10_000,
              });
              const altData = altRes.data;
              if (altRes.status === 200 && !altData.error) {
                this.logger.log(`Auto-corrected RPC URL from ${rpcUrl} to ${altUrl}`);
                return altData.result !== undefined ? altData.result : altData;
              }
            } catch (e) { /* ignore */ }
          }
        }

        // Handle rate limiting and gateway errors with exponential backoff
        if ((status === 429 || status === 502 || status === 503 || status === 504) && retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000 + Math.floor(Math.random() * 1000);
          this.logger.warn(`RPC ${method} failed with ${status}, retrying in ${delay}ms... (Attempt ${retryCount + 1}/${maxRetries})`);
          await this.sleep(delay);
          retryCount++;
        } else {
          throw err;
        }
      }
    }
    throw new Error(`Failed after ${maxRetries} retries for ${method} at ${rpcUrl}`);
  }

  private decodeErc20TransferInput(
    input: string,
  ): { to: string; value: bigint } | null {
    const hex = input.startsWith('0x') ? input.slice(2) : input;
    if (hex.length < 8 + 64 + 64) return null;
    if (!hex.startsWith('a9059cbb')) return null;

    const toWord = hex.slice(8, 8 + 64);
    const valueWord = hex.slice(8 + 64, 8 + 64 + 64);

    const to = '0x' + toWord.slice(24);
    const value = BigInt('0x' + valueWord);
    return { to, value };
  }

  private async getErc20Decimals(
    rpcUrl: string,
    tokenAddress: string,
  ): Promise<number> {
    const normalized = this.normalizeHexAddress(tokenAddress);
    const cached = this.tokenDecimalsByAddress.get(normalized);
    if (cached !== undefined) return cached;

    const data = '0x313ce567';
    const result = await this.rpcCall<string>(rpcUrl, 'eth_call', [
      { to: normalized, data },
      'latest',
    ]);
    const decimals = this.hexToInt(result);
    const safe =
      Number.isFinite(decimals) && decimals >= 0 && decimals <= 36
        ? decimals
        : 18;
    this.tokenDecimalsByAddress.set(normalized, safe);
    return safe;
  }

  private normalizeHexAddress(address: string): string {
    if (!address) return '';
    return address.trim().toLowerCase();
  }

  private hexToInt(hex: string): number {
    const normalized = hex.startsWith('0x') ? hex : `0x${hex}`;
    return Number.parseInt(normalized, 16);
  }

  private hexToBigInt(hex: string): bigint {
    const normalized = hex.startsWith('0x') ? hex : `0x${hex}`;
    return BigInt(normalized);
  }

  private intToHex(value: number): string {
    return `0x${value.toString(16)}`;
  }

  private hexWeiToNumber(hexWei: string): number {
    const normalized = hexWei.startsWith('0x') ? hexWei : `0x${hexWei}`;
    const wei = BigInt(normalized);
    return this.bigIntToDecimalNumber(wei, 18);
  }

  private bigIntToDecimalNumber(value: bigint, decimals: number): number {
    const base = BigInt(10) ** BigInt(decimals);
    const integerPart = value / base;
    const fractionalPart = value % base;
    const fracStr = fractionalPart
      .toString()
      .padStart(decimals, '0')
      .replace(/0+$/, '');
    const str = fracStr
      ? `${integerPart.toString()}.${fracStr}`
      : integerPart.toString();
    return Number(str);
  }

  private toTronBase58(address: string): string | null {
    if (!address) return null;
    const hex = address.trim().toLowerCase().replace(/^0x/, '');
    if (!hex) return null;

    let payloadHex = hex;
    if (payloadHex.length === 40) payloadHex = `41${payloadHex}`;
    if (payloadHex.length !== 42) return null;

    const payload = Buffer.from(payloadHex, 'hex');
    const checksum = this.sha256(this.sha256(payload)).subarray(0, 4);
    const bytes = Buffer.concat([payload, checksum]);
    return this.base58Encode(bytes);
  }

  private sha256(data: Buffer): Buffer {
    return crypto.createHash('sha256').update(data).digest();
  }

  private base58Encode(data: Buffer): string {
    const alphabet =
      '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

    let value = 0n;
    for (const byte of data) value = (value << 8n) + BigInt(byte);

    let encoded = '';
    while (value > 0n) {
      const mod = Number(value % 58n);
      encoded = alphabet[mod] + encoded;
      value /= 58n;
    }

    let leadingZeroCount = 0;
    for (const byte of data) {
      if (byte !== 0) break;
      leadingZeroCount++;
    }

    return `${'1'.repeat(leadingZeroCount)}${encoded || '1'}`;
  }
}
