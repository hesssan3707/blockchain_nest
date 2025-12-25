"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("./data-source");
const blockchain_entity_1 = require("../modules/blockchain/blockchain.entity");
const currency_entity_1 = require("../modules/currency/currency.entity");
const provider_entity_1 = require("../modules/provider/provider.entity");
async function seed() {
    try {
        console.log('Initializing data source...');
        await data_source_1.AppDataSource.initialize();
        console.log('Data source initialized.');
        const blockchainRepo = data_source_1.AppDataSource.getRepository(blockchain_entity_1.Blockchain);
        const currencyRepo = data_source_1.AppDataSource.getRepository(currency_entity_1.Currency);
        const providerRepo = data_source_1.AppDataSource.getRepository(provider_entity_1.Provider);
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
            }
            else {
                console.log(`Blockchain ${b.name} already exists.`);
            }
            const nativeCurrency = await currencyRepo.findOne({
                where: { symbol: b.name, blockchainId: blockchain.id },
            });
            if (!nativeCurrency) {
                const currency = currencyRepo.create({
                    symbol: b.name,
                    type: currency_entity_1.CurrencyType.COIN,
                    blockchainId: blockchain.id,
                    isActive: true,
                    priority: 1,
                });
                await currencyRepo.save(currency);
                console.log(`Created native currency: ${b.name}`);
            }
        }
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
                url: 'https://broken-maximum-fire.btc.quiknode.pro/your-token/',
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
            }
            else {
                console.log(`Provider ${p.name} already exists.`);
            }
        }
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
                        type: currency_entity_1.CurrencyType.TOKEN,
                        blockchainId: blockchain.id,
                        isActive: true,
                        priority: 2,
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
    }
    catch (error) {
        console.error('Error during seeding:', error);
    }
    finally {
        await data_source_1.AppDataSource.destroy();
    }
}
seed();
//# sourceMappingURL=seed.js.map