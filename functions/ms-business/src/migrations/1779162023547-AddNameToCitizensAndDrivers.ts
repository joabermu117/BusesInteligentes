import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNameToCitizensAndDrivers1779162023547 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE citizens ADD COLUMN name varchar(255) NULL;`,
    );
    await queryRunner.query(
      `ALTER TABLE drivers ADD COLUMN name varchar(255) NULL;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE citizens DROP COLUMN name;`,
    );
    await queryRunner.query(
      `ALTER TABLE drivers DROP COLUMN name;`,
    );
  }
}
