"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorrectedSchema1766321948929 = void 0;
class CorrectedSchema1766321948929 {
    constructor() {
        this.name = 'CorrectedSchema1766321948929';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE \`blockchains\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(50) NOT NULL, \`bpm\` float NOT NULL DEFAULT '1', \`extra_info\` json NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_dc4814fee557a9169944ca9dc0\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`currencies\` (\`id\` int NOT NULL AUTO_INCREMENT, \`blockchain_id\` int NOT NULL, \`symbol\` varchar(255) NOT NULL, \`type\` varchar(5) NOT NULL, \`token_address\` varchar(255) NULL, \`token_abi\` json NULL, \`priority\` int NOT NULL DEFAULT '1', \`min_withdrawal_amount\` float NOT NULL DEFAULT '0', \`min_balance_collector_amount\` float NOT NULL DEFAULT '0', \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_bb889f7c4f7cbe66b0319bc6d0\` (\`blockchain_id\`), INDEX \`IDX_30ed1fd0130c0874227d1817f2\` (\`symbol\`), INDEX \`IDX_3220c542a5fe874e3d9fb9106c\` (\`token_address\`), UNIQUE INDEX \`UQ_currency_symbol_blockchain\` (\`symbol\`, \`blockchain_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`providers\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(50) NOT NULL, \`blockchain_name\` varchar(50) NOT NULL, \`url\` varchar(100) NOT NULL, \`api_key\` varchar(255) NOT NULL, \`priority\` int NOT NULL DEFAULT '0', \`free_request\` int NOT NULL DEFAULT '0', \`today_request\` int NOT NULL DEFAULT '0', \`fail_limit\` int NOT NULL DEFAULT '0', \`fail_requests\` int NOT NULL DEFAULT '0', \`extra_info\` json NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_d735474e539e674ba3702eddc4\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`settings\` (\`id\` int NOT NULL AUTO_INCREMENT, \`key\` varchar(192) NOT NULL, \`value\` text NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`UQ_setting_key\` (\`key\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`identifier\` varchar(128) NOT NULL, \`priority\` int NOT NULL DEFAULT '4', \`password\` varchar(128) NULL, \`is_staff\` tinyint NOT NULL DEFAULT 0, \`is_superuser\` tinyint NOT NULL DEFAULT 0, \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_2e7b7debda55e0e7280dc93663\` (\`identifier\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`block_histories\` (\`id\` int NOT NULL AUTO_INCREMENT, \`blockchain_id\` int NOT NULL, \`number\` int NOT NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`UQ_blockhistory_number\` (\`number\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`wallets\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`blockchain_id\` int NOT NULL, \`public_key\` varchar(255) NOT NULL, \`private_key\` varchar(255) NULL, \`mnemonic\` varchar(255) NULL, \`memo\` int NULL, \`admin_wallet\` tinyint NOT NULL DEFAULT 0, \`exchange_wallet\` tinyint NOT NULL DEFAULT 0, \`description\` text NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_92558c08091598f7a4439586cd\` (\`user_id\`), INDEX \`IDX_b31281e17d4fe91380854c56ac\` (\`blockchain_id\`), INDEX \`IDX_819b5d3328859cc8802df3151e\` (\`public_key\`), INDEX \`IDX_591d5a477f2dd20541336b9d10\` (\`private_key\`), UNIQUE INDEX \`UQ_wallet_user_blockchain\` (\`user_id\`, \`blockchain_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`fee_inventories\` (\`id\` int NOT NULL AUTO_INCREMENT, \`wallet_id\` int NOT NULL, \`amount\` float NOT NULL DEFAULT '0', \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`UQ_feeinventory_wallet\` (\`wallet_id\`), UNIQUE INDEX \`REL_12ec1c4069d9a5bc8d6dfeaebc\` (\`wallet_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`incomes\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`blockchain_id\` int NOT NULL, \`currency_id\` int NOT NULL, \`type\` varchar(15) NOT NULL, \`amount\` float NOT NULL DEFAULT '0', \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`transactions\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`wallet_id\` int NULL, \`blockchain_id\` int NOT NULL, \`currency_id\` int NOT NULL, \`uuid\` char(36) NULL, \`transaction_id\` bigint NULL, \`transaction_hash\` varchar(100) NULL, \`value\` float NOT NULL, \`type\` varchar(20) NOT NULL, \`status\` varchar(20) NOT NULL, \`external_wallet\` varchar(255) NULL, \`memo\` varchar(60) NULL, \`checksum\` varchar(32) NULL, \`description\` text NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_71ee7072c1ba2c23edc34fabfe\` (\`uuid\`), INDEX \`IDX_9162bf9ab4e31961a8f7932974\` (\`transaction_id\`), INDEX \`IDX_b53cfe42d3c5c88fe715b9432b\` (\`transaction_hash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`wallet_balances\` (\`id\` int NOT NULL AUTO_INCREMENT, \`wallet_id\` int NOT NULL, \`currency_id\` int NOT NULL, \`user_balance\` float NOT NULL DEFAULT '0', \`network_balance\` float NOT NULL DEFAULT '0', \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_df71d0f9058318ebc25302aa36\` (\`wallet_id\`), INDEX \`IDX_fef3b439d1ceecb8f7bfc4fc6d\` (\`currency_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`currencies\` ADD CONSTRAINT \`FK_bb889f7c4f7cbe66b0319bc6d07\` FOREIGN KEY (\`blockchain_id\`) REFERENCES \`blockchains\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`block_histories\` ADD CONSTRAINT \`FK_44c7410f040b7ed618deea3ae87\` FOREIGN KEY (\`blockchain_id\`) REFERENCES \`blockchains\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`wallets\` ADD CONSTRAINT \`FK_92558c08091598f7a4439586cda\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`wallets\` ADD CONSTRAINT \`FK_b31281e17d4fe91380854c56aca\` FOREIGN KEY (\`blockchain_id\`) REFERENCES \`blockchains\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`fee_inventories\` ADD CONSTRAINT \`FK_12ec1c4069d9a5bc8d6dfeaebcd\` FOREIGN KEY (\`wallet_id\`) REFERENCES \`wallets\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`incomes\` ADD CONSTRAINT \`FK_400664fad260d8fa50ecb78ffe6\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`incomes\` ADD CONSTRAINT \`FK_5161e15e8ab3756daa0b737f260\` FOREIGN KEY (\`blockchain_id\`) REFERENCES \`blockchains\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`incomes\` ADD CONSTRAINT \`FK_d96e63b692a064568bdf4131e5f\` FOREIGN KEY (\`currency_id\`) REFERENCES \`currencies\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD CONSTRAINT \`FK_e9acc6efa76de013e8c1553ed2b\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD CONSTRAINT \`FK_0b171330be0cb621f8d73b87a9e\` FOREIGN KEY (\`wallet_id\`) REFERENCES \`wallets\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD CONSTRAINT \`FK_1d8542bda44422c958c6c4095e4\` FOREIGN KEY (\`blockchain_id\`) REFERENCES \`blockchains\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD CONSTRAINT \`FK_b515faccedf1dc36ac4f78acc04\` FOREIGN KEY (\`currency_id\`) REFERENCES \`currencies\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`wallet_balances\` ADD CONSTRAINT \`FK_df71d0f9058318ebc25302aa365\` FOREIGN KEY (\`wallet_id\`) REFERENCES \`wallets\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`wallet_balances\` ADD CONSTRAINT \`FK_fef3b439d1ceecb8f7bfc4fc6d2\` FOREIGN KEY (\`currency_id\`) REFERENCES \`currencies\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`wallet_balances\` DROP FOREIGN KEY \`FK_fef3b439d1ceecb8f7bfc4fc6d2\``);
        await queryRunner.query(`ALTER TABLE \`wallet_balances\` DROP FOREIGN KEY \`FK_df71d0f9058318ebc25302aa365\``);
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP FOREIGN KEY \`FK_b515faccedf1dc36ac4f78acc04\``);
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP FOREIGN KEY \`FK_1d8542bda44422c958c6c4095e4\``);
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP FOREIGN KEY \`FK_0b171330be0cb621f8d73b87a9e\``);
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP FOREIGN KEY \`FK_e9acc6efa76de013e8c1553ed2b\``);
        await queryRunner.query(`ALTER TABLE \`incomes\` DROP FOREIGN KEY \`FK_d96e63b692a064568bdf4131e5f\``);
        await queryRunner.query(`ALTER TABLE \`incomes\` DROP FOREIGN KEY \`FK_5161e15e8ab3756daa0b737f260\``);
        await queryRunner.query(`ALTER TABLE \`incomes\` DROP FOREIGN KEY \`FK_400664fad260d8fa50ecb78ffe6\``);
        await queryRunner.query(`ALTER TABLE \`fee_inventories\` DROP FOREIGN KEY \`FK_12ec1c4069d9a5bc8d6dfeaebcd\``);
        await queryRunner.query(`ALTER TABLE \`wallets\` DROP FOREIGN KEY \`FK_b31281e17d4fe91380854c56aca\``);
        await queryRunner.query(`ALTER TABLE \`wallets\` DROP FOREIGN KEY \`FK_92558c08091598f7a4439586cda\``);
        await queryRunner.query(`ALTER TABLE \`block_histories\` DROP FOREIGN KEY \`FK_44c7410f040b7ed618deea3ae87\``);
        await queryRunner.query(`ALTER TABLE \`currencies\` DROP FOREIGN KEY \`FK_bb889f7c4f7cbe66b0319bc6d07\``);
        await queryRunner.query(`DROP INDEX \`IDX_fef3b439d1ceecb8f7bfc4fc6d\` ON \`wallet_balances\``);
        await queryRunner.query(`DROP INDEX \`IDX_df71d0f9058318ebc25302aa36\` ON \`wallet_balances\``);
        await queryRunner.query(`DROP TABLE \`wallet_balances\``);
        await queryRunner.query(`DROP INDEX \`IDX_b53cfe42d3c5c88fe715b9432b\` ON \`transactions\``);
        await queryRunner.query(`DROP INDEX \`IDX_9162bf9ab4e31961a8f7932974\` ON \`transactions\``);
        await queryRunner.query(`DROP INDEX \`IDX_71ee7072c1ba2c23edc34fabfe\` ON \`transactions\``);
        await queryRunner.query(`DROP TABLE \`transactions\``);
        await queryRunner.query(`DROP TABLE \`incomes\``);
        await queryRunner.query(`DROP INDEX \`REL_12ec1c4069d9a5bc8d6dfeaebc\` ON \`fee_inventories\``);
        await queryRunner.query(`DROP INDEX \`UQ_feeinventory_wallet\` ON \`fee_inventories\``);
        await queryRunner.query(`DROP TABLE \`fee_inventories\``);
        await queryRunner.query(`DROP INDEX \`UQ_wallet_user_blockchain\` ON \`wallets\``);
        await queryRunner.query(`DROP INDEX \`IDX_591d5a477f2dd20541336b9d10\` ON \`wallets\``);
        await queryRunner.query(`DROP INDEX \`IDX_819b5d3328859cc8802df3151e\` ON \`wallets\``);
        await queryRunner.query(`DROP INDEX \`IDX_b31281e17d4fe91380854c56ac\` ON \`wallets\``);
        await queryRunner.query(`DROP INDEX \`IDX_92558c08091598f7a4439586cd\` ON \`wallets\``);
        await queryRunner.query(`DROP TABLE \`wallets\``);
        await queryRunner.query(`DROP INDEX \`UQ_blockhistory_number\` ON \`block_histories\``);
        await queryRunner.query(`DROP TABLE \`block_histories\``);
        await queryRunner.query(`DROP INDEX \`IDX_2e7b7debda55e0e7280dc93663\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP INDEX \`UQ_setting_key\` ON \`settings\``);
        await queryRunner.query(`DROP TABLE \`settings\``);
        await queryRunner.query(`DROP INDEX \`IDX_d735474e539e674ba3702eddc4\` ON \`providers\``);
        await queryRunner.query(`DROP TABLE \`providers\``);
        await queryRunner.query(`DROP INDEX \`UQ_currency_symbol_blockchain\` ON \`currencies\``);
        await queryRunner.query(`DROP INDEX \`IDX_3220c542a5fe874e3d9fb9106c\` ON \`currencies\``);
        await queryRunner.query(`DROP INDEX \`IDX_30ed1fd0130c0874227d1817f2\` ON \`currencies\``);
        await queryRunner.query(`DROP INDEX \`IDX_bb889f7c4f7cbe66b0319bc6d0\` ON \`currencies\``);
        await queryRunner.query(`DROP TABLE \`currencies\``);
        await queryRunner.query(`DROP INDEX \`IDX_dc4814fee557a9169944ca9dc0\` ON \`blockchains\``);
        await queryRunner.query(`DROP TABLE \`blockchains\``);
    }
}
exports.CorrectedSchema1766321948929 = CorrectedSchema1766321948929;
//# sourceMappingURL=1766321948929-CorrectedSchema.js.map