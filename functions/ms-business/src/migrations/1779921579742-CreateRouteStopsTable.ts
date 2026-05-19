import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * This migration is no longer needed.
 * The route_stop table was already created with a composite PK (route_id, stop_id)
 * in migration 1777860958019-AddBusinessTables, which matches the RouteStop entity.
 * Keeping this file as a no-op to avoid breaking the migration chain.
 */
export class CreateRouteStopsTable1779921579742 implements MigrationInterface {
  name = 'CreateRouteStopsTable1779921579742';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Table already exists with correct structure — nothing to do
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Nothing to revert
  }
}
