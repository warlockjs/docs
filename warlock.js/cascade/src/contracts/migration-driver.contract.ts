import type { DataSource } from "../data-source/data-source";
import type { MigrationDefaults } from "../types";
import type { DriverContract } from "./database-driver.contract";
import type { TableIndexInformation } from "./driver-blueprint.contract";
export type { TableIndexInformation };

/**
 * Column data types supported across all database drivers.
 */
export type ColumnType =
  | "string"
  | "char"
  | "text"
  | "mediumText"
  | "longText"
  | "integer"
  | "smallInteger"
  | "tinyInteger"
  | "bigInteger"
  | "float"
  | "double"
  | "decimal"
  | "boolean"
  | "date"
  | "dateTime"
  | "timestamp"
  | "time"
  | "year"
  | "json"
  | "binary"
  | "uuid"
  | "ulid"
  | "ipAddress"
  | "macAddress"
  | "point"
  | "polygon"
  | "lineString"
  | "geometry"
  | "vector"
  | "enum"
  | "set"
  // PostgreSQL array types
  | "arrayInt"
  | "arrayBigInt"
  | "arrayFloat"
  | "arrayDecimal"
  | "arrayBoolean"
  | "arrayText"
  | "arrayDate"
  | "arrayTimestamp"
  | "arrayUuid";

/**
 * Column definition used when adding or modifying columns.
 */
export type ColumnDefinition = {
  /** Column name */
  name: string;
  /** Column data type */
  type: ColumnType;
  /** Length for string/char types */
  length?: number;
  /** Precision for decimal types */
  precision?: number;
  /** Scale for decimal types */
  scale?: number;
  /** Whether the column allows NULL values */
  nullable?: boolean;
  /** Default value for the column (can be a primitive, SQL string, or {__type: 'CURRENT_TIMESTAMP'}) */
  defaultValue?: unknown;
  /** MySQL: ON UPDATE CURRENT_TIMESTAMP */
  onUpdateCurrent?: boolean;
  /** Whether this is a primary key */
  primary?: boolean;
  /** Whether this column auto-increments */
  autoIncrement?: boolean;
  /** Whether this column must be unsigned (numeric only) */
  unsigned?: boolean;
  /** Whether this column has a unique constraint */
  unique?: boolean;
  /** Column comment/description */
  comment?: string;
  /** Enum/set values */
  values?: string[];
  /** Vector dimensions (for vector type) */
  dimensions?: number;
  /** Whether defaultValue should be treated as raw SQL (true) or escaped literal (false) */
  isRawDefault?: boolean;

  // Column positioning (MySQL/MariaDB only)
  /** Position this column after another column */
  after?: string;
  /** Position this column as the first column in the table */
  first?: boolean;

  // Generated columns
  /** Generated column configuration */
  generated?: {
    /** SQL expression to compute the value */
    expression: string;
    /** true = STORED (persisted), false = VIRTUAL (computed on read) */
    stored: boolean;
  };

  /** Inline CHECK constraint on this column */
  checkConstraint?: {
    expression: string;
    name: string;
  };
};

/**
 * Index definition for creating database indexes.
 */
export type IndexDefinition = {
  /** Index name (auto-generated if not provided) */
  readonly name?: string;
  /** Columns included in the index */
  readonly columns: string[];
  /** Whether this is a unique index */
  readonly unique?: boolean;
  /** Index type (driver-specific) */
  readonly type?: string;
  /** Partial index condition */
  readonly where?: Record<string, unknown>;
  /** Whether to create sparse index (MongoDB) */
  readonly sparse?: boolean;
  /** Sort direction for each column */
  readonly directions?: Array<"asc" | "desc">;
  /** Expression-based index (PostgreSQL) - e.g., ['lower(email)', 'upper(name)'] */
  readonly expressions?: string[];
  /** Covering index columns (PostgreSQL INCLUDE clause) */
  readonly include?: string[];
  /** Create index concurrently without blocking writes (PostgreSQL) */
  readonly concurrently?: boolean;
};

/**
 * Full-text search index options.
 */
export type FullTextIndexOptions = {
  /** Index name */
  readonly name?: string;
  /** Language for text analysis */
  readonly language?: string;
  /** Field weights for relevance scoring */
  readonly weights?: Record<string, number>;
};

/**
 * Geo-spatial index options.
 */
