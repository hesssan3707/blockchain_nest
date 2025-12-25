import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Blockchain } from '../blockchain/blockchain.entity';
import { User } from '../user/user.entity';
import { WalletBalance } from './wallet-balance.entity';

@Entity({ name: 'wallets' })
@Unique('UQ_wallet_user_blockchain', ['user', 'blockchain'])
export class Wallet extends BaseEntity {
  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @Index()
  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'blockchain_id', type: 'int' })
  blockchainId!: number;

  @Index()
  @ManyToOne(() => Blockchain, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'blockchain_id' })
  blockchain!: Blockchain;

  @OneToMany(() => WalletBalance, (balance) => balance.wallet)
  balances!: WalletBalance[];

  @Index()
  @Column({ name: 'public_key', type: 'varchar', length: 255 })
  publicKey!: string;

  @Index()
  @Column({ name: 'private_key', type: 'varchar', length: 255, nullable: true })
  privateKey!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mnemonic!: string | null;

  @Column({ type: 'int', nullable: true })
  memo!: number | null;

  @Column({ name: 'admin_wallet', type: 'boolean', default: false })
  adminWallet!: boolean;

  @Column({ name: 'exchange_wallet', type: 'boolean', default: false })
  exchangeWallet!: boolean;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
