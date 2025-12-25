import { MigrationInterface, QueryRunner } from "typeorm";
export declare class CorrectedSchema1766321948929 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
