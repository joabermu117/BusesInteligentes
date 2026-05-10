import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRouteDescription1777860958020 implements MigrationInterface {
    name = 'AddRouteDescription1777860958020'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`routes\` ADD \`description\` text NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`routes\` DROP COLUMN \`description\``);
    }
}
