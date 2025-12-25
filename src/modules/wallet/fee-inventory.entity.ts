import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, Unique, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Wallet } from './wallet.entity';

@Entity({ name: 'fee_inventories' })
@Unique('UQ_feeinventory_wallet', ['wallet'])
export class FeeInventory extends BaseEntity {
  @Column({ name: 'wallet_id', type: 'int' })
  walletId!: number;

  @OneToOne(() => Wallet, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'wallet_id' })
  wallet!: Wallet;

  @Column({ type: 'float', default: 0 })
  amount!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
