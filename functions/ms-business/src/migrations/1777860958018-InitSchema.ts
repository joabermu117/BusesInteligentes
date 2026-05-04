import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1777860958018 implements MigrationInterface {
    name = 'InitSchema1777860958018'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`companies\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nit\` varchar(255) NOT NULL, \`nombre\` varchar(255) NOT NULL, \`direccion\` varchar(255) NULL, \`telefono\` varchar(255) NULL, \`email\` varchar(255) NULL, \`activa\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_ed61d4dcafb6fe0f595f5e0cbd\` (\`nit\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`gps\` (\`id\` int NOT NULL AUTO_INCREMENT, \`latitude\` decimal(10,7) NULL, \`longitude\` decimal(10,7) NULL, \`lastUpdate\` datetime NULL, \`active\` tinyint NOT NULL DEFAULT 0, \`busId\` int NULL, UNIQUE INDEX \`REL_3ee73b40fa14ab3a700b131318\` (\`busId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`incidents\` (\`id\` int NOT NULL AUTO_INCREMENT, \`type\` enum ('mechanical', 'accident', 'delay', 'other') NOT NULL, \`severity\` enum ('low', 'medium', 'high', 'critical') NOT NULL, \`description\` text NULL, \`status\` enum ('pending', 'in_review', 'resolved') NOT NULL DEFAULT 'pending', \`reportedAt\` datetime NULL, \`resolvedAt\` datetime NULL, \`supervisorComment\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`photos\` (\`id\` int NOT NULL AUTO_INCREMENT, \`url\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, \`uploadedAt\` datetime NULL, \`incidentBusId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`incidents_buses\` (\`id\` int NOT NULL AUTO_INCREMENT, \`driverUserId\` varchar(255) NULL, \`shiftId\` int NULL, \`latitude\` decimal(10,7) NULL, \`longitude\` decimal(10,7) NULL, \`reportedAt\` datetime NULL, \`busId\` int NULL, \`incidentId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`schedules\` (\`id\` int NOT NULL AUTO_INCREMENT, \`routeId\` int NOT NULL, \`departureTime\` datetime NOT NULL, \`toleranceMinutes\` int NULL, \`status\` enum ('scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled', \`recurrence\` enum ('none', 'weekdays', 'weekends', 'daily') NOT NULL DEFAULT 'none', \`date\` datetime NULL, \`busId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`buses\` (\`id\` int NOT NULL AUTO_INCREMENT, \`plate\` varchar(255) NOT NULL, \`model\` varchar(255) NOT NULL, \`year\` int NOT NULL, \`totalCapacity\` int NOT NULL, \`seatedCapacity\` int NULL, \`standingCapacity\` int NULL, \`photoUrl\` varchar(255) NULL, \`qrCode\` varchar(255) NULL, \`status\` enum ('operative', 'maintenance', 'out_of_service') NOT NULL DEFAULT 'operative', \`companyId\` int NULL, UNIQUE INDEX \`IDX_1da765de924476580123f727ae\` (\`plate\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`shifts\` (\`id\` int NOT NULL AUTO_INCREMENT, \`driverUserId\` varchar(255) NOT NULL, \`startTime\` datetime NOT NULL, \`endTime\` datetime NULL, \`status\` enum ('scheduled', 'in_progress', 'finished', 'cancelled') NOT NULL DEFAULT 'scheduled', \`observations\` varchar(255) NULL, \`busCondition\` varchar(255) NULL, \`busId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`gps\` ADD CONSTRAINT \`FK_3ee73b40fa14ab3a700b1313189\` FOREIGN KEY (\`busId\`) REFERENCES \`buses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`photos\` ADD CONSTRAINT \`FK_c4378c1c1eab6436e1caa24e16c\` FOREIGN KEY (\`incidentBusId\`) REFERENCES \`incidents_buses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`incidents_buses\` ADD CONSTRAINT \`FK_39ec73c3ed89e860b89937e1e94\` FOREIGN KEY (\`busId\`) REFERENCES \`buses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`incidents_buses\` ADD CONSTRAINT \`FK_2349fb8e36e211f0176ab3a9426\` FOREIGN KEY (\`incidentId\`) REFERENCES \`incidents\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`schedules\` ADD CONSTRAINT \`FK_d1e417ab02019758bbfa2ba5396\` FOREIGN KEY (\`busId\`) REFERENCES \`buses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`buses\` ADD CONSTRAINT \`FK_9c95dd427817f6ad645263473f6\` FOREIGN KEY (\`companyId\`) REFERENCES \`companies\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`shifts\` ADD CONSTRAINT \`FK_8fc86950a73dacf7d7a0a5c8fcf\` FOREIGN KEY (\`busId\`) REFERENCES \`buses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`shifts\` DROP FOREIGN KEY \`FK_8fc86950a73dacf7d7a0a5c8fcf\``);
        await queryRunner.query(`ALTER TABLE \`buses\` DROP FOREIGN KEY \`FK_9c95dd427817f6ad645263473f6\``);
        await queryRunner.query(`ALTER TABLE \`schedules\` DROP FOREIGN KEY \`FK_d1e417ab02019758bbfa2ba5396\``);
        await queryRunner.query(`ALTER TABLE \`incidents_buses\` DROP FOREIGN KEY \`FK_2349fb8e36e211f0176ab3a9426\``);
        await queryRunner.query(`ALTER TABLE \`incidents_buses\` DROP FOREIGN KEY \`FK_39ec73c3ed89e860b89937e1e94\``);
        await queryRunner.query(`ALTER TABLE \`photos\` DROP FOREIGN KEY \`FK_c4378c1c1eab6436e1caa24e16c\``);
        await queryRunner.query(`ALTER TABLE \`gps\` DROP FOREIGN KEY \`FK_3ee73b40fa14ab3a700b1313189\``);
        await queryRunner.query(`DROP TABLE \`shifts\``);
        await queryRunner.query(`DROP INDEX \`IDX_1da765de924476580123f727ae\` ON \`buses\``);
        await queryRunner.query(`DROP TABLE \`buses\``);
        await queryRunner.query(`DROP TABLE \`schedules\``);
        await queryRunner.query(`DROP TABLE \`incidents_buses\``);
        await queryRunner.query(`DROP TABLE \`photos\``);
        await queryRunner.query(`DROP TABLE \`incidents\``);
        await queryRunner.query(`DROP INDEX \`REL_3ee73b40fa14ab3a700b131318\` ON \`gps\``);
        await queryRunner.query(`DROP TABLE \`gps\``);
        await queryRunner.query(`DROP INDEX \`IDX_ed61d4dcafb6fe0f595f5e0cbd\` ON \`companies\``);
        await queryRunner.query(`DROP TABLE \`companies\``);
    }

}
