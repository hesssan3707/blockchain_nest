import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository, MoreThanOrEqual } from 'typeorm';
import { Blockchain } from '../blockchain/blockchain.entity';
import { Currency, CurrencyType } from '../currency/currency.entity';
import { SettingService } from '../setting/setting.service';
import { PriceService } from '../price/price.service';
import { Transaction, TransactionStatus, TransactionType } from './transaction.entity';
import { Wallet } from './wallet.entity';
import { ConfigService } from '@nestjs/config';
import { decryptWalletData } from '../../common/security/wallet-encryption';
import { ProviderService } from '../provider/provider.service';
import { TransactionService } from './transaction.service';
import { ethers } from 'ethers';
import { TronWeb } from 'tronweb';
import axios from 'axios';

import { WalletBalance } from './wallet-balance.entity';

@Injectable()
export class WalletTaskService {
  private readonly logger = new Logger(WalletTaskService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(Currency)
    private readonly currencyRepo: Repository<Currency>,
    @InjectRepository(Blockchain)
    private readonly blockchainRepo: Repository<Blockchain>,
    @InjectRepository(WalletBalance)
    private readonly balanceRepo: Repository<WalletBalance>,
    private readonly settingService: SettingService,
    private readonly priceService: PriceService,
    private readonly configService: ConfigService,
    private readonly providerService: ProviderService,
    private readonly transactionService: TransactionService,
  ) {}

