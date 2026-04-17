/**
 * Strict mode configuration for handling unknown fields during validation.
 *
 * Controls how the model behaves when encountering fields not defined in the schema.
 *
 * - `"strip"` - Remove unknown fields silently (default, recommended for APIs)
 * - `"fail"` - Throw validation error on unknown fields (strict validation)
 * - `"allow"` - Allow unknown fields to pass through (permissive)
 *
 * @example
 * ```typescript
 * import { Model, type StrictMode } from "@warlock.js/cascade";
 *
 * class User extends Model {
 *   public static strictMode: StrictMode = "fail";
 * }
 * ```
 */
export type StrictMode = "strip" | "fail" | "allow";

/**
 * Delete strategy for model destruction.
 *
 * Controls how models are deleted from the database:
 *
 * - `"trash"` - Moves document to a trash/recycle bin collection, then deletes
 * - `"permanent"` - Actually deletes the document from the database (hard delete)
 * - `"soft"` - Sets a `deletedAt` timestamp instead of deleting (soft delete)
 *
 * Priority order (highest to lowest):
 * 1. destroy() method options
 * 2. Model static property (deleteStrategy)
 * 3. Data source default configuration
 *
 * @example
 * ```typescript
 * class User extends Model {
 *   public static deleteStrategy: DeleteStrategy = "soft";
 * }
 *
 * // Override at call time
 * await user.destroy({ strategy: "permanent" });
 * ```
 */
export type DeleteStrategy = "trash" | "permanent" | "soft";

/**
 * Naming convention for database column names.
 *
 * Different databases have different naming conventions:
 * - `"camelCase"` - MongoDB standard (createdAt, updatedAt, deletedAt)
 * - `"snake_case"` - PostgreSQL/MySQL standard (created_at, updated_at, deleted_at)
 *
 * This affects default column names for timestamps and other system columns.
 *
 * @example
 * ```typescript
 * // PostgreSQL driver defaults
 * namingConvention: "snake_case"
 * // Results in: created_at, updated_at, deleted_at
 *
 * // MongoDB driver defaults
 * namingConvention: "camelCase"
 * // Results in: createdAt, updatedAt, deletedAt
 * ```
 */
export type NamingConvention = "camelCase" | "snake_case";

/**
 * Unified model default configuration.
 *
 * These settings define default behaviors for models. The configuration
 * follows a 4-tier hierarchy (highest to lowest precedence):
 *
 * 1. Model static property (explicit override)
 * 2. Database config modelDefaults
 * 3. Driver defaults (SQL vs NoSQL conventions)
 * 4. Framework defaults (fallback values)
 *
 * @example
 * ```typescript
 * // PostgreSQL driver provides defaults:
 * const postgresDefaults: ModelDefaults = {
 *   namingConvention: "snake_case",
 *   createdAtColumn: "created_at",
 *   updatedAtColumn: "updated_at",
 *   deletedAtColumn: "deleted_at",
 *   timestamps: true,
 *   autoGenerateId: false, // SQL handles this
 * };
 *
 * // Override in database config:
 * {
 *   modelDefaults: {
 *     randomIncrement: true,
 *     initialId: 1000,
 *     deleteStrategy: "soft",
 *   }
 * }
 *
 * // Override in specific model:
 * class User extends Model {
 *   public static createdAtColumn = "creation_date"; // Highest priority
 *   public static updatedAtColumn = false; // Disable updatedAt
 * }
 * ```
 */
