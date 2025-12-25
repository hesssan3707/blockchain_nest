import { BaseEntity } from '../../common/entities/base.entity';
export declare class User extends BaseEntity {
    identifier: string;
    priority: number;
    passwordHash: string | null;
    isStaff: boolean;
    isSuperuser: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