export type GeoIndexOptions = {
  /** Index name */
  readonly name?: string;
  /** Index type: "2dsphere" (default) or "2d" */
  readonly type?: "2dsphere" | "2d";
  /** Minimum bound for 2d index */
  readonly min?: number;
  /** Maximum bound for 2d index */
  readonly max?: number;
};

/**
 * Vector index options for AI/ML embeddings.
 */
export type VectorIndexOptions = {
  /** Vector dimensions (e.g., 1536 for OpenAI) */
  readonly dimensions: number;
  /** Similarity metric */
  readonly similarity?: "cosine" | "euclidean" | "dotProduct";
  /** Index name */
  readonly name?: string;
  /** Number of lists/clusters (IVF) */
  readonly lists?: number;
};

/**
 * Foreign key constraint definition (SQL only).
 */
export type ForeignKeyDefinition = {
  /** Constraint name */
  readonly name?: string;
  /** Local column name */
  readonly column: string;
  /** Referenced table */
  readonly referencesTable: string;
  /** Referenced column */
  readonly referencesColumn: string;
  /** Action on delete */
  readonly onDelete?: "cascade" | "restrict" | "setNull" | "noAction";
  /** Action on update */
  readonly onUpdate?: "cascade" | "restrict" | "setNull" | "noAction";
};

/**
 * Contract that all migration drivers must implement.
 *
 * Each database driver provides its own implementation that translates
 * the abstract operations to native database commands.
 *
 * @example
 * ```typescript
 * const driver = new MongoMigrationDriver(dataSource);
 * await driver.createIndex("users", { columns: ["email"], unique: true });
 * ```
 */
export interface MigrationDriverContract {
  // ============================================================================
  // TABLE/COLLECTION OPERATIONS
  // ============================================================================

  /**
   * Create a new table or collection.
   *
   * @param table - Table/collection name
   */
  createTable(table: string): Promise<void>;

  /**
   * Create a new table or collection if it doesn't exist.
   *
   * @param table - Table/collection name
   */
  createTableIfNotExists(table: string): Promise<void>;

  /**
   * Drop an existing table or collection.
   *
   * @param table - Table/collection name
   */
  dropTable(table: string): Promise<void>;

  /**
   * Drop table if it exists (no error if missing).
   *
   * @param table - Table/collection name
   */
  dropTableIfExists(table: string): Promise<void>;

  /**
   * Rename a table or collection.
   *
   * @param from - Current table name
   * @param to - New table name
   */
  renameTable(from: string, to: string): Promise<void>;

  /**
   * Truncate a table — remove all rows efficiently.
   *
   * @param table - Table name
   */
  truncateTable(table: string): Promise<void>;

  /**
   * Check if a table or collection exists.
   *
   * @param table - Table/collection name
   * @returns True if table exists
   */
  tableExists(table: string): Promise<boolean>;

  /**
   * List all columns in a table.
   *
   * @param table - Table name
   * @returns Array of column definitions
   */
  listColumns(table: string): Promise<ColumnDefinition[]>;

  /**
   * List all tables in the current database/connection.
   *
   * @returns Array of table names
   */
  listTables(): Promise<string[]>;

  /**
   * Ensure the migrations tracking table exists.
   *
   * Creates the table with appropriate columns if it doesn't exist:
   * - `name` (string, unique) - Migration name
   * - `batch` (integer) - Batch number
   * - `executedAt` (timestamp) - When the migration was executed
   * - `createdAt` (timestamp, optional) - Migration creation date
   *
   * @param tableName - Name of the migrations table (default: "_migrations")
   */
  ensureMigrationsTable(tableName: string): Promise<void>;

  // ============================================================================
  // COLUMN OPERATIONS
  // ============================================================================

  /**
   * Add a column to an existing table.
   *
   * Note: This is a no-op for schema-less databases like MongoDB.
   *
   * @param table - Table name
   * @param column - Column definition
   */
  addColumn(table: string, column: ColumnDefinition): Promise<void>;

  /**
   * Drop a column from an existing table.
   *
   * Note: For MongoDB, this optionally runs $unset on all documents.
   *
   * @param table - Table name
   * @param column - Column name to drop
   */
  dropColumn(table: string, column: string): Promise<void>;

  /**
   * Drop multiple columns from an existing table.
   *
   * @param table - Table name
   * @param columns - Column names to drop
   */
  dropColumns(table: string, columns: string[]): Promise<void>;

  /**
   * Rename a column.
   *
   * @param table - Table name
   * @param from - Current column name
   * @param to - New column name
   */
  renameColumn(table: string, from: string, to: string): Promise<void>;

