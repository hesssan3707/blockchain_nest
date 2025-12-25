import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Currency } from '../currency/currency.entity';
import { Wallet } from './wallet.entity';

@Entity({ name: 'wallet_balances' })
export class WalletBalance extends BaseEntity {
  @Column({ name: 'wallet_id', type: 'int' })
  walletId!: number;

  @Index()
  @ManyToOne(() => Wallet, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'wallet_id' })
  wallet!: Wallet;

  @Column({ name: 'currency_id', type: 'int' })
  currencyId!: number;

  @Index()
  @ManyToOne(() => Currency, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'currency_id' })
  currency!: Currency;

  @Column({ name: 'user_balance', type: 'float', default: 0 })
  userBalance!: number;

  @Column({ name: 'network_balance', type: 'float', default: 0 })
  networkBalance!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
