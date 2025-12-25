import { BaseEntity } from '../../common/entities/base.entity';
export declare class Setting extends BaseEntity {
    key: string;
    value: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
