"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const provider_entity_1 = require("./src/modules/provider/provider.entity");
const dotenv = require("dotenv");
const blockchain_entity_1 = require("./src/modules/blockchain/blockchain.entity");
dotenv.config();
async function checkProviders() {
    const connection = await (0, typeorm_1.createConnection)({
        type: 'mysql',
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        username: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASS || '',
        database: process.env.MYSQL_DB || 'blockchain_nest',
        entities: [provider_entity_1.Provider, blockchain_entity_1.Blockchain],
        synchronize: false,
    });
    const providers = await connection.getRepository(provider_entity_1.Provider).find();
    console.log(JSON.stringify(providers, null, 2));
    await connection.close();
}
checkProviders().catch(console.error);
//# sourceMappingURL=check-providers.js.map