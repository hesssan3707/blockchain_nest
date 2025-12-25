import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Blockchain } from '../blockchain/blockchain.entity';
import { Currency } from '../currency/currency.entity';
import { User } from '../user/user.entity';
import { Wallet } from './wallet.entity';

export enum TransactionType {
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit',
  NETWORK_FEE = 'network_fee',
  BALANCE_COLLECTOR = 'balance_collector',
  SWAP_WITHDRAWAL = 'swap_withdrawal',
  SWAP_DEPOSIT = 'swap_deposit',
}

export enum TransactionStatus {
  WAITING = 'waiting',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity({ name: 'transactions' })
export class Transaction extends BaseEntity {
  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'wallet_id', type: 'int', nullable: true })
  walletId!: number | null;

  @ManyToOne(() => Wallet, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'wallet_id' })
  wallet!: Wallet | null;

  @Column({ name: 'blockchain_id', type: 'int' })
  blockchainId!: number;

  @ManyToOne(() => Blockchain, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'blockchain_id' })
  blockchain!: Blockchain;

  @Column({ name: 'currency_id', type: 'int' })
  currencyId!: number;

  @ManyToOne(() => Currency, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'currency_id' })
  currency!: Currency;

  @Index()
  @Column({ type: 'char', length: 36, nullable: true })
  uuid!: string | null;

  @Index()
  @Column({ name: 'transaction_id', type: 'bigint', nullable: true })
  transactionId!: string | null;

  @Index()
  @Column({
    name: 'transaction_hash',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  transactionHash!: string | null;

  @Column({ type: 'float' })
  value!: number;

  @Column({ type: 'varchar', length: 20 })
  type!: TransactionType;

  @Column({ type: 'varchar', length: 20 })
  status!: TransactionStatus;

  @Column({ name: 'agreed_fee', type: 'float', default: 0 })
  agreedFee!: number;

  @Column({ name: 'network_fee', type: 'float', default: 0 })
  networkFee!: number;

  @Column({ name: 'network_fee_currency_id', type: 'int', nullable: true })
  networkFeeCurrencyId!: number | null;

  @ManyToOne(() => Currency, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'network_fee_currency_id' })
  networkFeeCurrency!: Currency | null;

  @Column({ name: 'confirmations', type: 'int', default: 0 })
  confirmations!: number;

  @Column({ name: 'is_confirmed', type: 'boolean', default: false })
  isConfirmed!: boolean;

  @Column({
    name: 'external_wallet',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  externalWallet!: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  memo!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  checksum!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
