"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WalletTaskService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletTaskService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const blockchain_entity_1 = require("../blockchain/blockchain.entity");
const currency_entity_1 = require("../currency/currency.entity");
const setting_service_1 = require("../setting/setting.service");
const price_service_1 = require("../price/price.service");
const transaction_entity_1 = require("./transaction.entity");
const wallet_entity_1 = require("./wallet.entity");
const config_1 = require("@nestjs/config");
const wallet_encryption_1 = require("../../common/security/wallet-encryption");
const provider_service_1 = require("../provider/provider.service");
const transaction_service_1 = require("./transaction.service");
const ethers_1 = require("ethers");
const tronweb_1 = require("tronweb");
const axios_1 = require("axios");
const wallet_balance_entity_1 = require("./wallet-balance.entity");
let WalletTaskService = WalletTaskService_1 = class WalletTaskService {
    constructor(transactionRepo, walletRepo, currencyRepo, blockchainRepo, balanceRepo, settingService, priceService, configService, providerService, transactionService) {
        this.transactionRepo = transactionRepo;
        this.walletRepo = walletRepo;
        this.currencyRepo = currencyRepo;
        this.blockchainRepo = blockchainRepo;
        this.balanceRepo = balanceRepo;
        this.settingService = settingService;
        this.priceService = priceService;
        this.configService = configService;
        this.providerService = providerService;
        this.transactionService = transactionService;
        this.logger = new common_1.Logger(WalletTaskService_1.name);
    }
    async getWithdrawalWallet(blockchainName, amount, currencySymbol) {
        const confirmationRequiredAmount = await this.settingService.get('confirmation_required_amount');
        const requiredAmount = confirmationRequiredAmount ? parseFloat(confirmationRequiredAmount) : 200;
        let usdtEquivalent = amount;
        let isLarge = true;
        if (currencySymbol.toUpperCase() !== 'USDT') {
            try {
                const priceInUsdt = await this.priceService.priceConverter(currencySymbol, 'USDT');
                usdtEquivalent = amount * priceInUsdt;
                isLarge = usdtEquivalent >= requiredAmount;
            }
            catch (error) {
                this.logger.warn(`Error converting price from ${currencySymbol} to USDT: ${error.message}. Defaulting to normal withdrawal wallet.`);
                isLarge = true;
            }
        }
        else {
            isLarge = amount >= requiredAmount;
        }
        const prefix = isLarge ? '' : 'SMALL_';
        const chainPrefix = blockchainName.toUpperCase();
        const publicKey = this.configService.get(`${chainPrefix}_${prefix}WITHDRAWAL_PUBLIC_KEY`);
        const privateKey = this.configService.get(`${chainPrefix}_${prefix}WITHDRAWAL_PRIVATE_KEY`);
        return {
            publicKey,
            privateKey: privateKey ? (0, wallet_encryption_1.decryptWalletData)(privateKey) : privateKey
        };
    }
    async balanceCollectorTask() {
        this.logger.log('Starting balance collector task...');
        const currencies = await this.currencyRepo.find({ relations: { blockchain: true } });
        for (const currency of currencies) {
            if (!currency.isActive || !currency.minBalanceCollectorAmount)
                continue;
            const balancesToCollect = await this.balanceRepo.find({
                where: {
                    currencyId: currency.id,
                    networkBalance: (0, typeorm_2.MoreThanOrEqual)(currency.minBalanceCollectorAmount),
                },
                relations: { wallet: { blockchain: true, user: true } },
            });
            for (const balance of balancesToCollect) {
                const wallet = balance.wallet;
                if (!wallet || !wallet.isActive || !wallet.privateKey)
                    continue;
                this.logger.log(`Collecting ${balance.networkBalance} ${currency.symbol} from ${wallet.publicKey} on ${currency.blockchain.name}`);
                try {
                    await this.transferToSafeWallet(wallet, currency, balance.networkBalance);
                }
                catch (error) {
                    this.logger.error(`Failed to collect balance from ${wallet.publicKey}: ${error.message}`);
                }
            }
        }
    }
    async processWithdrawals() {
        this.logger.log('Checking for waiting withdrawals to broadcast...');
        const pendingWithdrawals = await this.transactionRepo.find({
            where: {
                type: transaction_entity_1.TransactionType.WITHDRAWAL,
                status: transaction_entity_1.TransactionStatus.WAITING,
                transactionHash: (0, typeorm_2.IsNull)(),
            },
            relations: { blockchain: true, currency: true, user: true },
        });
        for (const tx of pendingWithdrawals) {
            try {
                const { publicKey, privateKey } = await this.getWithdrawalWallet(tx.blockchain.name, tx.value, tx.currency.symbol);
                if (!publicKey || !privateKey) {
                    const errorMsg = `Withdrawal wallet not configured for ${tx.blockchain.name}`;
                    this.logger.error(errorMsg);
                    tx.status = transaction_entity_1.TransactionStatus.FAILED;
                    tx.description = `The withdrawal could not be processed because the system wallet for ${tx.blockchain.name} is not configured. Please contact support.`;
                    await this.transactionRepo.save(tx);
                    continue;
                }
                const provider = await this.providerService.getBestProviderForBlockchain(tx.blockchain.name);
                if (!provider) {
                    const errorMsg = `No provider available for ${tx.blockchain.name}`;
                    this.logger.error(errorMsg);
                    tx.status = transaction_entity_1.TransactionStatus.FAILED;
                    tx.description = `We are currently unable to connect to the ${tx.blockchain.name} network. Your transaction will be retried automatically once the connection is restored.`;
                    await this.transactionRepo.save(tx);
                    continue;
                }
                let txHash;
                if (tx.blockchain.name.toUpperCase() === 'TRON') {
                    txHash = await this.sendTronTransaction(provider.url, privateKey, tx.externalWallet, tx.value, tx.currency);
                }
                else {
                    txHash = await this.sendEvmTransaction(provider.url, privateKey, tx.externalWallet, tx.value, tx.currency);
                }
                if (txHash) {
                    tx.transactionHash = txHash;
                    await this.transactionRepo.save(tx);
                    this.logger.log(`Withdrawal ${tx.id} broadcasted. Hash: ${txHash}`);
                }
            }
            catch (error) {
                this.logger.error(`Failed to broadcast withdrawal ${tx.id}: ${error.message}`);
                tx.status = transaction_entity_1.TransactionStatus.FAILED;
                tx.description = `The transaction could not be sent to the blockchain network. Error: ${error.message}. This may be due to network congestion or an internal error. Please contact support.`;
                await this.transactionRepo.save(tx);
            }
        }
    }
    async checkTransactionStatus() {
        this.logger.log('Checking status of waiting transactions on-chain...');
        const waitingTransactions = await this.transactionRepo.find({
            where: {
                status: transaction_entity_1.TransactionStatus.WAITING,
                transactionHash: (0, typeorm_2.Not)((0, typeorm_2.IsNull)()),
            },
            relations: { blockchain: true, currency: true },
        });
        for (const tx of waitingTransactions) {
            try {
                const provider = await this.providerService.getBestProviderForBlockchain(tx.blockchain.name);
                if (!provider)
                    continue;
                let statusInfo = { status: null, fee: 0 };
                const blockchainName = tx.blockchain.name.toUpperCase();
                if (blockchainName === 'TRON') {
                    statusInfo = await this.getTronTransactionStatusInfo(provider.url, tx.transactionHash, tx.blockchain);
                }
                else if (blockchainName === 'BTC' || blockchainName === 'LTC') {
                    statusInfo = await this.getBtcLtcTransactionStatusInfo(provider.url, tx.transactionHash, tx.blockchain);
                }
                else if (blockchainName === 'XRP') {
                    statusInfo = await this.getXrpTransactionStatusInfo(provider.url, tx.transactionHash, tx.blockchain);
                }
                else {
                    statusInfo = await this.getEvmTransactionStatusInfo(provider.url, tx.transactionHash, tx.blockchain);
                }
                if (statusInfo.status === true) {
                    await this.transactionService.processConfirmedTransaction(tx, statusInfo.fee, statusInfo.feeCurrency);
                    this.logger.log(`Transaction ${tx.transactionHash} success with fee ${statusInfo.fee}`);
                }
                else if (statusInfo.status === false) {
                    tx.status = transaction_entity_1.TransactionStatus.FAILED;
                    tx.description = 'The transaction was sent but failed on the blockchain. This usually happens if there are insufficient funds for fees or if the network reverted the operation.';
                    await this.transactionRepo.save(tx);
                    this.logger.log(`Transaction ${tx.transactionHash} failed`);
                }
            }
            catch (error) {
                this.logger.error(`Error checking status for ${tx.transactionHash}: ${error.message}`);
            }
        }
    }
    async getEvmTransactionStatusInfo(rpcUrl, hash, blockchain) {
        try {
            const provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
            const receipt = await provider.getTransactionReceipt(hash);
            if (!receipt)
                return { status: null, fee: 0 };
            const gasUsed = BigInt(receipt.gasUsed);
            const gasPrice = receipt.gasPrice ? BigInt(receipt.gasPrice) : BigInt(0);
            const fee = Number(ethers_1.ethers.formatEther(gasUsed * gasPrice));
            const nativeCurrency = await this.currencyRepo.findOne({
                where: { blockchainId: blockchain.id, type: currency_entity_1.CurrencyType.COIN }
            });
            return { status: receipt.status === 1, fee, feeCurrency: nativeCurrency || undefined };
        }
        catch (error) {
            return { status: null, fee: 0 };
        }
    }
    async getTronTransactionStatusInfo(rpcUrl, hash, blockchain) {
        try {
            const tronWeb = new tronweb_1.TronWeb({ fullHost: rpcUrl });
            const tx = await tronWeb.trx.getTransaction(hash);
            if (!tx || !tx.ret)
                return { status: null, fee: 0 };
            const fee = (tx.ret[0].fee || 0) / 1000000;
            const nativeCurrency = await this.currencyRepo.findOne({
                where: { blockchainId: blockchain.id, type: currency_entity_1.CurrencyType.COIN }
            });
            return { status: tx.ret[0].contractRet === 'SUCCESS', fee, feeCurrency: nativeCurrency || undefined };
        }
        catch (error) {
            return { status: null, fee: 0 };
        }
    }
    async getBtcLtcTransactionStatusInfo(rpcUrl, hash, blockchain) {
        try {
            const payload = {
                jsonrpc: '1.0',
                id: Math.floor(Math.random() * 100000),
                method: 'getrawtransaction',
                params: [hash, 1],
            };
            const response = await axios_1.default.post(rpcUrl, payload, { timeout: 10000 });
            const data = response.data;
            if (data.error)
                return { status: null, fee: 0 };
            const tx = data.result;
            if (!tx)
                return { status: null, fee: 0 };
            let fee = 0;
            if (tx.fee) {
                fee = tx.fee;
            }
            const nativeCurrency = await this.currencyRepo.findOne({
                where: { blockchainId: blockchain.id, type: currency_entity_1.CurrencyType.COIN }
            });
            return { status: (tx.confirmations || 0) > 0, fee, feeCurrency: nativeCurrency || undefined };
        }
        catch (error) {
            return { status: null, fee: 0 };
        }
    }
    async getXrpTransactionStatusInfo(rpcUrl, hash, blockchain) {
        try {
            const payload = {
                method: 'tx',
                params: [{ transaction: hash }],
            };
            const response = await axios_1.default.post(rpcUrl, payload, { timeout: 10000 });
            const data = response.data;
            if (data.result?.error)
                return { status: null, fee: 0 };
            const fee = (data.result?.Fee || 0) / 1000000;
            const nativeCurrency = await this.currencyRepo.findOne({
                where: { blockchainId: blockchain.id, type: currency_entity_1.CurrencyType.COIN }
            });
            return { status: data.result?.validated === true, fee, feeCurrency: nativeCurrency || undefined };
        }
        catch (error) {
            return { status: null, fee: 0 };
        }
    }
    async transferToSafeWallet(wallet, currency, amount) {
        const blockchainName = wallet.blockchain.name.toUpperCase();
        const safeWalletPublicKey = this.configService.get(`${blockchainName}_SAFE_WALLET_PUBLIC_KEY`);
        if (!safeWalletPublicKey) {
            this.logger.error(`Safe wallet not configured for ${blockchainName}`);
            return;
        }
        const provider = await this.providerService.getBestProviderForBlockchain(blockchainName);
        if (!provider) {
            this.logger.error(`No provider available for ${blockchainName}`);
            return;
        }
        if (currency.type === currency_entity_1.CurrencyType.TOKEN) {
            const needsFee = await this.checkNeedsNetworkFee(wallet, blockchainName, provider.url);
            if (needsFee) {
                this.logger.log(`Wallet ${wallet.publicKey} needs network fee for ${blockchainName}`);
                await this.payFeeAutomatic(blockchainName, wallet.publicKey);
                await new Promise(resolve => setTimeout(resolve, 30000));
            }
        }
        let txHash;
        const decryptedPrivateKey = wallet.privateKey ? (0, wallet_encryption_1.decryptWalletData)(wallet.privateKey) : null;
        if (!decryptedPrivateKey) {
            this.logger.error(`Private key not found for wallet ${wallet.publicKey}`);
            return;
        }
        if (blockchainName === 'TRON') {
            txHash = await this.sendTronTransaction(provider.url, decryptedPrivateKey, safeWalletPublicKey, amount, currency);
        }
        else {
            txHash = await this.sendEvmTransaction(provider.url, decryptedPrivateKey, safeWalletPublicKey, amount, currency);
        }
        if (txHash) {
            await this.transactionService.createIfNotExists({
                currency,
                blockchain: wallet.blockchain,
                user: wallet.user,
                wallet,
                transactionHash: txHash,
                value: amount,
                type: transaction_entity_1.TransactionType.BALANCE_COLLECTOR,
                status: transaction_entity_1.TransactionStatus.WAITING,
                description: 'Balance Collector Transfer',
            });
        }
    }
    async checkNeedsNetworkFee(wallet, blockchainName, rpcUrl) {
        if (blockchainName === 'TRON') {
            const tronWeb = new tronweb_1.TronWeb({ fullHost: rpcUrl });
            const balance = await tronWeb.trx.getBalance(wallet.publicKey);
            return balance < 20_000_000;
        }
        else {
            const provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
            const balance = await provider.getBalance(wallet.publicKey);
            return balance < ethers_1.ethers.parseEther('0.002');
        }
    }
    async payFeeAutomatic(blockchainName, recipientAddress) {
        const chainPrefix = blockchainName.toUpperCase();
        const publicKey = this.configService.get(`${chainPrefix}_SMALL_WITHDRAWAL_PUBLIC_KEY`);
        const privateKeyRaw = this.configService.get(`${chainPrefix}_SMALL_WITHDRAWAL_PRIVATE_KEY`);
        const privateKey = privateKeyRaw ? (0, wallet_encryption_1.decryptWalletData)(privateKeyRaw) : null;
        if (!publicKey || !privateKey) {
            this.logger.error(`Fee wallet not configured for ${blockchainName}`);
            return;
        }
        const provider = await this.providerService.getBestProviderForBlockchain(blockchainName);
        if (!provider)
            return;
        const amount = blockchainName === 'TRON' ? 30 : 0.005;
        const nativeCurrency = await this.currencyRepo.findOne({
            where: { blockchain: { name: blockchainName }, type: currency_entity_1.CurrencyType.COIN }
        });
        if (!nativeCurrency)
            return;
        let txHash;
        if (blockchainName === 'TRON') {
            txHash = await this.sendTronTransaction(provider.url, privateKey, recipientAddress, amount, nativeCurrency);
        }
        else {
            txHash = await this.sendEvmTransaction(provider.url, privateKey, recipientAddress, amount, nativeCurrency);
        }
        return txHash;
    }
    async sendEvmTransaction(rpcUrl, privateKey, to, amount, currency) {
        const provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
        if (currency.type === currency_entity_1.CurrencyType.COIN) {
            const tx = await wallet.sendTransaction({
                to,
                value: ethers_1.ethers.parseEther(amount.toString()),
            });
            await tx.wait();
            return tx.hash;
        }
        else {
            const contract = new ethers_1.ethers.Contract(currency.tokenAddress, ['function transfer(address to, uint256 amount) public returns (bool)', 'function decimals() public view returns (uint8)'], wallet);
            const decimals = await contract.decimals();
            const tx = await contract.transfer(to, ethers_1.ethers.parseUnits(amount.toString(), decimals));
            await tx.wait();
            return tx.hash;
        }
    }
    async sendTronTransaction(rpcUrl, privateKey, to, amount, currency) {
        const tronWeb = new tronweb_1.TronWeb({
            fullHost: rpcUrl,
            privateKey: privateKey,
        });
        if (currency.type === currency_entity_1.CurrencyType.COIN) {
            const trade = await tronWeb.trx.sendTransaction(to, Number(tronWeb.toSun(amount)));
            return trade.txid;
        }
        else {
            const contract = await tronWeb.contract().at(currency.tokenAddress);
            const decimals = await contract.decimals().call();
            const trade = await contract.transfer(to, ethers_1.ethers.parseUnits(amount.toString(), decimals).toString()).send();
            return trade;
        }
    }
};
exports.WalletTaskService = WalletTaskService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WalletTaskService.prototype, "balanceCollectorTask", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WalletTaskService.prototype, "processWithdrawals", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WalletTaskService.prototype, "checkTransactionStatus", null);
exports.WalletTaskService = WalletTaskService = WalletTaskService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __param(1, (0, typeorm_1.InjectRepository)(wallet_entity_1.Wallet)),
    __param(2, (0, typeorm_1.InjectRepository)(currency_entity_1.Currency)),
    __param(3, (0, typeorm_1.InjectRepository)(blockchain_entity_1.Blockchain)),
    __param(4, (0, typeorm_1.InjectRepository)(wallet_balance_entity_1.WalletBalance)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        setting_service_1.SettingService,
        price_service_1.PriceService,
        config_1.ConfigService,
        provider_service_1.ProviderService,
        transaction_service_1.TransactionService])
], WalletTaskService);
//# sourceMappingURL=wallet-task.service.js.map