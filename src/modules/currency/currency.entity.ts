﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Blockchain } from '../blockchain/blockchain.entity';

export enum CurrencyType {
  COIN = 'coin',
  TOKEN = 'token',
}

@Entity({ name: 'currencies' })
@Unique('UQ_currency_symbol_blockchain', ['symbol', 'blockchain'])
export class Currency extends BaseEntity {
  @Column({ name: 'blockchain_id', type: 'int' })
  blockchainId!: number;

  @Index()
  @ManyToOne(() => Blockchain, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'blockchain_id' })
  blockchain!: Blockchain;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  symbol!: string;

  @Column({ type: 'varchar', length: 5 })
  type!: CurrencyType;

  @Index()
  @Column({
    name: 'token_address',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  tokenAddress!: string | null;

  @Column({ name: 'token_abi', type: 'json', nullable: true })
  tokenAbi!: Record<string, unknown> | null;

  @Column({ type: 'int', default: 1 })
  priority!: number;

  @Column({ name: 'min_withdrawal_amount', type: 'float', default: 0 })
  minWithdrawalAmount!: number;

  @Column({ name: 'min_balance_collector_amount', type: 'float', default: 0 })
  minBalanceCollectorAmount!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
