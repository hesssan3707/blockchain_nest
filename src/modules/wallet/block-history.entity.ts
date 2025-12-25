import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, Unique, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Blockchain } from '../blockchain/blockchain.entity';

@Entity({ name: 'block_histories' })
@Unique('UQ_blockhistory_blockchain_number', ['blockchainId', 'number'])
export class BlockHistory extends BaseEntity {
  @Column({ name: 'blockchain_id', type: 'int' })
  blockchainId!: number;

  @ManyToOne(() => Blockchain, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'blockchain_id' })
  blockchain!: Blockchain;

  @Column({ type: 'int' })
  number!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
