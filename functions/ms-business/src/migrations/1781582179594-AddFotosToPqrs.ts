import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFotosToPqrs1781582179594 implements MigrationInterface {
    name = 'AddFotosToPqrs1781582179594'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`pqrs\` ADD \`fotos\` longtext NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`pqrs\` DROP COLUMN \`fotos\``);
    }

}
