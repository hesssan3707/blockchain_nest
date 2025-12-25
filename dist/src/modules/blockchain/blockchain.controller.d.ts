import { CreateBlockchainDto } from './dto/create-blockchain.dto';
import { BlockchainService } from './blockchain.service';
export declare class BlockchainController {
    private readonly blockchainService;
    constructor(blockchainService: BlockchainService);
    list(): Promise<{
        data: import("./blockchain.entity").Blockchain[];
        message: string;
        status: number;
    }>;
    toggle(body: {
        symbol: string;
        is_active: number | boolean;
    }): Promise<{
        data: import("./blockchain.entity").Blockchain;
        message: string;
        status: number;
    }>;
    toggleAll(body: {
        is_active: number | boolean;
    }): Promise<{
        data: null;
        message: string;
        status: number;
    }>;
    create(dto: CreateBlockchainDto): Promise<{
        data: import("./blockchain.entity").Blockchain;
        message: string;
        status: number;
    }>;
}
