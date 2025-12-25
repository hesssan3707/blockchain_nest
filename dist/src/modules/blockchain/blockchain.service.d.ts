import { Repository } from 'typeorm';
import { Blockchain } from './blockchain.entity';
import { CreateBlockchainDto } from './dto/create-blockchain.dto';
export declare class BlockchainService {
    private readonly blockchainRepo;
    constructor(blockchainRepo: Repository<Blockchain>);
    create(dto: CreateBlockchainDto): Promise<Blockchain>;
    listActive(): Promise<Blockchain[]>;
    listAll(): Promise<Blockchain[]>;
    toggle(symbol: string, isActive: boolean): Promise<Blockchain>;
    toggleAll(isActive: boolean): Promise<void>;
    getByName(name: string): Promise<Blockchain | null>;
}
