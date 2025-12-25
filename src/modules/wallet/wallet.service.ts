import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { encryptWalletData } from '../../common/security/wallet-encryption';
import { Blockchain } from '../blockchain/blockchain.entity';
import { User } from '../user/user.entity';
import { Wallet } from './wallet.entity';
import { WalletBalance } from './wallet-balance.entity';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { WalletGeneratorService } from './wallet-generator.service';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(WalletBalance)
    private readonly balanceRepo: Repository<WalletBalance>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Blockchain)
    private readonly blockchainRepo: Repository<Blockchain>,
    private readonly walletGenerator: WalletGeneratorService,
  ) {}

  async getOrCreateWallet(dto: CreateWalletDto): Promise<Wallet> {
    const userIdentifier = dto.userIdentifier.trim();
    const blockchainName = dto.blockchainName.trim().toUpperCase();

    const user = await this.userRepo.findOne({
      where: { identifier: userIdentifier },
    });

    const blockchain = await this.blockchainRepo.findOne({
      where: { name: blockchainName },
    });

    if (!user || !blockchain) {
      throw new NotFoundException({
        data: null,
        status: 404,
        message: 'User or Blockchain Not Found',
      });
    }

    const existing = await this.walletRepo.findOne({
      where: {
        user: { id: user.id },
        blockchain: { id: blockchain.id },
        isActive: true,
      },
      relations: { user: true, blockchain: true },
    });
    if (existing) return existing;

    if (!dto.publicKey) {
      const generated = await this.walletGenerator.generate(blockchainName);

      const wallet = this.walletRepo.create({
        user,
        blockchain,
        publicKey: generated.address,
        privateKey: generated.privateKey ? encryptWalletData(generated.privateKey) : null,
        mnemonic: generated.mnemonic ? encryptWalletData(generated.mnemonic) : null,
        memo: generated.memo ?? null,
        adminWallet: false,
        exchangeWallet: false,
        isActive: true,
      });

      return this.walletRepo.save(wallet);
    }

    const wallet = this.walletRepo.create({
      user,
      blockchain,
      publicKey: dto.publicKey,
      privateKey: dto.privateKey
        ? encryptWalletData(dto.privateKey)
        : null,
      mnemonic: dto.mnemonic ? encryptWalletData(dto.mnemonic) : null,
      memo: dto.memo ?? null,
      adminWallet: false,
      exchangeWallet: false,
      description: null,
      isActive: true,
    });
    return this.walletRepo.save(wallet);
  }

  async getWalletAddress(userIdentifier: string, blockchainName: string): Promise<Wallet> {
    const wallet = await this.getOrCreateWallet({
      userIdentifier,
      blockchainName,
    });
    return wallet;
  }

  async getBalances(userIdentifier: string, blockchainName?: string) {
    if (userIdentifier === undefined || userIdentifier === null) {
      throw new BadRequestException({
        data: null,
        message: 'user_identifier query param is required',
        status: 400,
      });
    }

    const user = await this.userRepo.findOne({ where: { identifier: userIdentifier } });
    if (!user) {
      throw new NotFoundException({
        data: null,
        message: 'User not found',
        status: 404
      });
    }

    if (blockchainName) {
      const wallet = await this.walletRepo.findOne({
        where: { user: { id: user.id }, blockchain: { name: blockchainName.toUpperCase() }, isActive: true },
        relations: { blockchain: true },
      });

      if (!wallet) {
        throw new NotFoundException({
          data: null,
          message: 'Wallet not found',
          status: 404
        });
      }

      const wallet_balances = await this.balanceRepo.find({
        where: { wallet: { id: wallet.id } },
        relations: { currency: true },
      });

      const user_assets = {
        blockchain_name: wallet.blockchain.name,
        wallet_address: wallet.publicKey,
        assets: wallet_balances.map(wb => ({
          currency_symbol: wb.currency.symbol,
          value: wb.userBalance,
        })),
      };

      return { data: user_assets, message: '', status: 200 };
    } else {
      const user_assets: any[] = [];
      const wallets = await this.walletRepo.find({
        where: { user: { id: user.id }, isActive: true },
        relations: { blockchain: true },
      });

      for (const wallet of wallets) {
        const wallet_balances = await this.balanceRepo.find({
          where: { wallet: { id: wallet.id } },
          relations: { currency: true },
        });

        user_assets.push({
          blockchain_name: wallet.blockchain.name,
          wallet_address: wallet.publicKey,
          assets: wallet_balances.map(wb => ({
            currency_symbol: wb.currency.symbol,
            value: wb.userBalance,
          })),
        });
      }

      return { data: user_assets, message: '', status: 200 };
    }
  }
}
