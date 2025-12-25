import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Currency } from '../currency/currency.entity';
import { Blockchain } from '../blockchain/blockchain.entity';
import { Wallet } from './wallet.entity';
import { WalletBalance } from './wallet-balance.entity';
import { Transaction } from './transaction.entity';
import { SwapDto } from './dto/swap.dto';
import { ProviderService } from '../provider/provider.service';
import { PriceService } from '../price/price.service';
export declare class SwapService {
    private readonly userRepo;
    private readonly currencyRepo;
    private readonly blockchainRepo;
    private readonly walletRepo;
    private readonly balanceRepo;
    private readonly transactionRepo;
    private readonly providerService;
    private readonly priceService;
    constructor(userRepo: Repository<User>, currencyRepo: Repository<Currency>, blockchainRepo: Repository<Blockchain>, walletRepo: Repository<Wallet>, balanceRepo: Repository<WalletBalance>, transactionRepo: Repository<Transaction>, providerService: ProviderService, priceService: PriceService);
    swap(dto: SwapDto): Promise<number>;
}
