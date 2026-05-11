import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsActiveToCitizensAndDrivers1778474142810 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE citizens ADD COLUMN isActive tinyint NOT NULL DEFAULT 1;`,
    );
    await queryRunner.query(
      `ALTER TABLE drivers ADD COLUMN isActive tinyint NOT NULL DEFAULT 1;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
