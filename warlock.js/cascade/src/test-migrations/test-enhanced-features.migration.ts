import { Migration } from "../migration/migration";

/**
 * Test migration to verify all new features:
 * - primaryUuid() shorthand
 * - default() with raw SQL
 * - defaultString() for literal strings
 * - timestamps() driver delegation
 * - statement() for raw SQL (queued operations)
 */
export default class TestEnhancedMigrationFeatures extends Migration {
  public table = "test_enhanced_features";

  public async up() {
    // Define columns directly
    this.primaryUuid(); // UUID PRIMARY KEY with gen_random_uuid()
    this.string("name", 100).notNullable();
    this.string("status").defaultString("active"); // Literal string default
    this.integer("version").default(1); // Numeric default
    this.boolean("is_enabled").default(true); // Boolean default
    this.timestamp("expires_at").default("NOW() + INTERVAL '30 days'"); // Raw SQL expression
    this.timestamps(); // Driver-delegated timestamp creation

    // Raw SQL statements (queued, not immediate)
    this.statement(
      "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_name ON test_enhanced_features (name)",
    );
    this.statement('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  }

  public async down() {
    await this.dropTableIfExists();
  }
}