export type ModelDefaults = {
  // ============================================================================
  // ID Generation (NoSQL only)
  // ============================================================================

  /**
   * Auto-generate incremental `id` field on insert (NoSQL only).
   *
   * When enabled, the ID generator creates a sequential integer ID
   * separate from the database's native ID (_id for MongoDB).
   *
   * **Note:** SQL databases use native AUTO_INCREMENT and don't need this.
   *
   * @default true (MongoDB), false (PostgreSQL)
   */
  autoGenerateId?: boolean;

  /**
   * Initial ID value for the first record.
   *
   * @default 1
   *
   * @example
   * ```typescript
   * initialId: 1000 // Start from 1000
   * ```
   */
  initialId?: number;

  /**
   * Randomly generate the initial ID.
   *
   * Can be:
   * - `true`: Generate random ID between 10000-499999
   * - Function: Custom random ID generator
   * - `false`: Use `initialId` or default to 1
   *
   * @default false
   *
   * @example
   * ```typescript
   * randomInitialId: true // Random 10000-499999
   * randomInitialId: () => Math.floor(Math.random() * 1000000)
   * ```
   */
  randomInitialId?: boolean | (() => number);

  /**
   * Amount to increment ID by for each new record.
   *
   * @default 1
   *
   * @example
   * ```typescript
   * incrementIdBy: 5 // Increment by 5
   * ```
   */
  incrementIdBy?: number;

  /**
   * Randomly generate the increment amount.
   *
   * Can be:
   * - `true`: Generate random increment between 1-10
   * - Function: Custom random increment generator
   * - `false`: Use `incrementIdBy` or default to 1
   *
   * @default false
   *
   * @example
   * ```typescript
   * randomIncrement: true // Random 1-10
   * randomIncrement: () => Math.floor(Math.random() * 100)
   * ```
   */
  randomIncrement?: boolean | (() => number);

  // ============================================================================
  // Timestamps
  // ============================================================================

  /**
   * Enable/disable automatic timestamp management.
   *
   * When enabled, createdAt and updatedAt are automatically managed.
   * When disabled, no timestamps are added.
   *
   * @default true
   */
  timestamps?: boolean;

  /**
   * Column name for creation timestamp.
   *
   * Set to `false` to disable createdAt entirely.
   *
   * @default "createdAt" (MongoDB), "created_at" (PostgreSQL)
   *
   * @example
   * ```typescript
   * createdAtColumn: "creation_date"
   * createdAtColumn: false // Disable
   * ```
   */
  createdAtColumn?: string | false;

  /**
   * Column name for update timestamp.
   *
   * Set to `false` to disable updatedAt entirely.
   *
   * @default "updatedAt" (MongoDB), "updated_at" (PostgreSQL)
   *
   * @example
   * ```typescript
   * updatedAtColumn: "last_modified"
   * updatedAtColumn: false // Disable
   * ```
   */
  updatedAtColumn?: string | false;

  // ============================================================================
  // Deletion
  // ============================================================================

  /**
   * Delete strategy for this model.
   *
   * Controls how models are deleted:
   * - `"trash"` - Moves to trash collection, then deletes
   * - `"permanent"` - Direct deletion (hard delete)
   * - `"soft"` - Sets deletedAt timestamp (soft delete)
   *
   * @default "permanent"
   *
   * @example
   * ```typescript
   * deleteStrategy: "soft"
   * ```
   */
  deleteStrategy?: DeleteStrategy;

  /**
   * Column name for soft delete timestamp.
   *
   * Used when delete strategy is "soft".
   * Set to `false` to use a different mechanism.
   *
   * @default "deletedAt" (MongoDB), "deleted_at" (PostgreSQL)
   *
   * @example
   * ```typescript
   * deletedAtColumn: "archived_at"
   * ```
   */
  deletedAtColumn?: string | false;

  /**
   * Trash table/collection name override.
   *
   * Can be:
   * - String: Fixed name for all models
   * - Function: Generate trash table name based on model table
   * - `undefined`: Use default pattern `{table}Trash`
   *
   * Used when delete strategy is "trash".
   *
   * @default undefined (uses {table}Trash pattern)
   *
   * @example
   * ```typescript
   * trashTable: "RecycleBin" // All models use same trash
   * trashTable: (table) => `archive_${table}` // Dynamic naming
   * ```
   */
  trashTable?: string | ((tableName: string) => string);

  // ============================================================================
  // Validation
  // ============================================================================

  /**
   * Strict mode behavior for unknown fields.
   *
   * - `"strip"`: Remove unknown fields silently (default)
   * - `"fail"`: Throw validation error on unknown fields
   * - `"allow"`: Allow unknown fields to pass through
   *
   * @default "strip"
   *
   * @example
   * ```typescript
   * strictMode: "fail" // Strict validation
   * ```
   */
  strictMode?: StrictMode;

  // ============================================================================
  // Conventions
  // ============================================================================

  /**
   * Naming convention for database column names.
   *
   * Affects default names for timestamps and other system columns.
   *
   * @default "camelCase" (MongoDB), "snake_case" (PostgreSQL)
   *
   * @example
   * ```typescript
   * namingConvention: "snake_case"
   * // Results in: created_at, updated_at, deleted_at
   * ```
   */
  namingConvention?: NamingConvention;
};

// ============================================================================
// Migration Defaults
// ============================================================================

/**
 * UUID generation strategy for primary keys.
 *
 * Each driver maps this to its native expression:
 * - `"v4"`: PG → `gen_random_uuid()` (PG 13+), MySQL → `UUID()`
 * - `"v7"`: PG → `uuid_generate_v7()` (PG 18+)
 *
 * @example
 * ```typescript
 * // In database config
 * migrationDefaults: {
 *   uuidStrategy: "v7", // Use UUID v7 (PG 18+)
 * }
 * ```
 */
export type UuidStrategy = "v4" | "v7";

/**
 * Migration-level defaults configurable per data source.
 *
 * These settings affect DDL operations (schema changes) and are
 * separate from runtime model behavior (`ModelDefaults`).
 *
 * The configuration follows a 3-tier hierarchy (highest to lowest):
 * 1. Inline migration call (explicit `.default("...")`)
 * 2. DataSource `migrationDefaults` (this type)
 * 3. Driver migration defaults (e.g., PG defaults to v4)
 *
 * @example
 * ```typescript
 * // Use UUID v7 for all migrations on this data source
 * migrationDefaults: {
 *   uuidStrategy: "v7",
 * }
 *
 * // Use a custom UUID extension
 * migrationDefaults: {
 *   uuidExpression: "uuid_generate_v1mc()",
 * }
 * ```
 */
export type MigrationDefaults = {
  /**
   * UUID generation strategy for `primaryUuid()` migration shortcut.
   * Each driver maps this to its native SQL/expression.
   *
   * @default "v4"
   */
  uuidStrategy?: UuidStrategy;

  /**
   * Raw SQL/expression override for UUID generation.
   * Takes precedence over `uuidStrategy` when set.
   *
   * Use for custom extensions (e.g., `uuid-ossp`, `pgcrypto`)
   * or non-standard UUID generation functions.
   *
   * @example "uuid_generate_v1mc()"
   */
  uuidExpression?: string;

  /**
   * Default primary key type for `Migration.create()`.
   *
   * Controls which primary key column is automatically added when using
   * the declarative `Migration.create()` factory. Individual migrations
   * can still override this by passing `{ primaryKey: false }` in options.
   *
   * - `"uuid"` — UUID primary key via `primaryUuid()` (default for PostgreSQL)
   * - `"int"` — Auto-increment integer via `id()`
   * - `"bigInt"` — Big auto-increment integer via `bigId()`
   *
   * @default "int"
   *
   * @example
   * ```typescript
   * // src/config/database.ts
   * migrationOptions: {
   *   uuidStrategy: "v7",
   *   primaryKey: "uuid",
   * }
   * ```
   */
  primaryKey?: "uuid" | "int" | "bigInt";
};