  /**
   * Modify an existing column's definition.
   *
   * @param table - Table name
   * @param column - New column definition (name must match existing)
   */
  modifyColumn(table: string, column: ColumnDefinition): Promise<void>;

  /**
   * Create standard timestamp columns (created_at, updated_at).
   *
   * Implementation varies by database driver:
   * - PostgreSQL: Creates TIMESTAMPTZ columns with NOW() defaults
   * - MongoDB: No-op or schema validation (application handles timestamps)
   *
   * @param table - Table name
   */
  createTimestampColumns(table: string): Promise<void>;

  // ============================================================================
  // INDEX OPERATIONS
  // ============================================================================

  /**
   * Create an index on one or more columns.
   *
   * @param table - Table name
   * @param index - Index definition
   */
  createIndex(table: string, index: IndexDefinition): Promise<void>;

  /**
   * Drop an index by name or columns.
   *
   * @param table - Table name
   * @param indexNameOrColumns - Index name (string) or columns array
   */
  dropIndex(table: string, indexNameOrColumns: string | string[]): Promise<void>;

  /**
   * Create a unique index/constraint.
   *
   * @param table - Table name
   * @param columns - Columns to include
   * @param name - Optional index name
   */
  createUniqueIndex(table: string, columns: string[], name?: string): Promise<void>;

  /**
   * Drop a unique index/constraint.
   *
   * @param table - Table name
   * @param columns - Columns in the index (used to find it)
   */
  dropUniqueIndex(table: string, columns: string[]): Promise<void>;

  // ============================================================================
  // SPECIALIZED INDEXES
  // ============================================================================

  /**
   * Create a full-text search index.
   *
   * @param table - Table name
   * @param columns - Columns to index
   * @param options - Full-text options
   */
  createFullTextIndex(
    table: string,
    columns: string[],
    options?: FullTextIndexOptions,
  ): Promise<void>;

  /**
   * Drop a full-text search index.
   *
   * @param table - Table name
   * @param name - Index name
   */
  dropFullTextIndex(table: string, name: string): Promise<void>;

  /**
   * Create a geo-spatial index.
   *
   * @param table - Table name
   * @param column - Geo column
   * @param options - Geo index options
   */
  createGeoIndex(table: string, column: string, options?: GeoIndexOptions): Promise<void>;

  /**
   * Drop a geo-spatial index.
   *
   * @param table - Table name
   * @param column - Geo column (used to find index)
   */
  dropGeoIndex(table: string, column: string): Promise<void>;

  /**
   * Create a vector search index for AI embeddings.
   *
   * @param table - Table name
   * @param column - Vector column
   * @param options - Vector index options
   */
  createVectorIndex(table: string, column: string, options: VectorIndexOptions): Promise<void>;

  /**
   * Drop a vector search index.
   *
   * @param table - Table name
   * @param column - Vector column
   */
  dropVectorIndex(table: string, column: string): Promise<void>;

  /**
   * Create a TTL (time-to-live) index for automatic document expiration.
   *
   * Note: Primarily for MongoDB. SQL databases may throw "not supported".
   *
   * @param table - Table name
   * @param column - Date column to check for expiration
   * @param expireAfterSeconds - Seconds after which documents expire
   */
  createTTLIndex(table: string, column: string, expireAfterSeconds: number): Promise<void>;

  /**
   * Drop a TTL index.
   *
   * @param table - Table name
   * @param column - Column with TTL index
   */
  dropTTLIndex(table: string, column: string): Promise<void>;

  /**
   * List all indexes on a table.
   *
   * @param table - Table name
   * @returns Array of index metadata
   */
  listIndexes(table: string): Promise<TableIndexInformation[]>;

  // ============================================================================
  // CONSTRAINTS (SQL)
  // ============================================================================

  /**
   * Add a foreign key constraint.
   *
   * Note: No-op for MongoDB.
   *
   * @param table - Table name
   * @param foreignKey - Foreign key definition
   */
  addForeignKey(table: string, foreignKey: ForeignKeyDefinition): Promise<void>;

  /**
   * Drop a foreign key constraint.
   *
   * @param table - Table name
   * @param name - Constraint name
   */
  dropForeignKey(table: string, name: string): Promise<void>;

  /**
   * Add a primary key constraint.
   *
   * @param table - Table name
   * @param columns - Primary key columns
   */
  addPrimaryKey(table: string, columns: string[]): Promise<void>;

