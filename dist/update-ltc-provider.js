"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const provider_entity_1 = require("./src/modules/provider/provider.entity");
const dotenv = require("dotenv");
dotenv.config();
async function updateLtcProvider() {
    const connection = await (0, typeorm_1.createConnection)({
        type: 'mysql',
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        username: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASS || '',
        database: process.env.MYSQL_DB || 'blockchain_nest',
        entities: [provider_entity_1.Provider],
        synchronize: false,
    });
    const providerRepo = connection.getRepository(provider_entity_1.Provider);
    const ltcProvider = await providerRepo.findOne({ where: { blockchainName: 'LTC' } });
    if (ltcProvider) {
        const newUrl = 'https://go.getblock.io/d1c4959c9ba9443098ce8586ddb7c583';
        console.log(`Updating LTC provider URL from ${ltcProvider.url} to ${newUrl}`);
        ltcProvider.url = newUrl;
        await providerRepo.save(ltcProvider);
        console.log('LTC provider updated successfully.');
    }
    else {
        console.log('LTC provider not found.');
    }
    await connection.close();
}
updateLtcProvider().catch(console.error);
//# sourceMappingURL=update-ltc-provider.js.map