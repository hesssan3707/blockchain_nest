import { AppDataSource } from './data-source';
import { Blockchain } from '../modules/blockchain/blockchain.entity';
import { Currency, CurrencyType } from '../modules/currency/currency.entity';
import { Provider } from '../modules/provider/provider.entity';

async function seed() {
  try {
    console.log('Initializing data source...');
    await AppDataSource.initialize();
    console.log('Data source initialized.');

    const blockchainRepo = AppDataSource.getRepository(Blockchain);
    const currencyRepo = AppDataSource.getRepository(Currency);
    const providerRepo = AppDataSource.getRepository(Provider);

    const blockchains = [
      { name: 'ETH', bpm: 4.6 },
      { name: 'BSC', bpm: 20 },
      { name: 'TRON', bpm: 20 },
      { name: 'BTC', bpm: 0.1 },
      { name: 'LTC', bpm: 0.4 },
      { name: 'XRP', bpm: 15 },
    ];

    console.log('Seeding blockchains...');
    for (const b of blockchains) {
      let blockchain = await blockchainRepo.findOne({ where: { name: b.name } });
      if (!blockchain) {
        blockchain = blockchainRepo.create({
          name: b.name,
          bpm: b.bpm,
          isActive: true,
        });
        await blockchainRepo.save(blockchain);
        console.log(`Created blockchain: ${b.name}`);
      } else {
        console.log(`Blockchain ${b.name} already exists.`);
      }

      // Seed native currency for each blockchain
      const nativeCurrency = await currencyRepo.findOne({
        where: { symbol: b.name, blockchainId: blockchain.id },
      });

      if (!nativeCurrency) {
        const currency = currencyRepo.create({
          symbol: b.name,
          type: CurrencyType.COIN,
          blockchainId: blockchain.id,
          isActive: true,
          priority: 1,
        });
        await currencyRepo.save(currency);
        console.log(`Created native currency: ${b.name}`);
      }
    }

    // Seed Providers (RPC URLs)
    const providers = [
      {
        name: 'Etherscan',
        blockchainName: 'ETH',
        url: 'https://ethereum.publicnode.com',
        apiKey: '',
        priority: 100,
      },
      {
        name: 'Bsscan',
        blockchainName: 'BSC',
        url: 'https://bsc-dataseed.binance.org',
        apiKey: '',
        priority: 100,
      },
      {
        name: 'TronGrid',
        blockchainName: 'TRON',
        url: 'https://api.trongrid.io',
        apiKey: '',
        priority: 100,
      },
      {
        name: 'Bitcoin-RPC',
        blockchainName: 'BTC',
        url: 'https://broken-maximum-fire.btc.quiknode.pro/your-token/', // Placeholder
        apiKey: '',
        priority: 100,
      },
      {
        name: 'Litecoin-RPC',
        blockchainName: 'LTC',
        url: 'https://litecoin.publicnode.com',
        apiKey: '',
        priority: 100,
      },
      {
        name: 'Ripple-RPC',
        blockchainName: 'XRP',
        url: 'https://s2.ripple.com:51234/',
        apiKey: '',
        priority: 100,
      },
    ];

    console.log('Seeding providers...');
    for (const p of providers) {
      const existing = await providerRepo.findOne({ where: { name: p.name, blockchainName: p.blockchainName } });
      if (!existing) {
        const provider = providerRepo.create({
          ...p,
          isActive: true,
          freeRequest: 1000000,
          failLimit: 10,
        });
        await providerRepo.save(provider);
        console.log(`Created provider: ${p.name} for ${p.blockchainName}`);
      } else {
        console.log(`Provider ${p.name} already exists.`);
      }
    }

    // Special case for USDT on different blockchains
    const usdtBlockchains = ['ETH', 'BSC', 'TRON'];
    for (const name of usdtBlockchains) {
      const blockchain = await blockchainRepo.findOne({ where: { name } });
      if (blockchain) {
        const usdt = await currencyRepo.findOne({
          where: { symbol: 'USDT', blockchainId: blockchain.id },
        });

        if (!usdt) {
          const currency = currencyRepo.create({
            symbol: 'USDT',
            type: CurrencyType.TOKEN,
            blockchainId: blockchain.id,
            isActive: true,
            priority: 2,
            // Add known USDT addresses
            tokenAddress: name === 'TRON' ? 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' : 
                          name === 'ETH' ? '0xdAC17F958D2ee523a2206206994597C13D831ec7' :
                          name === 'BSC' ? '0x55d398326f99059fF775485246999027B3197955' : undefined
          });
          await currencyRepo.save(currency);
          console.log(`Created USDT on ${name}`);
        }
      }
    }

    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();
