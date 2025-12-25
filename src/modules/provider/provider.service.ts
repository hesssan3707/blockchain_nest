import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider } from './provider.entity';

@Injectable()
export class ProviderService {
  constructor(
    @InjectRepository(Provider)
    private readonly providerRepo: Repository<Provider>,
  ) {}

  async getBestProviderForBlockchain(
    blockchainName: string,
  ): Promise<Provider | null> {
    const name = blockchainName.trim().toUpperCase();
    const providers = await this.providerRepo.find({
      where: { blockchainName: name, isActive: true },
      order: { priority: 'DESC' },
    });

    let best: Provider | null = null;
    let bestScore = 0;

    for (const provider of providers) {
      const score = this.getWorthyScore(provider);
      if (score > bestScore) {
        bestScore = score;
        best = provider;
      }
    }

    return best;
  }

  private getWorthyScore(provider: Provider): number {
    if (!provider.isActive) return 0;
    const remaining = provider.freeRequest - provider.todayRequest;
    if (remaining <= 0) return 0;
    const failureBudget = provider.failLimit - provider.failRequests;
    if (failureBudget <= 0) return 0;
    return provider.priority * remaining * failureBudget;
  }
}
