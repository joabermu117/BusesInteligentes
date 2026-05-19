import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Auto-generated migration to sync entity changes:
 * - photos.url is already longtext, but entity says longtext — safe MODIFY
 * - companies.emailSupervisor doesn't exist in entity — DROP if exists
 * - schedules.routeId needs FK to routes.id — ADD if missing
 * All operations use IF-checks so the migration is idempotent.
 */
export class FixPhotosAndSchedules1779204972092 implements MigrationInterface {
  name = 'FixPhotosAndSchedules1779204972092';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Ensure photos.url is LONGTEXT (base64 support)
    const photosUrlInfo = await queryRunner.query(
      `SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'photos' AND COLUMN_NAME = 'url'`,
    );
    if (photosUrlInfo.length > 0 && photosUrlInfo[0].DATA_TYPE !== 'longtext') {
      await queryRunner.query(
        `ALTER TABLE photos MODIFY COLUMN url LONGTEXT NOT NULL`,
      );
    }

    // 2. Drop emailSupervisor from companies if present (not in entity)
    const hasEmailSupervisor = await queryRunner.query(
      `SHOW COLUMNS FROM companies LIKE 'emailSupervisor'`,
    );
    if (hasEmailSupervisor.length > 0) {
      await queryRunner.query(
        `ALTER TABLE companies DROP COLUMN emailSupervisor`,
      );
    }

    // 3. Add FK schedules.routeId → routes.id if not already there
    const fkExists = await queryRunner.query(
      `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'schedules' AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME != 'PRIMARY'`,
    );
    const hasRouteFk =
      Array.isArray(fkExists) &&
      fkExists.some((r: any) =>
        r.CONSTRAINT_NAME?.toLowerCase().includes('route'),
      );
    if (!hasRouteFk) {
      // Check routeId column exists
      const hasRouteId = await queryRunner.query(
        `SHOW COLUMNS FROM schedules LIKE 'routeId'`,
      );
      if (hasRouteId.length > 0) {
        await queryRunner.query(
          `ALTER TABLE schedules ADD CONSTRAINT FK_schedules_route FOREIGN KEY (routeId) REFERENCES routes(id) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE schedules DROP FOREIGN KEY FK_schedules_route`,
    );
    await queryRunner.query(
      `ALTER TABLE companies ADD emailSupervisor varchar(255) DEFAULT NULL`,
    );
  }
}
