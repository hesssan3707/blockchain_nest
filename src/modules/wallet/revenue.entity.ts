import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Blockchain } from '../blockchain/blockchain.entity';
import { Currency } from '../currency/currency.entity';
import { User } from '../user/user.entity';
import { Transaction } from './transaction.entity';

@Entity({ name: 'revenues' })
export class Revenue extends BaseEntity {
  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

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

  @Column({ name: 'transaction_id', type: 'int', nullable: true })
  transactionId!: number | null;

  @ManyToOne(() => Transaction, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'transaction_id' })
  transaction!: Transaction | null;

  @Column({ name: 'agreed_fee', type: 'float', default: 0 })
  agreedFee!: number;

  @Column({ name: 'network_fee', type: 'float', default: 0 })
  networkFee!: number;

  @Column({ name: 'network_fee_currency_id', type: 'int', nullable: true })
  networkFeeCurrencyId!: number | null;

  @ManyToOne(() => Currency, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'network_fee_currency_id' })
  networkFeeCurrency!: Currency | null;

  @Column({ name: 'revenue', type: 'float', default: 0 })
  revenue!: number;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
