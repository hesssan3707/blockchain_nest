"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const dotenv = require("dotenv");
const typeorm_1 = require("typeorm");
const typeorm_options_1 = require("./typeorm-options");
dotenv.config({ path: '.env' });
exports.AppDataSource = new typeorm_1.DataSource((0, typeorm_options_1.typeOrmDataSourceOptions)());
//# sourceMappingURL=data-source.js.map