import { Injectable, BadRequestException } from '@nestjs/common';
import * as bip39 from 'bip39';
import { BIP32Factory, BIP32Interface } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import { ethers } from 'ethers';
import { TronWeb } from 'tronweb';
const coininfo = require('coininfo');

const bip32 = BIP32Factory(ecc);

export interface GeneratedWallet {
  address: string;
  privateKey: string;
  mnemonic?: string;
  memo?: number;
}

@Injectable()
export class WalletGeneratorService {
  async generate(blockchainName: string): Promise<GeneratedWallet> {
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
        throw new BadRequestException(`Wallet generation not supported for ${blockchainName}`);
    }
  }

  private generateEvmWallet(): GeneratedWallet {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase,
    };
  }

  private generateBtcWallet(): GeneratedWallet {
    const mnemonic = bip39.generateMnemonic();
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const root = bip32.fromSeed(seed);
    const path = "m/44'/0'/0'/0/0";
    const child = root.derivePath(path);

    const { address } = bitcoin.payments.p2pkh({
      pubkey: child.publicKey,
      network: bitcoin.networks.bitcoin,
    });

    if (!address) throw new Error('Failed to generate BTC address');

    return {
      address,
      privateKey: child.toWIF(),
      mnemonic,
    };
  }

  private generateLtcWallet(): GeneratedWallet {
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

    if (!address) throw new Error('Failed to generate LTC address');

    return {
      address,
      privateKey: child.toWIF(),
      mnemonic,
    };
  }

  private async generateTronWallet(): Promise<GeneratedWallet> {
    const mnemonic = bip39.generateMnemonic();
    const tronWeb = new (TronWeb as any)({
      fullHost: 'https://api.trongrid.io',
    });
    const account = tronWeb.fromMnemonic(mnemonic);
    return {
      address: account.address,
      privateKey: account.privateKey,
      mnemonic,
    };
  }

  private generateXrpWallet(): GeneratedWallet {
    // XRP uses a shared main wallet with unique destination tags (memos)
    // The actual address is the XRP_MAIN_WALLET_PUBLIC_KEY
    const mainWallet = process.env.XRP_MAIN_WALLET_PUBLIC_KEY;
    if (!mainWallet) {
      throw new BadRequestException('XRP_MAIN_WALLET_PUBLIC_KEY is not set');
    }

    return {
      address: mainWallet,
      privateKey: '', // No private key for the user's sub-wallet (it's shared)
      memo: Math.floor(Math.random() * 2147483647) + 1, // Positive 32-bit int
    };
  }
}
