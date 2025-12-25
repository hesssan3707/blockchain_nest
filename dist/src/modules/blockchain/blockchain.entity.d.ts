import { BaseEntity } from '../../common/entities/base.entity';
export declare class Blockchain extends BaseEntity {
    name: string;
    bpm: number;
    extraInfo: Record<string, any> | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
