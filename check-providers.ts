
import { createConnection } from 'typeorm';
import { Provider } from './src/modules/provider/provider.entity';
import * as dotenv from 'dotenv';
import { Blockchain } from './src/modules/blockchain/blockchain.entity';

dotenv.config();

async function checkProviders() {
    const connection = await createConnection({
        type: 'mysql',
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        username: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASS || '',
        database: process.env.MYSQL_DB || 'blockchain_nest',
        entities: [Provider, Blockchain],
        synchronize: false,
    });

    const providers = await connection.getRepository(Provider).find();
    console.log(JSON.stringify(providers, null, 2));

    await connection.close();
}

checkProviders().catch(console.error);
