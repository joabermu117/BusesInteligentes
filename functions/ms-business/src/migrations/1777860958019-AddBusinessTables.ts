import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBusinessTables1777860958019 implements MigrationInterface {
    name = 'AddBusinessTables1777860958019'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Routes
        await queryRunner.query(`CREATE TABLE \`routes\` (
            \`id\` int NOT NULL AUTO_INCREMENT,
            \`name\` varchar(255) NOT NULL,
            \`origin\` varchar(255) NOT NULL,
            \`destination\` varchar(255) NOT NULL,
            \`distance\` float NOT NULL,
            \`estimated_duration\` int NOT NULL,
            \`tarifa\` decimal(10,2) NOT NULL DEFAULT '0.00',
            \`is_active\` tinyint NOT NULL DEFAULT 1,
            PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB`);

        // Stops
        await queryRunner.query(`CREATE TABLE \`stops\` (
            \`id\` int NOT NULL AUTO_INCREMENT,
            \`name\` varchar(255) NOT NULL,
            \`latitude\` decimal(10,7) NOT NULL,
            \`longitude\` decimal(10,7) NOT NULL,
            \`address\` varchar(255) NOT NULL,
            \`is_active\` tinyint NOT NULL DEFAULT 1,
            PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB`);

        // Route-Stop junction (M:N)
        await queryRunner.query(`CREATE TABLE \`route_stop\` (
            \`route_id\` int NOT NULL,
            \`stop_id\` int NOT NULL,
            \`order_index\` int NOT NULL,
            PRIMARY KEY (\`route_id\`, \`stop_id\`)
        ) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`route_stop\` ADD CONSTRAINT \`FK_route_stop_route\` FOREIGN KEY (\`route_id\`) REFERENCES \`routes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`route_stop\` ADD CONSTRAINT \`FK_route_stop_stop\` FOREIGN KEY (\`stop_id\`) REFERENCES \`stops\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);

        // Nodes (waypoints for route paths)
        await queryRunner.query(`CREATE TABLE \`nodes\` (
            \`id\` int NOT NULL AUTO_INCREMENT,
            \`latitude\` decimal(10,7) NOT NULL,
            \`longitude\` decimal(10,7) NOT NULL,
            \`type\` enum ('stop', 'waypoint') NOT NULL,
            \`sequence_order\` int NOT NULL,
            \`route_id\` int NOT NULL,
            PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`nodes\` ADD CONSTRAINT \`FK_nodes_route\` FOREIGN KEY (\`route_id\`) REFERENCES \`routes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);

        // Citizens (extends Person base)
        await queryRunner.query(`CREATE TABLE \`citizens\` (
            \`person_id\` varchar(255) NOT NULL,
            PRIMARY KEY (\`person_id\`)
        ) ENGINE=InnoDB`);

        // Addresses
        await queryRunner.query(`CREATE TABLE \`addresses\` (
            \`id\` int NOT NULL AUTO_INCREMENT,
            \`street\` varchar(255) NOT NULL,
            \`city\` varchar(100) NULL,
            \`state\` varchar(100) NULL,
            \`zipCode\` varchar(20) NULL,
            \`details\` text NULL,
            \`isPrimary\` tinyint NOT NULL DEFAULT 0,
            \`citizenPersonId\` varchar(255) NULL,
            PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`addresses\` ADD CONSTRAINT \`FK_addresses_citizen\` FOREIGN KEY (\`citizenPersonId\`) REFERENCES \`citizens\`(\`person_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Drivers
        await queryRunner.query(`CREATE TABLE \`drivers\` (
            \`person_id\` varchar(255) NOT NULL,
            \`licenseNumber\` varchar(255) NULL,
            \`licenseExpiration\` datetime NULL,
            \`status\` enum ('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
            PRIMARY KEY (\`person_id\`)
        ) ENGINE=InnoDB`);

        // Payment Methods (catalog)
        await queryRunner.query(`CREATE TABLE \`payment_methods\` (
            \`id\` int NOT NULL AUTO_INCREMENT,
            \`name\` varchar(100) NOT NULL,
            \`description\` text NULL,
            \`isActive\` tinyint NOT NULL DEFAULT 1,
            UNIQUE INDEX \`IDX_payment_methods_name\` (\`name\`),
            PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB`);

        // Citizen Payment Methods
        await queryRunner.query(`CREATE TABLE \`citizen_payment_methods\` (
            \`id\` int NOT NULL AUTO_INCREMENT,
            \`cardNumber\` varchar(255) NULL,
            \`cardHolder\` varchar(255) NULL,
            \`expirationDate\` datetime NULL,
            \`isDefault\` tinyint NOT NULL DEFAULT 0,
            \`isActive\` tinyint NOT NULL DEFAULT 1,
            \`citizenPersonId\` varchar(255) NULL,
            \`paymentMethodId\` int NULL,
            PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`citizen_payment_methods\` ADD CONSTRAINT \`FK_cpm_citizen\` FOREIGN KEY (\`citizenPersonId\`) REFERENCES \`citizens\`(\`person_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`citizen_payment_methods\` ADD CONSTRAINT \`FK_cpm_payment_method\` FOREIGN KEY (\`paymentMethodId\`) REFERENCES \`payment_methods\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Tickets
        await queryRunner.query(`CREATE TABLE \`tickets\` (
            \`id\` int NOT NULL AUTO_INCREMENT,
            \`ticketNumber\` varchar(100) NOT NULL,
            \`status\` enum ('issued', 'used', 'expired', 'cancelled') NOT NULL DEFAULT 'issued',
            \`issuedDate\` datetime NULL,
            \`expirationDate\` datetime NULL,
            \`completedDate\` datetime NULL,
            \`price\` decimal(10,2) NULL,
            \`qrCode\` text NULL,
            \`isBoardingPass\` tinyint NOT NULL DEFAULT 0,
            \`citizenPersonId\` varchar(255) NULL,
            \`paymentMethodId\` int NULL,
            \`scheduleId\` int NULL,
            UNIQUE INDEX \`IDX_tickets_ticketNumber\` (\`ticketNumber\`),
            PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`tickets\` ADD CONSTRAINT \`FK_tickets_citizen\` FOREIGN KEY (\`citizenPersonId\`) REFERENCES \`citizens\`(\`person_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tickets\` ADD CONSTRAINT \`FK_tickets_payment_method\` FOREIGN KEY (\`paymentMethodId\`) REFERENCES \`citizen_payment_methods\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tickets\` ADD CONSTRAINT \`FK_tickets_schedule\` FOREIGN KEY (\`scheduleId\`) REFERENCES \`schedules\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Histories
        await queryRunner.query(`CREATE TABLE \`histories\` (
            \`id\` int NOT NULL AUTO_INCREMENT,
            \`personId\` varchar(255) NOT NULL,
            \`timestamp\` datetime NOT NULL,
            \`action\` enum ('created', 'updated', 'deleted', 'boarded', 'validated') NOT NULL,
            \`details\` text NULL,
            \`nodeId\` varchar(255) NULL,
            \`ticketId\` int NULL,
            PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`histories\` ADD CONSTRAINT \`FK_histories_ticket\` FOREIGN KEY (\`ticketId\`) REFERENCES \`tickets\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Contracts
        await queryRunner.query(`CREATE TABLE \`contracts\` (
            \`id\` int NOT NULL AUTO_INCREMENT,
            \`contractNumber\` varchar(100) NULL,
            \`startDate\` datetime NOT NULL,
            \`endDate\` datetime NULL,
            \`status\` enum ('active', 'inactive', 'suspended', 'terminated') NOT NULL DEFAULT 'active',
            \`salary\` decimal(10,2) NULL,
            \`conditions\` text NULL,
            \`driverPersonId\` varchar(255) NULL,
            \`companyId\` int NULL,
            PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`contracts\` ADD CONSTRAINT \`FK_contracts_driver\` FOREIGN KEY (\`driverPersonId\`) REFERENCES \`drivers\`(\`person_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`contracts\` ADD CONSTRAINT \`FK_contracts_company\` FOREIGN KEY (\`companyId\`) REFERENCES \`companies\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Messages
        await queryRunner.query(`CREATE TABLE \`messages\` (
            \`id\` int NOT NULL AUTO_INCREMENT,
            \`content\` text NOT NULL,
            \`sent_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`sender_person_id\` varchar(255) NOT NULL,
            \`message_type\` enum ('personal', 'group') NOT NULL,
            PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`messages\` ADD CONSTRAINT \`FK_messages_sender\` FOREIGN KEY (\`sender_person_id\`) REFERENCES \`citizens\`(\`person_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Recipient Persons
        await queryRunner.query(`CREATE TABLE \`recipient_persons\` (
            \`id\` int NOT NULL AUTO_INCREMENT,
            \`message_id\` int NOT NULL,
            \`recipient_person_id\` varchar(255) NOT NULL,
            \`read_at\` timestamp NULL,
            PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`recipient_persons\` ADD CONSTRAINT \`FK_rp_message\` FOREIGN KEY (\`message_id\`) REFERENCES \`messages\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`recipient_persons\` ADD CONSTRAINT \`FK_rp_recipient\` FOREIGN KEY (\`recipient_person_id\`) REFERENCES \`citizens\`(\`person_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Groups
        await queryRunner.query(`CREATE TABLE \`groups\` (
            \`id\` int NOT NULL AUTO_INCREMENT,
            \`name\` varchar(255) NOT NULL,
            \`description\` text NULL,
            \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`created_by_person_id\` varchar(255) NOT NULL,
            PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`groups\` ADD CONSTRAINT \`FK_groups_created_by\` FOREIGN KEY (\`created_by_person_id\`) REFERENCES \`citizens\`(\`person_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Recipient Groups
        await queryRunner.query(`CREATE TABLE \`recipient_groups\` (
            \`id\` int NOT NULL AUTO_INCREMENT,
            \`message_id\` int NOT NULL,
            \`group_id\` int NOT NULL,
            \`delivered_at\` timestamp NULL,
            PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`recipient_groups\` ADD CONSTRAINT \`FK_rg_message\` FOREIGN KEY (\`message_id\`) REFERENCES \`messages\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`recipient_groups\` ADD CONSTRAINT \`FK_rg_group\` FOREIGN KEY (\`group_id\`) REFERENCES \`groups\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);

        // Group Persons
        await queryRunner.query(`CREATE TABLE \`group_persons\` (
            \`group_id\` int NOT NULL,
            \`person_id\` varchar(255) NOT NULL,
            \`joined_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`role\` enum ('admin', 'member') NOT NULL DEFAULT 'member',
            PRIMARY KEY (\`group_id\`, \`person_id\`)
        ) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`group_persons\` ADD CONSTRAINT \`FK_gp_group\` FOREIGN KEY (\`group_id\`) REFERENCES \`groups\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`group_persons\` ADD CONSTRAINT \`FK_gp_person\` FOREIGN KEY (\`person_id\`) REFERENCES \`citizens\`(\`person_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`group_persons\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`recipient_groups\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`groups\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`recipient_persons\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`messages\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`contracts\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`histories\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`tickets\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`citizen_payment_methods\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`payment_methods\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`drivers\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`addresses\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`citizens\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`nodes\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`route_stop\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`stops\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`routes\``);
    }
}
