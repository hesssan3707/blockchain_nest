import { Repository } from 'typeorm';
import { Blockchain } from '../blockchain/blockchain.entity';
import { User } from '../user/user.entity';
import { Wallet } from './wallet.entity';
import { WalletBalance } from './wallet-balance.entity';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { WalletGeneratorService } from './wallet-generator.service';
export declare class WalletService {
    private readonly walletRepo;
    private readonly balanceRepo;
    private readonly userRepo;
    private readonly blockchainRepo;
    private readonly walletGenerator;
    constructor(walletRepo: Repository<Wallet>, balanceRepo: Repository<WalletBalance>, userRepo: Repository<User>, blockchainRepo: Repository<Blockchain>, walletGenerator: WalletGeneratorService);
    getOrCreateWallet(dto: CreateWalletDto): Promise<Wallet>;
    getWalletAddress(userIdentifier: string, blockchainName: string): Promise<Wallet>;
    getBalances(userIdentifier: string, blockchainName?: string): Promise<{
        data: {
            blockchain_name: string;
            wallet_address: string;
            assets: {
                currency_symbol: string;
                value: number;
            }[];
        };
        message: string;
        status: number;
    } | {
        data: any[];
        message: string;
        status: number;
    }>;
}
