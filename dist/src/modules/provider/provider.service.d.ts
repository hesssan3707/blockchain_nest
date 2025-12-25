import { Repository } from 'typeorm';
import { Provider } from './provider.entity';
export declare class ProviderService {
    private readonly providerRepo;
    constructor(providerRepo: Repository<Provider>);
    getBestProviderForBlockchain(blockchainName: string): Promise<Provider | null>;
    private getWorthyScore;
}
