import { BaseEntity } from '../../common/entities/base.entity';
export declare class Provider extends BaseEntity {
    name: string;
    blockchainName: string;
    url: string;
    apiKey: string;
    priority: number;
    freeRequest: number;
    todayRequest: number;
    failLimit: number;
    failRequests: number;
    extraInfo: Record<string, unknown> | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
