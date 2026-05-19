import { MigrationInterface, QueryRunner } from "typeorm";

export class PhotoUrlLongtext1779162023546 implements MigrationInterface {
    name = 'PhotoUrlLongtext1779162023546'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`photos\` DROP COLUMN \`url\``);
        await queryRunner.query(`ALTER TABLE \`photos\` ADD \`url\` longtext NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`photos\` DROP COLUMN \`url\``);
        await queryRunner.query(`ALTER TABLE \`photos\` ADD \`url\` varchar(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`photos\` DROP COLUMN \`url\``);
        await queryRunner.query(`ALTER TABLE \`photos\` ADD \`url\` longtext NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`photos\` DROP COLUMN \`url\``);
        await queryRunner.query(`ALTER TABLE \`photos\` ADD \`url\` varchar(255) NOT NULL`);
    }

}
