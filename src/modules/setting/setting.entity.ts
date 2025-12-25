import { Column, CreateDateColumn, Entity, Index, Unique, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity({ name: 'settings' })
@Unique('UQ_setting_key', ['key'])
export class Setting extends BaseEntity {
  @Column({ type: 'varchar', length: 192 })
  key!: string;

  @Column({ type: 'text', nullable: true })
  value!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
