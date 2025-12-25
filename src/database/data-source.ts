﻿import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { typeOrmDataSourceOptions } from './typeorm-options';

dotenv.config({ path: '.env' });

export const AppDataSource = new DataSource(typeOrmDataSourceOptions());
