import { Column, CreateDateColumn, Entity, Index, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 128, unique: true })
  identifier!: string;

  @Column({ type: 'int', default: 4 })
  priority!: number;

  @Column({ name: 'password', type: 'varchar', length: 128, nullable: true })
  passwordHash!: string | null;

  @Column({ name: 'is_staff', type: 'boolean', default: false })
  isStaff!: boolean;

  @Column({ name: 'is_superuser', type: 'boolean', default: false })
  isSuperuser!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
