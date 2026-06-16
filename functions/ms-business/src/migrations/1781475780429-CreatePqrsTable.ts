import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePqrsTable1781475780429 implements MigrationInterface {
    name = 'CreatePqrsTable1781475780429'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`pqrs\` (\`id\` int NOT NULL AUTO_INCREMENT, \`radicado\` varchar(50) NOT NULL, \`tipo\` varchar(50) NOT NULL, \`categoria\` varchar(50) NOT NULL, \`descripcion\` text NOT NULL, \`email\` varchar(255) NOT NULL, \`estado\` enum ('recibido', 'en_revision', 'en_proceso', 'resuelto') NOT NULL DEFAULT 'recibido', \`respuesta\` text NULL, \`tiempoRespuesta\` varchar(50) NOT NULL DEFAULT '5 días hábiles', \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`resolvedAt\` timestamp NULL, \`deadlineAt\` timestamp NULL, UNIQUE INDEX \`IDX_422e4aad504067ec2fba5d96cb\` (\`radicado\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_422e4aad504067ec2fba5d96cb\` ON \`pqrs\``);
        await queryRunner.query(`DROP TABLE \`pqrs\``);
    }

}
