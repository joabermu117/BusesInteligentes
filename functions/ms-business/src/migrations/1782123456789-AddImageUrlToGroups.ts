import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImageUrlToGroups1782123456789 implements MigrationInterface {
    name = 'AddImageUrlToGroups1782123456789'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('groups');
        const hasImageUrl = table?.findColumnByName('image_url');
        if (!hasImageUrl) {
            await queryRunner.query(`ALTER TABLE \`groups\` ADD \`image_url\` varchar(500) NULL`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('groups');
        const hasImageUrl = table?.findColumnByName('image_url');
        if (hasImageUrl) {
            await queryRunner.query(`ALTER TABLE \`groups\` DROP COLUMN \`image_url\``);
        }
    }

}