  async getWithdrawalWallet(blockchainName: string, amount: number, currencySymbol: string) {
    const confirmationRequiredAmount = await this.settingService.get('confirmation_required_amount');
    const requiredAmount = confirmationRequiredAmount ? parseFloat(confirmationRequiredAmount) : 200;

    let usdtEquivalent = amount;
    let isLarge = true;

    if (currencySymbol.toUpperCase() !== 'USDT') {
      try {
        const priceInUsdt = await this.priceService.priceConverter(currencySymbol, 'USDT');
        usdtEquivalent = amount * priceInUsdt;
        isLarge = usdtEquivalent >= requiredAmount;
      } catch (error) {
        this.logger.warn(`Error converting price from ${currencySymbol} to USDT: ${error.message}. Defaulting to normal withdrawal wallet.`);
        isLarge = true; // Default to normal wallet if price conversion fails
      }
    } else {
      isLarge = amount >= requiredAmount;
    }

    const prefix = isLarge ? '' : 'SMALL_';
    const chainPrefix = blockchainName.toUpperCase();

    const publicKey = this.configService.get<string>(`${chainPrefix}_${prefix}WITHDRAWAL_PUBLIC_KEY`);
    const privateKey = this.configService.get<string>(`${chainPrefix}_${prefix}WITHDRAWAL_PRIVATE_KEY`);

    return { 
      publicKey, 
      privateKey: privateKey ? decryptWalletData(privateKey) : privateKey 
    };
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async balanceCollectorTask() {
    this.logger.log('Starting balance collector task...');
    const currencies = await this.currencyRepo.find({ relations: { blockchain: true } });

    for (const currency of currencies) {
      if (!currency.isActive || !currency.minBalanceCollectorAmount) continue;

      const balancesToCollect = await this.balanceRepo.find({
        where: {
          currencyId: currency.id,
          networkBalance: MoreThanOrEqual(currency.minBalanceCollectorAmount),
        },
        relations: { wallet: { blockchain: true, user: true } },
      });

      for (const balance of balancesToCollect) {
        const wallet = balance.wallet;

        if (!wallet || !wallet.isActive || !wallet.privateKey) continue;

        this.logger.log(`Collecting ${balance.networkBalance} ${currency.symbol} from ${wallet.publicKey} on ${currency.blockchain.name}`);
        
        try {
          await this.transferToSafeWallet(wallet, currency, balance.networkBalance);
        } catch (error) {
          this.logger.error(`Failed to collect balance from ${wallet.publicKey}: ${error.message}`);
        }
      }
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processWithdrawals() {
    this.logger.log('Checking for waiting withdrawals to broadcast...');
    const pendingWithdrawals = await this.transactionRepo.find({
      where: {
        type: TransactionType.WITHDRAWAL,
        status: TransactionStatus.WAITING,
        transactionHash: IsNull(),
      },
      relations: { blockchain: true, currency: true, user: true },
    });

    for (const tx of pendingWithdrawals) {
      try {
        const { publicKey, privateKey } = await this.getWithdrawalWallet(
          tx.blockchain.name,
          tx.value,
          tx.currency.symbol,
        );

        if (!publicKey || !privateKey) {
          const errorMsg = `Withdrawal wallet not configured for ${tx.blockchain.name}`;
          this.logger.error(errorMsg);
          tx.status = TransactionStatus.FAILED;
          tx.description = `The withdrawal could not be processed because the system wallet for ${tx.blockchain.name} is not configured. Please contact support.`;
          await this.transactionRepo.save(tx);
          continue;
        }

        const provider = await this.providerService.getBestProviderForBlockchain(tx.blockchain.name);
        if (!provider) {
          const errorMsg = `No provider available for ${tx.blockchain.name}`;
          this.logger.error(errorMsg);
          tx.status = TransactionStatus.FAILED;
          tx.description = `We are currently unable to connect to the ${tx.blockchain.name} network. Your transaction will be retried automatically once the connection is restored.`;
          await this.transactionRepo.save(tx);
          continue;
        }

        let txHash: string;
        if (tx.blockchain.name.toUpperCase() === 'TRON') {
          txHash = await this.sendTronTransaction(provider.url, privateKey, tx.externalWallet!, tx.value, tx.currency);
        } else {
          txHash = await this.sendEvmTransaction(provider.url, privateKey, tx.externalWallet!, tx.value, tx.currency);
        }

        if (txHash) {
          tx.transactionHash = txHash;
          // Keep status as WAITING, align with Python logic
          await this.transactionRepo.save(tx);
          this.logger.log(`Withdrawal ${tx.id} broadcasted. Hash: ${txHash}`);
        }
      } catch (error) {
        this.logger.error(`Failed to broadcast withdrawal ${tx.id}: ${error.message}`);
        tx.status = TransactionStatus.FAILED;
        tx.description = `The transaction could not be sent to the blockchain network. Error: ${error.message}. This may be due to network congestion or an internal error. Please contact support.`;
        await this.transactionRepo.save(tx);
      }
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkTransactionStatus() {
    this.logger.log('Checking status of waiting transactions on-chain...');
    const waitingTransactions = await this.transactionRepo.find({
      where: {
        status: TransactionStatus.WAITING,
        transactionHash: Not(IsNull()),
      },
      relations: { blockchain: true, currency: true },
    });

    for (const tx of waitingTransactions) {
      try {
        const provider = await this.providerService.getBestProviderForBlockchain(tx.blockchain.name);
        if (!provider) continue;

        let statusInfo: { status: boolean | null; fee: number; feeCurrency?: Currency } = { status: null, fee: 0 };
        const blockchainName = tx.blockchain.name.toUpperCase();
        
        if (blockchainName === 'TRON') {
          statusInfo = await this.getTronTransactionStatusInfo(provider.url, tx.transactionHash!, tx.blockchain);
        } else if (blockchainName === 'BTC' || blockchainName === 'LTC') {
          statusInfo = await this.getBtcLtcTransactionStatusInfo(provider.url, tx.transactionHash!, tx.blockchain);
        } else if (blockchainName === 'XRP') {
          statusInfo = await this.getXrpTransactionStatusInfo(provider.url, tx.transactionHash!, tx.blockchain);
        } else {
          statusInfo = await this.getEvmTransactionStatusInfo(provider.url, tx.transactionHash!, tx.blockchain);
        }

        if (statusInfo.status === true) {
          await this.transactionService.processConfirmedTransaction(tx, statusInfo.fee, statusInfo.feeCurrency);
          this.logger.log(`Transaction ${tx.transactionHash} success with fee ${statusInfo.fee}`);
        } else if (statusInfo.status === false) {
          tx.status = TransactionStatus.FAILED;
          tx.description = 'The transaction was sent but failed on the blockchain. This usually happens if there are insufficient funds for fees or if the network reverted the operation.';
          await this.transactionRepo.save(tx);
          this.logger.log(`Transaction ${tx.transactionHash} failed`);
        }
      } catch (error) {
        this.logger.error(`Error checking status for ${tx.transactionHash}: ${error.message}`);
      }
    }
  }

  private async getEvmTransactionStatusInfo(rpcUrl: string, hash: string, blockchain: Blockchain): Promise<{ status: boolean | null; fee: number; feeCurrency?: Currency }> {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const receipt = await provider.getTransactionReceipt(hash);
      if (!receipt) return { status: null, fee: 0 };
      
      const gasUsed = BigInt(receipt.gasUsed);
      const gasPrice = receipt.gasPrice ? BigInt(receipt.gasPrice) : BigInt(0);
      const fee = Number(ethers.formatEther(gasUsed * gasPrice));
      
      const nativeCurrency = await this.currencyRepo.findOne({
        where: { blockchainId: blockchain.id, type: CurrencyType.COIN }
      });

      return { status: receipt.status === 1, fee, feeCurrency: nativeCurrency || undefined };
    } catch (error) {
      return { status: null, fee: 0 };
    }
  }

  private async getTronTransactionStatusInfo(rpcUrl: string, hash: string, blockchain: Blockchain): Promise<{ status: boolean | null; fee: number; feeCurrency?: Currency }> {
    try {
      const tronWeb = new (TronWeb as any)({ fullHost: rpcUrl });
      const tx = await tronWeb.trx.getTransaction(hash);
      if (!tx || !tx.ret) return { status: null, fee: 0 };
      
      const fee = (tx.ret[0].fee || 0) / 1000000; // SUN to TRX
      
      const nativeCurrency = await this.currencyRepo.findOne({
        where: { blockchainId: blockchain.id, type: CurrencyType.COIN }
      });

      return { status: tx.ret[0].contractRet === 'SUCCESS', fee, feeCurrency: nativeCurrency || undefined };
    } catch (error) {
      return { status: null, fee: 0 };
    }
  }

  private async getBtcLtcTransactionStatusInfo(rpcUrl: string, hash: string, blockchain: Blockchain): Promise<{ status: boolean | null; fee: number; feeCurrency?: Currency }> {
    try {
      const payload = {
        jsonrpc: '1.0',
        id: Math.floor(Math.random() * 100000),
        method: 'getrawtransaction',
        params: [hash, 1],
      };
      const response = await axios.post(rpcUrl, payload, { timeout: 10000 });
      const data = response.data;
      if (data.error) return { status: null, fee: 0 };
      
      const tx = data.result;
      if (!tx) return { status: null, fee: 0 };
      
      let fee = 0;
      if (tx.fee) {
        fee = tx.fee;
      }
      
      const nativeCurrency = await this.currencyRepo.findOne({
        where: { blockchainId: blockchain.id, type: CurrencyType.COIN }
      });

      return { status: (tx.confirmations || 0) > 0, fee, feeCurrency: nativeCurrency || undefined };
    } catch (error) {
      return { status: null, fee: 0 };
    }
  }

  private async getXrpTransactionStatusInfo(rpcUrl: string, hash: string, blockchain: Blockchain): Promise<{ status: boolean | null; fee: number; feeCurrency?: Currency }> {
    try {
      const payload = {
        method: 'tx',
        params: [{ transaction: hash }],
      };
      const response = await axios.post(rpcUrl, payload, { timeout: 10000 });
      const data = response.data;
      if (data.result?.error) return { status: null, fee: 0 };
      
      const fee = (data.result?.Fee || 0) / 1000000; // drops to XRP
      
      const nativeCurrency = await this.currencyRepo.findOne({
        where: { blockchainId: blockchain.id, type: CurrencyType.COIN }
      });

      return { status: data.result?.validated === true, fee, feeCurrency: nativeCurrency || undefined };
    } catch (error) {
      return { status: null, fee: 0 };
    }
  }

  async transferToSafeWallet(wallet: Wallet, currency: Currency, amount: number) {
    const blockchainName = wallet.blockchain.name.toUpperCase();
    const safeWalletPublicKey = this.configService.get<string>(`${blockchainName}_SAFE_WALLET_PUBLIC_KEY`);
    
    if (!safeWalletPublicKey) {
      this.logger.error(`Safe wallet not configured for ${blockchainName}`);
      return;
    }

    const provider = await this.providerService.getBestProviderForBlockchain(blockchainName);
    if (!provider) {
      this.logger.error(`No provider available for ${blockchainName}`);
      return;
    }

    // Check if we need to pay network fee first (only for tokens)
    if (currency.type === CurrencyType.TOKEN) {
      const needsFee = await this.checkNeedsNetworkFee(wallet, blockchainName, provider.url);
      if (needsFee) {
        this.logger.log(`Wallet ${wallet.publicKey} needs network fee for ${blockchainName}`);
        await this.payFeeAutomatic(blockchainName, wallet.publicKey);
        // Wait a bit for fee transaction to be confirmed
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }

    let txHash: string;
    const decryptedPrivateKey = wallet.privateKey ? decryptWalletData(wallet.privateKey) : null;
    if (!decryptedPrivateKey) {
      this.logger.error(`Private key not found for wallet ${wallet.publicKey}`);
      return;
    }

    if (blockchainName === 'TRON') {
      txHash = await this.sendTronTransaction(
        provider.url,
        decryptedPrivateKey,
        safeWalletPublicKey,
        amount,
        currency
      );
    } else {
      txHash = await this.sendEvmTransaction(
        provider.url,
        decryptedPrivateKey,
        safeWalletPublicKey,
        amount,
        currency
      );
    }

    if (txHash) {
      await this.transactionService.createIfNotExists({
        currency,
        blockchain: wallet.blockchain,
        user: wallet.user,
        wallet,
        transactionHash: txHash,
        value: amount,
        type: TransactionType.BALANCE_COLLECTOR,
        status: TransactionStatus.WAITING,
        description: 'Balance Collector Transfer',
      });
    }
  }

  private async checkNeedsNetworkFee(wallet: Wallet, blockchainName: string, rpcUrl: string): Promise<boolean> {
    if (blockchainName === 'TRON') {
      const tronWeb = new (TronWeb as any)({ fullHost: rpcUrl });
      const balance = await tronWeb.trx.getBalance(wallet.publicKey);
      return balance < 20_000_000; // Less than 20 TRX
    } else {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const balance = await provider.getBalance(wallet.publicKey);
      return balance < ethers.parseEther('0.002'); // Less than 0.002 ETH/BNB
    }
  }

  async payFeeAutomatic(blockchainName: string, recipientAddress: string) {
    const chainPrefix = blockchainName.toUpperCase();
    const publicKey = this.configService.get<string>(`${chainPrefix}_SMALL_WITHDRAWAL_PUBLIC_KEY`);
    const privateKeyRaw = this.configService.get<string>(`${chainPrefix}_SMALL_WITHDRAWAL_PRIVATE_KEY`);
    const privateKey = privateKeyRaw ? decryptWalletData(privateKeyRaw) : null;

    if (!publicKey || !privateKey) {
      this.logger.error(`Fee wallet not configured for ${blockchainName}`);
      return;
    }

    const provider = await this.providerService.getBestProviderForBlockchain(blockchainName);
    if (!provider) return;

    const amount = blockchainName === 'TRON' ? 30 : 0.005; // Fixed fee amount for simplicity, match Python logic if possible
    
    // Get native currency for the blockchain
    const nativeCurrency = await this.currencyRepo.findOne({
      where: { blockchain: { name: blockchainName }, type: CurrencyType.COIN }
    });
    if (!nativeCurrency) return;

    let txHash: string;
    if (blockchainName === 'TRON') {
      txHash = await this.sendTronTransaction(provider.url, privateKey, recipientAddress, amount, nativeCurrency);
    } else {
      txHash = await this.sendEvmTransaction(provider.url, privateKey, recipientAddress, amount, nativeCurrency);
    }

    return txHash;
  }

  private async sendEvmTransaction(rpcUrl: string, privateKey: string, to: string, amount: number, currency: Currency): Promise<string> {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    if (currency.type === CurrencyType.COIN) {
      const tx = await wallet.sendTransaction({
        to,
        value: ethers.parseEther(amount.toString()),
      });
      await tx.wait();
      return tx.hash;
    } else {
      const contract = new ethers.Contract(
        currency.tokenAddress!,
        ['function transfer(address to, uint256 amount) public returns (bool)', 'function decimals() public view returns (uint8)'],
        wallet
      );
      const decimals = await contract.decimals();
      const tx = await contract.transfer(to, ethers.parseUnits(amount.toString(), decimals));
      await tx.wait();
      return tx.hash;
    }
  }

  private async sendTronTransaction(rpcUrl: string, privateKey: string, to: string, amount: number, currency: Currency): Promise<string> {
    const tronWeb = new (TronWeb as any)({
      fullHost: rpcUrl,
      privateKey: privateKey,
    });

    if (currency.type === CurrencyType.COIN) {
      const trade = await tronWeb.trx.sendTransaction(to, Number(tronWeb.toSun(amount)));
      return trade.txid;
    } else {
      const contract = await tronWeb.contract().at(currency.tokenAddress!);
      const decimals = await contract.decimals().call();
      const trade = await contract.transfer(to, ethers.parseUnits(amount.toString(), decimals).toString()).send();
      return trade;
    }
  }
}
