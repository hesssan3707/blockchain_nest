import { createConnection } from 'typeorm';
import { Provider } from './src/modules/provider/provider.entity';
import * as dotenv from 'dotenv';

dotenv.config();

async function updateLtcProvider() {
    const connection = await createConnection({
        type: 'mysql',
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        username: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASS || '',
        database: process.env.MYSQL_DB || 'blockchain_nest',
        entities: [Provider],
        synchronize: false,
    });

    const providerRepo = connection.getRepository(Provider);
    const ltcProvider = await providerRepo.findOne({ where: { blockchainName: 'LTC' } });

    if (ltcProvider) {
        const newUrl = 'https://go.getblock.io/d1c4959c9ba9443098ce8586ddb7c583';
        console.log(`Updating LTC provider URL from ${ltcProvider.url} to ${newUrl}`);
        ltcProvider.url = newUrl;
        await providerRepo.save(ltcProvider);
        console.log('LTC provider updated successfully.');
    } else {
        console.log('LTC provider not found.');
    }

    await connection.close();
}

updateLtcProvider().catch(console.error);
