import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Currency } from '../currency/currency.entity';
import { Blockchain } from '../blockchain/blockchain.entity';
import { Wallet } from './wallet.entity';
import { WalletBalance } from './wallet-balance.entity';
import { Transaction, TransactionStatus, TransactionType } from './transaction.entity';
import { SwapDto } from './dto/swap.dto';
import { ProviderService } from '../provider/provider.service';
import { PriceService } from '../price/price.service';

@Injectable()
export class SwapService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Currency)
    private readonly currencyRepo: Repository<Currency>,
    @InjectRepository(Blockchain)
    private readonly blockchainRepo: Repository<Blockchain>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(WalletBalance)
    private readonly balanceRepo: Repository<WalletBalance>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    private readonly providerService: ProviderService,
    private readonly priceService: PriceService,
  ) {}

  async swap(dto: SwapDto) {
    const user = await this.userRepo.findOne({ where: { identifier: dto.user_identifier } });
    if (!user) throw new BadRequestException('User not found');

    const blockchain = await this.blockchainRepo.findOne({ where: { name: dto.blockchain_name.toUpperCase() } });
    if (!blockchain) throw new BadRequestException('Blockchain not found');

    const currencySource = await this.currencyRepo.findOne({
      where: { symbol: dto.currency_source.toUpperCase(), blockchain: { id: blockchain.id } },
    });
    if (!currencySource) throw new BadRequestException('Source currency not found');

    const currencyDest = await this.currencyRepo.findOne({
      where: { symbol: dto.currency_dest.toUpperCase(), blockchain: { id: blockchain.id } },
    });
    if (!currencyDest) throw new BadRequestException('Destination currency not found');

    const wallet = await this.walletRepo.findOne({
      where: { user: { id: user.id }, blockchain: { id: blockchain.id }, isActive: true },
    });
    if (!wallet) throw new BadRequestException('User wallet not found');

    const balance = await this.balanceRepo.findOne({
      where: { wallet: { id: wallet.id }, currency: { id: currencySource.id } },
    });

    if (!balance || balance.userBalance < dto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const rate = await this.priceService.priceConverter(dto.currency_source, dto.currency_dest);
    if (rate <= 0) throw new BadRequestException('Could not get exchange rate');

    const destAmount = dto.amount * rate;

    return await this.transactionRepo.manager.transaction(async (manager) => {
      // 1. Create SWAP_WITHDRAWAL for source
      const txWithdrawal = manager.create(Transaction, {
        user,
        blockchain,
        currency: currencySource,
        wallet,
        value: dto.amount,
        type: TransactionType.SWAP_WITHDRAWAL,
        status: TransactionStatus.SUCCESS,
        description: `Swap ${dto.amount} ${dto.currency_source} to ${dto.currency_dest}`,
        isActive: true,
      });
      await manager.save(txWithdrawal);

      // 2. Create SWAP_DEPOSIT for destination
      const txDeposit = manager.create(Transaction, {
        user,
        blockchain,
        currency: currencyDest,
        wallet,
        value: destAmount,
        type: TransactionType.SWAP_DEPOSIT,
        status: TransactionStatus.SUCCESS,
        description: `Swap ${dto.amount} ${dto.currency_source} to ${dto.currency_dest}`,
        isActive: true,
      });
      await manager.save(txDeposit);

      // 3. Update WalletBalance for source
      balance.userBalance -= dto.amount;
      await manager.save(balance);

      // 4. Update WalletBalance for destination
      let destBalance = await manager.findOne(WalletBalance, {
        where: { wallet: { id: wallet.id }, currency: { id: currencyDest.id } },
      });

      if (!destBalance) {
        destBalance = manager.create(WalletBalance, {
          wallet,
          currency: currencyDest,
          userBalance: destAmount,
          networkBalance: 0,
        });
      } else {
        destBalance.userBalance += destAmount;
      }
      await manager.save(destBalance);

      return txWithdrawal.id;
    });
  }
}
