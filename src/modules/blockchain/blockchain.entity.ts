import { Column, CreateDateColumn, Entity, Index, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity({ name: 'blockchains' })
export class Blockchain extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 50 })
  name!: string;

  @Column({ type: 'float', default: 1 })
  bpm!: number;

  @Column({ name: 'extra_info', type: 'json', nullable: true })
  extraInfo!: Record<string, any> | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