  /**
   * Drop the primary key constraint.
   *
   * @param table - Table name
   */
  dropPrimaryKey(table: string): Promise<void>;

  /**
   * Add a CHECK constraint.
   *
   * Validates that all rows satisfy the given SQL expression.
   *
   * @param table - Table name
   * @param name - Constraint name
   * @param expression - SQL CHECK expression
   */
  addCheck(table: string, name: string, expression: string): Promise<void>;

  /**
   * Drop a CHECK constraint.
   *
   * @param table - Table name
   * @param name - Constraint name
   */
  dropCheck(table: string, name: string): Promise<void>;

  // ============================================================================
  // SCHEMA VALIDATION (NoSQL)
  // ============================================================================

  /**
   * Set JSON schema validation rules on a collection.
   *
   * Note: Primarily for MongoDB. SQL databases ignore this.
   *
   * @param table - Collection name
   * @param schema - JSON Schema object
   */
  setSchemaValidation(table: string, schema: object): Promise<void>;

  /**
   * Remove schema validation rules from a collection.
   *
   * @param table - Collection name
   */
  removeSchemaValidation(table: string): Promise<void>;

  // ============================================================================
  // TRANSACTIONS
  // ============================================================================

  /**
   * Begin a database transaction.
   */
  beginTransaction(): Promise<void>;

  /**
   * Commit the current transaction.
   */
  commit(): Promise<void>;

  /**
   * Rollback the current transaction.
   */
  rollback(): Promise<void>;

  /**
   * Whether the driver supports transactions.
   */
  supportsTransactions(): boolean;

  /**
   * Get the default transactional behavior for this driver.
   *
   * This determines whether migrations should be wrapped in transactions
   * by default when no explicit configuration is provided.
   *
   * - **PostgreSQL**: Returns `true` (DDL operations are transactional)
   * - **MongoDB**: Returns `false` (DDL operations cannot be transactional)
   *
   * Can be overridden by:
   * 1. Migration-level `transactional` property
   * 2. Config-level `migrations.transactional` option
   *
   * @returns true if migrations should be transactional by default
   */
  getDefaultTransactional(): boolean;

  // ============================================================================
  // DEFAULTS
  // ============================================================================

  /**
   * Get the default UUID generation expression for this driver.
   *
   * Used by `Migration.primaryUuid()` to set driver-appropriate defaults.
   * SQL drivers return a native expression (e.g., `gen_random_uuid()`).
   * NoSQL drivers return `undefined` (application-level UUID generation).
   *
   * @param migrationDefaults - Optional overrides from DataSource config
   * @returns SQL expression string, or undefined for schema-less DBs
   *
   * @example
   * ```typescript
   * // PostgreSQL with default v4
   * driver.getUuidDefault(); // "gen_random_uuid()"
   *
   * // PostgreSQL with v7 override
   * driver.getUuidDefault({ uuidStrategy: "v7" }); // "uuid_generate_v7()"
   *
   * // PostgreSQL with raw expression escape hatch
   * driver.getUuidDefault({ uuidExpression: "uuid_generate_v1mc()" });
   * // "uuid_generate_v1mc()"
   *
   * // MongoDB
   * driver.getUuidDefault(); // undefined
   * ```
   */
  getUuidDefault(migrationDefaults?: MigrationDefaults): string | undefined;

  // ============================================================================
  // EXTENSIONS
  // ============================================================================

  /**
   * Check if a database extension/plugin is available on the database server.
   *
   * @param extension - Name of the extension
   * @returns true if available, or if the database doesn't require explicit extension installation
   */
  isExtensionAvailable(extension: string): Promise<boolean>;

  /**
   * Get the official documentation or installation URL for a database extension.
   *
   * @param extension - Extension name
   * @returns URL string, or undefined to fall back to a generic search approach
   */
  getExtensionDocsUrl(extension: string): string | undefined;

  // ============================================================================
  // RAW ACCESS
  // ============================================================================

  /**
   * Execute raw operations with direct driver access.
   *
   * @param callback - Callback receiving the native driver/connection
   * @returns Result from callback
   */
  raw<T>(callback: (connection: unknown) => Promise<T>): Promise<T>;

  /**
   * Get database driver
   */
  driver: DriverContract;
}

/**
 * Factory function type for creating migration drivers.
 */
export type MigrationDriverFactory = (
  source: DataSource | DriverContract,
) => MigrationDriverContract;
