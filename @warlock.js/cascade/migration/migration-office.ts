import type { Migration, RegisteredMigration } from "./types";

export class MigrationOffice {
  /**
   * Migrations list
   */
  protected migrations: RegisteredMigration[] = [];

  /**
   * Register a migration
   */
  public register(migration: Migration) {
    const registeredMigration = {
      ...migration,
      async executeUp() {
        const blueprint = migration.blueprint.clone();

        await migration.up(blueprint);

        await blueprint.execute();
      },
      async executeDown() {
        const blueprint = migration.blueprint.clone();

        await migration.down(blueprint);

        await blueprint.execute();
      },
    };

    this.migrations.push(registeredMigration);

    return this;
  }

  /**
   * Get all migrations
   */
  public list() {
    return this.migrations;
  }

  /**
   * Get blueprints only
   */
  public blueprints() {
    return this.migrations.map(migration => migration.blueprint);
  }
}

export const migrationOffice = new MigrationOffice();
