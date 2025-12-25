"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletGeneratorService = void 0;
const common_1 = require("@nestjs/common");
const bip39 = require("bip39");
const bip32_1 = require("bip32");
const ecc = require("tiny-secp256k1");
const bitcoin = require("bitcoinjs-lib");
const ethers_1 = require("ethers");
const tronweb_1 = require("tronweb");
const coininfo = require('coininfo');
const bip32 = (0, bip32_1.BIP32Factory)(ecc);
let WalletGeneratorService = class WalletGeneratorService {
    async generate(blockchainName) {
        const name = blockchainName.toUpperCase();
        switch (name) {
            case 'ETH':
            case 'BSC':
                return this.generateEvmWallet();
            case 'BTC':
                return this.generateBtcWallet();
            case 'LTC':
                return this.generateLtcWallet();
            case 'TRON':
                return this.generateTronWallet();
            case 'XRP':
                return this.generateXrpWallet();
            default:
                throw new common_1.BadRequestException(`Wallet generation not supported for ${blockchainName}`);
        }
    }
    generateEvmWallet() {
        const wallet = ethers_1.ethers.Wallet.createRandom();
        return {
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: wallet.mnemonic?.phrase,
        };
    }
    generateBtcWallet() {
        const mnemonic = bip39.generateMnemonic();
        const seed = bip39.mnemonicToSeedSync(mnemonic);
        const root = bip32.fromSeed(seed);
        const path = "m/44'/0'/0'/0/0";
        const child = root.derivePath(path);
        const { address } = bitcoin.payments.p2pkh({
            pubkey: child.publicKey,
            network: bitcoin.networks.bitcoin,
        });
        if (!address)
            throw new Error('Failed to generate BTC address');
        return {
            address,
            privateKey: child.toWIF(),
            mnemonic,
        };
    }
    generateLtcWallet() {
        const mnemonic = bip39.generateMnemonic();
        const seed = bip39.mnemonicToSeedSync(mnemonic);
        const ltcNetwork = coininfo.litecoin.main.toBitcoinJS();
        const root = bip32.fromSeed(seed, ltcNetwork);
        const path = "m/44'/2'/0'/0/0";
        const child = root.derivePath(path);
        const { address } = bitcoin.payments.p2pkh({
            pubkey: child.publicKey,
            network: ltcNetwork,
        });
        if (!address)
            throw new Error('Failed to generate LTC address');
        return {
            address,
            privateKey: child.toWIF(),
            mnemonic,
        };
    }
    async generateTronWallet() {
        const mnemonic = bip39.generateMnemonic();
        const tronWeb = new tronweb_1.TronWeb({
            fullHost: 'https://api.trongrid.io',
        });
        const account = tronWeb.fromMnemonic(mnemonic);
        return {
            address: account.address,
            privateKey: account.privateKey,
            mnemonic,
        };
    }
    generateXrpWallet() {
        const mainWallet = process.env.XRP_MAIN_WALLET_PUBLIC_KEY;
        if (!mainWallet) {
            throw new common_1.BadRequestException('XRP_MAIN_WALLET_PUBLIC_KEY is not set');
        }
        return {
            address: mainWallet,
            privateKey: '',
            memo: Math.floor(Math.random() * 2147483647) + 1,
        };
    }
};
exports.WalletGeneratorService = WalletGeneratorService;
exports.WalletGeneratorService = WalletGeneratorService = __decorate([
    (0, common_1.Injectable)()
], WalletGeneratorService);
//# sourceMappingURL=wallet-generator.service.js.map