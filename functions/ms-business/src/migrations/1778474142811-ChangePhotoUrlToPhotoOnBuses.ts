import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangePhotoUrlToPhotoOnBuses1778474142811 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Cambiar la columna photoUrl (varchar) a photo (longtext) para guardar la foto en base64
    await queryRunner.query(
      `ALTER TABLE buses CHANGE COLUMN photoUrl photo LONGTEXT DEFAULT NULL;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE buses CHANGE COLUMN photo photoUrl VARCHAR(255) DEFAULT NULL;`,
    );
  }
}
