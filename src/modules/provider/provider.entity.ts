﻿﻿﻿﻿﻿﻿﻿import { Column, CreateDateColumn, Entity, Index, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity({ name: 'providers' })
export class Provider extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 50 })
  name!: string;

  @Column({ name: 'blockchain_name', type: 'varchar', length: 50 })
  blockchainName!: string;

  @Column({ type: 'varchar', length: 100 })
  url!: string;

  @Column({ name: 'api_key', type: 'varchar', length: 255 })
  apiKey!: string;

  @Column({ type: 'int', default: 0 })
  priority!: number;

  @Column({ name: 'free_request', type: 'int', default: 0 })
  freeRequest!: number;

  @Column({ name: 'today_request', type: 'int', default: 0 })
  todayRequest!: number;

  @Column({ name: 'fail_limit', type: 'int', default: 0 })
  failLimit!: number;

  @Column({ name: 'fail_requests', type: 'int', default: 0 })
  failRequests!: number;

  @Column({ name: 'extra_info', type: 'json', nullable: true })
  extraInfo!: Record<string, unknown> | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
