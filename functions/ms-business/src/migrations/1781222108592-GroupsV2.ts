import { MigrationInterface, QueryRunner } from "typeorm";

export class GroupsV21781222108592 implements MigrationInterface {
    name = 'GroupsV21781222108592'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`group_membership_logs\` (\`id\` int NOT NULL AUTO_INCREMENT, \`group_id\` int NOT NULL, \`person_id\` varchar(255) NOT NULL, \`action_by_person_id\` varchar(255) NULL, \`action\` enum ('joined', 'left', 'removed', 'promoted', 'blocked') NOT NULL, \`action_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`groups\` ADD \`is_public\` tinyint NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`group_persons\` ADD \`is_blocked\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`group_membership_logs\` ADD CONSTRAINT \`FK_b64eec069e66b1d914099cba491\` FOREIGN KEY (\`group_id\`) REFERENCES \`groups\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`group_membership_logs\` DROP FOREIGN KEY \`FK_b64eec069e66b1d914099cba491\``);
        await queryRunner.query(`ALTER TABLE \`group_persons\` DROP COLUMN \`is_blocked\``);
        await queryRunner.query(`ALTER TABLE \`groups\` DROP COLUMN \`is_public\``);
        await queryRunner.query(`DROP TABLE \`group_membership_logs\``);
    }

}
