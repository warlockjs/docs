import type {
  ColumnDefinition,
  ForeignKeyDefinition,
  FullTextIndexOptions,
  GeoIndexOptions,
  IndexDefinition,
  MigrationDriverContract,
  TableIndexInformation,
  VectorIndexOptions,
} from "../contracts/migration-driver.contract";
import type { DataSource } from "../data-source/data-source";
import type { ChildModel, Model } from "../model/model";
import type { MigrationDefaults } from "../types";
import { DatabaseDriver } from "../utils/connect-to-database";
import { ColumnBuilder } from "./column-builder";
import { ForeignKeyBuilder } from "./foreign-key-builder";

/**
 * Pending operation types supported by migrations.
 */
export type OperationType =
  | "addColumn"
  | "dropColumn"
  | "dropColumns"
  | "renameColumn"
  | "modifyColumn"
  | "createIndex"
  | "dropIndex"
  | "createUniqueIndex"
  | "dropUniqueIndex"
  | "createFullTextIndex"
  | "dropFullTextIndex"
  | "createGeoIndex"
  | "dropGeoIndex"
  | "createVectorIndex"
  | "dropVectorIndex"
  | "createTTLIndex"
  | "dropTTLIndex"
  | "addForeignKey"
  | "dropForeignKey"
  | "addPrimaryKey"
  | "dropPrimaryKey"
  | "addCheck"
  | "dropCheck"
  | "createTable"
  | "createTableIfNotExists"
  | "dropTable"
  | "dropTableIfExists"
  | "renameTable"
  | "truncateTable"
  | "createTimestamps"
  | "rawStatement"
  | "setSchemaValidation"
  | "removeSchemaValidation";

/**
 * Pending operation to be executed when migration runs.
 */
export type PendingOperation = {
  readonly type: OperationType;
  readonly payload: unknown;
};

/**
 * Contract for a migration class.
 */
export interface MigrationContract {
  /**
   * Table/collection name for this migration.
   */
  readonly table: string;

  /**
   * Optional data source override.
   */
  readonly dataSource?: string | DataSource;

  /**
   * Whether to wrap migration in a transaction.
   */
  readonly transactional?: boolean;

  /**
   * Define schema changes for the up migration.
   */
  up(): void | Promise<void>;

  /**
   * Define rollback operations for the down migration.
   */
  down(): void | Promise<void>;

  /**
   * Set the migration driver.
   *
   * @param driver - Migration driver instance
   * @internal
   */
  setDriver(driver: MigrationDriverContract): void;

  /**
   * Set migration defaults from the resolved DataSource.
   *
   * @param defaults - Migration defaults (UUID strategy, etc.)
   * @internal
   */
  setMigrationDefaults(defaults?: MigrationDefaults): void;

  /**
   * Get the migration driver.
   *
   * @returns The migration driver instance
   */
  getDriver(): MigrationDriverContract;

  /**
   * Execute all pending operations.
   *
   * @internal
   */
  execute(): Promise<void>;

  /**
   * Add a pending index definition.
   *
   * @param index - Index definition
   * @internal
   */
  addPendingIndex(index: IndexDefinition): void;

  /**
   * Add a foreign key operation.
   *
   * @param fk - Foreign key definition
   * @internal
   */
  addForeignKeyOperation(fk: ForeignKeyDefinition): void;

  /**
   * Create the table/collection.
   */
  createTable(): MigrationContract;

  /**
   * Create table if not exists
   */
  createTableIfNotExists(): MigrationContract;

  /**
   * Drop the table/collection.
   */
  dropTable(): MigrationContract;

  /**
   * Drop the table/collection if it exists.
   */
  dropTableIfExists(): MigrationContract;

  /**
   * Rename the table/collection.
   *
   * @param newName - New table name
   */
  renameTableTo(newName: string): MigrationContract;

  /**
   * Truncate the table — remove all rows without logging or firing triggers.
   */
  truncateTable(): MigrationContract;

  /**
   * Add a string/varchar column.
   */
  string(column: string, length?: number): ColumnBuilder;

  /**
   * Add a fixed-length char column.
   */
  char(column: string, length: number): ColumnBuilder;

  /**
   * Add a text column (unlimited length).
   */
  text(column: string): ColumnBuilder;

  /**
   * Add a medium text column.
   */
  mediumText(column: string): ColumnBuilder;

  /**
   * Add a long text column.
   */
  longText(column: string): ColumnBuilder;

  /**
   * Add an integer column.
   */
  integer(column: string): ColumnBuilder;

  /**
   * Alias for integer().
   */
  int(column: string): ColumnBuilder;

  /**
   * Add a small integer column.
   */
  smallInteger(column: string): ColumnBuilder;

  /**
   * Alias for smallInteger().
   */
  smallInt(column: string): ColumnBuilder;

  /**
   * Add a tiny integer column.
   */
  tinyInteger(column: string): ColumnBuilder;

  /**
   * Alias for tinyInteger().
   */
  tinyInt(column: string): ColumnBuilder;

  /**
   * Add a big integer column.
   */
  bigInteger(column: string): ColumnBuilder;

  /**
   * Alias for bigInteger().
   */
  bigInt(column: string): ColumnBuilder;

  /**
   * Add a float column.
   */
  float(column: string): ColumnBuilder;

  /**
   * Add a double precision column.
   */
  double(column: string): ColumnBuilder;

  /**
   * Add a decimal column with precision and scale.
   */
  decimal(column: string, precision?: number, scale?: number): ColumnBuilder;

  /**
   * Add a boolean column.
   */
  boolean(column: string): ColumnBuilder;

  /**
   * Alias for boolean().
   */
  bool(column: string): ColumnBuilder;

  /**
   * Add a date column (date only, no time).
   */
  date(column: string): ColumnBuilder;

  /**
   * Add a datetime column (date and time).
   */
  dateTime(column: string): ColumnBuilder;

  /**
   * Add a timestamp column.
   */
  timestamp(column: string): ColumnBuilder;

  /**
   * Add a time column (time only, no date).
   */
  time(column: string): ColumnBuilder;

  /**
   * Add a year column.
   */
  year(column: string): ColumnBuilder;

  /**
   * Add a JSON column.
   */
  json(column: string): ColumnBuilder;

  /**
   * Alias for json().
   */
  object(column: string): ColumnBuilder;

  /**
   * Add a binary/blob column.
   */
  binary(column: string): ColumnBuilder;

  /**
   * Alias for binary().
   */
  blob(column: string): ColumnBuilder;

  /**
   * Add a UUID column.
   */
  uuid(column: string): ColumnBuilder;

  /**
   * Add a ULID column.
   */
  ulid(column: string): ColumnBuilder;

  /**
   * Add an IP address column.
   */
  ipAddress(column: string): ColumnBuilder;

  /**
   * Add a MAC address column.
   */
  macAddress(column: string): ColumnBuilder;

  /**
   * Add a geo point column.
   */
  point(column: string): ColumnBuilder;

  /**
   * Add a polygon column.
   */
  polygon(column: string): ColumnBuilder;

  /**
   * Add a line string column.
   */
  lineString(column: string): ColumnBuilder;

  /**
   * Add a generic geometry column.
   */
  geometry(column: string): ColumnBuilder;

  /**
   * Add an enum column with allowed values.
   */
  enum(column: string, values: string[]): ColumnBuilder;

  /**
   * Add a set column (multiple values from a set).
   */
  set(column: string, values: string[]): ColumnBuilder;

  // ── PostgreSQL array types ──────────────────────────────────────────────────

  /** INTEGER[] — array of integers. */
  arrayInt(column: string): ColumnBuilder;

  /** BIGINT[] — array of big integers. */
  arrayBigInt(column: string): ColumnBuilder;

  /** REAL[] — array of floats. */
  arrayFloat(column: string): ColumnBuilder;

  /** DECIMAL[] — array of decimals (optional precision/scale). */
  arrayDecimal(column: string, precision?: number, scale?: number): ColumnBuilder;

  /** BOOLEAN[] — array of booleans. */
  arrayBoolean(column: string): ColumnBuilder;

  /** TEXT[] — array of text values. */
  arrayText(column: string): ColumnBuilder;

  /** DATE[] — array of dates. */
  arrayDate(column: string): ColumnBuilder;

  /** TIMESTAMPTZ[] — array of timestamps with time zone. */
  arrayTimestamp(column: string): ColumnBuilder;

  /** UUID[] — array of UUIDs. */
  arrayUuid(column: string): ColumnBuilder;

  /**
   * Add an auto-increment primary key column.
   */
  id(name?: string): ColumnBuilder;

  /**
   * Add a big integer auto-increment primary key column.
   */
  bigId(name?: string): ColumnBuilder;

  /**
   * Add a UUID primary key column.
   */
  uuidId(name?: string): ColumnBuilder;

  /**
   * Add a UUID primary key column with automatic generation.
   *
   * PostgreSQL: Uses gen_random_uuid() (built-in since PG 13)
   * MongoDB: Application-level UUID generation
   *
   * @param name - Column name (default: "id")
   * @returns Column builder for chaining modifiers
   *
   * @example
   * ```typescript
   * this.primaryUuid(); // id UUID PRIMARY KEY DEFAULT gen_random_uuid()
   * this.primaryUuid("organization_id"); // Custom column name
   * ```
   */
  primaryUuid(name?: string): ColumnBuilder;

  /**
   * Add createdAt and updatedAt timestamp columns.
   */
  timestamps(): MigrationContract;

  /**
   * Add a deletedAt column for soft deletes.
   */
  softDeletes(column?: string): ColumnBuilder;

  /**
   * Drop a column.
   */
  dropColumn(column: string): MigrationContract;

  /**
   * Drop multiple columns.
   */
  dropColumns(...columns: string[]): MigrationContract;

  /**
   * Rename a column.
   */
  renameColumn(from: string, to: string): MigrationContract;

  /**
   * Create an index on one or more columns.
   *
   * @param columns - Column(s) to index
   * @param name - Optional index name
   * @param options - Optional index options (include, concurrently)
   */
  index(
    columns: string | string[],
    name?: string,
    options?: { include?: string[]; concurrently?: boolean },
  ): MigrationContract;

  /**
   * Drop an index by name or columns.
   */
  dropIndex(nameOrColumns: string | string[]): MigrationContract;

  /**
   * Create a unique constraint/index.
   *
   * @param columns - Column(s) to make unique
   * @param name - Optional constraint name
   * @param options - Optional index options (include, concurrently)
   */
  unique(
    columns: string | string[],
    name?: string,
    options?: { include?: string[]; concurrently?: boolean },
  ): MigrationContract;

  /**
   * Drop a unique constraint/index.
   */
  dropUnique(columns: string | string[]): MigrationContract;

  /**
   * Create an expression-based index.
   *
   * @param expressions - SQL expression(s) to index, e.g., ['lower(email)', 'upper(name)']
   * @param name - Optional index name
   * @param options - Optional index options (concurrently)
   */
  expressionIndex(
    expressions: string | string[],
    name?: string,
    options?: { concurrently?: boolean },
  ): MigrationContract;

  /**
   * Create a full-text search index.
   */
  fullText(columns: string | string[], options?: FullTextIndexOptions): MigrationContract;

  /**
   * Drop a full-text search index.
   */
  dropFullText(name: string): MigrationContract;

  /**
   * Create a geo-spatial index.
   */
  geoIndex(column: string, options?: GeoIndexOptions): MigrationContract;

  /**
   * Drop a geo-spatial index.
   */
  dropGeoIndex(column: string): MigrationContract;

  /**
   * Create a vector search index for AI embeddings.
   */
  vectorIndex(column: string, options: VectorIndexOptions): MigrationContract;

  /**
   * Drop a vector search index.
   */
  dropVectorIndex(column: string): MigrationContract;

  /**
   * Create a TTL (time-to-live) index for automatic document expiration.
   */
  ttlIndex(column: string, expireAfterSeconds: number): MigrationContract;

  /**
   * Drop a TTL index.
   */
  dropTTLIndex(column: string): MigrationContract;

  /**
   * Add a composite primary key.
   */
  primaryKey(columns: string[]): MigrationContract;

  /**
   * Drop the primary key constraint.
   */
  dropPrimaryKey(): MigrationContract;

  /**
   * Start building a foreign key constraint.
   */
  foreign(column: string): ForeignKeyBuilder;

  /**
   * Drop a foreign key constraint.
   *
   * When `referencesTable` is provided, the constraint name is auto-computed
   * using the same convention as `addForeignKey`:
   * `fk_{table}_{column}_{referencesTable}`
   *
   * When omitted, `columnOrConstraint` is used as the raw constraint name.
   */
  dropForeign(columnOrConstraint: string, referencesTable?: string): MigrationContract;

  /**
   * Set JSON schema validation rules on the collection.
   */
  schemaValidation(schema: object): MigrationContract;

  /**
   * Remove schema validation rules from the collection.
   */
  dropSchemaValidation(): MigrationContract;

  /**
   * Check if a table exists.
   */
  hasTable(tableName: string): Promise<boolean>;

  /**
   * Check if a column exists in the current table.
   */
  hasColumn(columnName: string): Promise<boolean>;

  /**
   * Get all columns in the current table.
   */
  getColumns(): Promise<ColumnDefinition[]>;

  /**
   * List all tables in the current database/connection.
   */
  listTables(): Promise<string[]>;

  /**
   * Get all indexes on the current table.
   */
  getIndexes(): Promise<TableIndexInformation[]>;

  /**
   * Check if a named index exists on the current table.
   */
  hasIndex(indexName: string): Promise<boolean>;

  /**
   * Queue a raw SQL string for execution within the migration.
   *
   * @param sql - SQL statement to execute
   */
  raw(sql: string): this;

  /**
   * Execute raw operations with direct driver/connection access.
   *
   * @param callback - Callback receiving the native connection
   */
  withConnection<T>(callback: (connection: unknown) => Promise<T>): Promise<T>;

  /**
   * Add a vector column for storing AI embeddings.
   *
   * @param column - Column name
   * @param dimensions - Embedding size (e.g. 1536 for text-embedding-3-small)
   */
  vector(column: string, dimensions: number): ColumnBuilder;
}

/**
 * Constructor for the migration class.
 */
export interface MigrationConstructor {
  new (): MigrationContract;
  migrationName?: string;
  createdAt?: string;
  transactional?: boolean;
  order?: number;
}

/**
 * Base class for all database migrations.
 *
 * Provides a fluent API for defining schema changes that work across
 * both SQL and NoSQL databases. The migration driver handles translating
 * operations to native database commands.
 *
 * Migrations are executed in order based on their `createdAt` timestamp,
 * which is typically extracted from the filename (e.g., `2024-01-15_create-users`).
 *
 * @example
 * ```typescript
 * // Using Migration.for() to bind to a model
 * export default class extends Migration.for(User) {
 *   public up(): void {
 *     this.string("email").unique();
 *     this.integer("age").nullable();
 *     this.geoIndex("location");
 *   }
 *
 *   public down(): void {
 *     this.dropColumn("email");
 *     this.dropColumn("age");
 *     this.dropGeoIndex("location");
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Manual table migration (without model binding)
 * export default class CreateUsersTable extends Migration {
 *   public readonly table = "users";
 *
 *   public up(): void {
 *     this.createTable();
 *     this.id();
 *     this.string("name");
 *     this.string("email").unique();
 *     this.timestamps();
 *   }
 *
 *   public down(): void {
 *     this.dropTable();
 *   }
 * }
 * ```
 */
export abstract class Migration implements MigrationContract {
  /**
   * Migration name that will be labeled with
   * If record is enabled in migration, it will be stored as migration name
   * in database
   *
   * @example
   * ```typescript
   * "2024-01-15_create-users";
   * ```
   */
  public static migrationName?: string;

  /**
   * Table/collection name for this migration.
   *
   * Must be defined by each migration class (either directly or via `Migration.for()`).
   */
  public readonly table!: string;

  /**
   * Sort order
   * If not provided, it will be ordered alphabetically
   */
  public static readonly order?: number;

  /**
   * Optional data source override.
   *
   * If specified, this migration will use a specific data source
   * instead of the default one. Can be a string name or DataSource instance.
   */
  public readonly dataSource?: string | DataSource;

  /**
   * Optional timestamp override.
   *
   * By default, the migration runner extracts this from the filename.
   * Set explicitly to override the execution order.
   *
   * Format: ISO 8601 or any parseable date string.
   */
  public static readonly createdAt?: string;

  /**
   * Whether to wrap migration in a transaction.
   *
   * Defaults to `true` for SQL databases that support DDL transactions.
   * Set to `false` for operations that cannot be transactional.
   *
   * Note: MongoDB does not support transactions for most DDL operations.
   */
  public readonly transactional?: boolean;

  /**
   * Migration driver instance (injected by the runner).
   */
  protected driver!: MigrationDriverContract;

  /**
   * Migration defaults from the resolved DataSource.
   * @internal
   */
  /** @internal — readable by factory-generated subclasses */
  protected _migrationDefaults?: MigrationDefaults;

  /**
   * Queued operations to execute.
   */
  private readonly pendingOperations: PendingOperation[] = [];

  // ============================================================================
  // ABSTRACT METHODS
  // ============================================================================

  /**
   * Define schema changes for the up migration.
   *
   * Called when running migrations forward. Add columns, indexes,
   * constraints, etc. in this method.
   */
  public abstract up(): void | Promise<void>;

  /**
   * Define rollback operations for the down migration.
   *
   * Called when rolling back migrations. Drop columns, indexes,
   * and undo any changes made in `up()`.
   */
  public abstract down(): void | Promise<void>;

  // ============================================================================
  // STATIC FACTORY
  // ============================================================================

  /**
   * Create a migration class bound to a specific model.
   *
   * Automatically inherits the model's table name and data source,
   * reducing boilerplate and ensuring consistency.
   *
   * @param model - Model class to bind
   * @returns Abstract migration class bound to the model
   *
   * @example
   * ```typescript
   * export default class extends Migration.for(User) {
   *   public up(): void {
   *     this.string("avatar").nullable();
   *   }
   *
   *   public down(): void {
   *     this.dropColumn("avatar");
   *   }
   * }
   * ```
   */
  public static for<T extends ChildModel<Model>>(model: T): MigrationConstructor {
    abstract class BoundMigration extends Migration {
      public readonly table = model.table;
      public readonly dataSource = model.dataSource;
    }

    return BoundMigration as unknown as MigrationConstructor;
  }

  // ============================================================================
  // DRIVER INJECTION
  // ============================================================================

  /**
   * Set the migration driver.
   *
   * Called by the migration runner before executing up/down.
   *
   * @param driver - Migration driver instance
   * @internal
   */
  public setDriver(driver: MigrationDriverContract): void {
    this.driver = driver;
  }

  /**
   * Set migration defaults from the resolved DataSource.
   *
   * @param defaults - Migration defaults (UUID strategy, etc.)
   * @internal
   */
  public setMigrationDefaults(defaults?: MigrationDefaults): void {
    this._migrationDefaults = defaults;
  }

  /**
   * Get the migration driver.
   *
   * @returns The migration driver instance
   */
  public getDriver(): MigrationDriverContract {
    return this.driver;
  }

  /**
   * Get database engine (MongoDB, Postgress...etc)
   */
  public get databaseEngine(): DatabaseDriver {
    return this.driver.driver.name;
  }

  // ============================================================================
  // EXECUTE OPERATIONS
  // ============================================================================

  /**
   * Execute all pending operations.
   *
   * @deprecated Use toSQL() instead — migrations now generate SQL rather than
   * executing DDL directly through the driver.
   * @internal
   */
  public async execute(): Promise<void> {
    for (const op of this.pendingOperations) {
      await this.executeOperation(op);
    }

    this.pendingOperations.length = 0;
  }

  /**
   * Serialize all queued pending operations into a flat list of SQL strings.
   *
   * Call this AFTER invoking `up()` or `down()` to extract the SQL for the
   * operations that were queued during that call. The pending queue is cleared
   * after serializing so the instance is safe to reuse.
   *
   * @example
   * ```typescript
   * const migration = new CreateUsersTable();
   * migration.setDriver(driver);
   *
   * // Up SQL
   * await migration.up();
   * const upSQL = migration.toSQL();
   *
   * // Down SQL — reuse the same instance
   * await migration.down();
   * const downSQL = migration.toSQL();
   * ```
   */
  public toSQL(): string[] {
    const serializer = this.driver.driver.getSQLSerializer();
    const statements = serializer.serializeAll(this.pendingOperations, this.table);
    this.pendingOperations.length = 0;
    return statements;
  }

  /**
   * Execute a single pending operation.
   */
  private async executeOperation(op: PendingOperation): Promise<void> {
    switch (op.type) {
      case "addColumn": {
        const column = op.payload as ColumnDefinition;
        await this.driver.addColumn(this.table, column);

        if (column.checkConstraint) {
          await this.driver.addCheck(
            this.table,
            column.checkConstraint.name,
            column.checkConstraint.expression,
          );
        }
        break;
      }

      case "dropColumn":
        await this.driver.dropColumn(this.table, op.payload as string);
        break;

      case "dropColumns":
        await this.driver.dropColumns(this.table, op.payload as string[]);
        break;

      case "renameColumn": {
        const { from, to } = op.payload as { from: string; to: string };
        await this.driver.renameColumn(this.table, from, to);
        break;
      }

      case "modifyColumn":
        await this.driver.modifyColumn(this.table, op.payload as ColumnDefinition);
        break;

      case "createIndex":
        await this.driver.createIndex(this.table, op.payload as IndexDefinition);
        break;

      case "dropIndex":
        await this.driver.dropIndex(this.table, op.payload as string);
        break;

      case "createUniqueIndex": {
        const { columns, name } = op.payload as {
          columns: string[];
          name?: string;
        };
        await this.driver.createUniqueIndex(this.table, columns, name);
        break;
      }

      case "dropUniqueIndex":
        await this.driver.dropUniqueIndex(this.table, op.payload as string[]);
        break;

      case "createFullTextIndex": {
        const { columns, options } = op.payload as {
          columns: string[];
          options?: FullTextIndexOptions;
        };
        await this.driver.createFullTextIndex(this.table, columns, options);
        break;
      }

      case "dropFullTextIndex":
        await this.driver.dropFullTextIndex(this.table, op.payload as string);
        break;

      case "createGeoIndex": {
        const { column, options } = op.payload as {
          column: string;
          options?: GeoIndexOptions;
        };
        await this.driver.createGeoIndex(this.table, column, options);
        break;
      }

      case "dropGeoIndex":
        await this.driver.dropGeoIndex(this.table, op.payload as string);
        break;

      case "createVectorIndex": {
        const { column, options } = op.payload as {
          column: string;
          options: VectorIndexOptions;
        };
        await this.driver.createVectorIndex(this.table, column, options);
        break;
      }

      case "dropVectorIndex":
        await this.driver.dropVectorIndex(this.table, op.payload as string);
        break;

      case "createTTLIndex": {
        const { column, seconds } = op.payload as {
          column: string;
          seconds: number;
        };
        await this.driver.createTTLIndex(this.table, column, seconds);
        break;
      }

      case "dropTTLIndex":
        await this.driver.dropTTLIndex(this.table, op.payload as string);
        break;

      case "addForeignKey":
        await this.driver.addForeignKey(this.table, op.payload as ForeignKeyDefinition);
        break;

      case "dropForeignKey":
        await this.driver.dropForeignKey(this.table, op.payload as string);
        break;

      case "addPrimaryKey":
        await this.driver.addPrimaryKey(this.table, op.payload as string[]);
        break;

      case "dropPrimaryKey":
        await this.driver.dropPrimaryKey(this.table);
        break;

      case "addCheck": {
        const { name, expression } = op.payload as { name: string; expression: string };
        await this.driver.addCheck(this.table, name, expression);
        break;
      }

      case "dropCheck":
        await this.driver.dropCheck(this.table, op.payload as string);
        break;

      case "createTable":
        await this.driver.createTable(this.table);
        break;

      case "createTableIfNotExists":
        await this.driver.createTableIfNotExists(this.table);
        break;

      case "dropTable":
        await this.driver.dropTable(this.table);
        break;

      case "dropTableIfExists":
        await this.driver.dropTableIfExists(this.table);
        break;

      case "renameTable":
        await this.driver.renameTable(this.table, op.payload as string);
        break;

      case "truncateTable":
        await this.driver.truncateTable(this.table);
        break;

      case "createTimestamps":
        await this.driver.createTimestampColumns(this.table);
        break;

      case "rawStatement":
        await this.driver.raw(async (client: any) => {
          const sql = op.payload as string;
          // Handle different driver APIs
          if (typeof client.query === "function") {
            // PostgreSQL, MySQL - client is the driver instance
            await client.query(sql);
          } else if (typeof client.command === "function") {
            // MongoDB - client is the Db instance
            await client.command({ $eval: sql });
          } else {
            throw new Error("Unsupported database driver for statement execution");
          }
        });
        break;

      case "setSchemaValidation":
        await this.driver.setSchemaValidation(this.table, op.payload as object);
        break;

      case "removeSchemaValidation":
        await this.driver.removeSchemaValidation(this.table);
        break;
    }
  }

  // ============================================================================
  // SCHEMA INSPECTION
  // ============================================================================

  /**
   * Check if a table exists.
   *
   * Useful for conditional migrations and idempotent operations.
   *
   * @param tableName - Table name to check
   * @returns Promise resolving to true if table exists
   *
   * @example
   * ```typescript
   * public async up() {
   *   if (await this.hasTable("users_backup")) {
   *     this.dropTable("users_backup");
   *   }
   *   // ... rest of migration
   * }
   * ```
   */
  public async hasTable(tableName: string): Promise<boolean> {
    return this.driver.tableExists(tableName);
  }

  /**
   * Check if a column exists in the current table.
   *
   * @param columnName - Column name to check
   * @returns Promise resolving to true if column exists
   *
   * @example
   * ```typescript
   * public async up() {
   *   if (!(await this.hasColumn("email"))) {
   *     this.string("email").unique();
   *   }
   * }
   * ```
   */
  public async hasColumn(columnName: string): Promise<boolean> {
    const columns = await this.getColumns();
    return columns.some((col) => col.name === columnName);
  }

  /**
   * Get all columns in the current table.
   *
   * @returns Promise resolving to array of column definitions
   *
   * @example
   * ```typescript
   * const columns = await this.getColumns();
   * if (columns.find(col => col.type === "string" && !col.length)) {
   *   // migrate all unbounded strings
   * }
   * ```
   */
  public async getColumns(): Promise<ColumnDefinition[]> {
    return this.driver.listColumns(this.table);
  }

  /**
   * List all tables in the current database/connection.
   *
   * @returns Promise resolving to array of table names
   *
   * @example
   * ```typescript
   * const tables = await this.listTables();
   * for (const table of tables) {
   *   // process each table
   * }
   * ```
   */
  public async listTables(): Promise<string[]> {
    return this.driver.listTables();
  }

  /**
   * Get all indexes on the current table.
   */
  public async getIndexes(): Promise<TableIndexInformation[]> {
    return this.driver.listIndexes(this.table);
  }

  /**
   * Check if a named index exists on the current table.
   */
  public async hasIndex(indexName: string): Promise<boolean> {
    const indexes = await this.getIndexes();
    return indexes.some((idx) => idx.name === indexName);
  }

  // ============================================================================
  // INTERNAL HELPERS
  // ============================================================================

  /**
   * Add a pending index definition.
   *
   * Called by ColumnBuilder when .unique() or .index() is chained.
   * Routes into pendingOperations so indexes execute in definition order
   * alongside columns and constraints.
   *
   * @param index - Index definition
   * @internal
   */
  public addPendingIndex(index: IndexDefinition): void {
    if (index.unique) {
      this.pendingOperations.push({
        type: "createUniqueIndex",
        payload: { columns: index.columns, name: index.name },
      });
    } else {
      this.pendingOperations.push({
        type: "createIndex",
        payload: index,
      });
    }
  }

  /**
   * Add a foreign key operation.
   *
   * Called by ForeignKeyBuilder or ColumnBuilder when .references() is called.
   *
   * @param fk - Foreign key definition
   * @internal
   */
  public addForeignKeyOperation(fk: ForeignKeyDefinition): void {
    this.pendingOperations.push({
      type: "addForeignKey",
      payload: fk,
    });
  }

  // ============================================================================
  // TABLE OPERATIONS
  // ============================================================================

  /**
   * Create the table/collection.
   *
   * For SQL, this creates an empty table.
   * For MongoDB, this creates the collection.
   *
   * @returns This migration for chaining
   */
  public createTable(): this {
    this.pendingOperations.push({ type: "createTable", payload: null });
    return this;
  }

  /**
   * Create table if not exists
   */
  public createTableIfNotExists(): this {
    this.pendingOperations.push({ type: "createTableIfNotExists", payload: null });
    return this;
  }

  /**
   * Drop the table/collection.
   *
   * @returns This migration for chaining
   */
  public dropTable(): this {
    this.pendingOperations.push({ type: "dropTable", payload: null });
    return this;
  }

  /**
   * Drop the table/collection if it exists.
   *
   * No error is thrown if the table doesn't exist.
   *
   * @returns This migration for chaining
   */
  public dropTableIfExists(): this {
    this.pendingOperations.push({ type: "dropTableIfExists", payload: null });
    return this;
  }

  /**
   * Rename the table/collection.
   *
   * @param newName - New table name
   * @returns This migration for chaining
   */
  public renameTableTo(newName: string): this {
    this.pendingOperations.push({ type: "renameTable", payload: newName });
    return this;
  }

  /**
   * Truncate the table — remove all rows without logging or firing triggers.
   *
   * Faster than DELETE with no WHERE clause. Resets auto-increment counters
   * on most databases.
   *
   * @returns This migration for chaining
   */
  public truncateTable(): this {
    this.pendingOperations.push({ type: "truncateTable", payload: null });
    return this;
  }

  // ============================================================================
  // COLUMN TYPES - STRING
  // ============================================================================

  /**
   * Add a string/varchar column.
   *
   * @param column - Column name
   * @param length - Max length (default: 255)
   * @returns Column builder for chaining modifiers
   *
   * @example
   * ```typescript
   * this.string("name"); // VARCHAR(255)
   * this.string("code", 10); // VARCHAR(10)
   * ```
   */
  public string(column: string, length = 255): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "string", { length });
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  /**
   * Add a fixed-length char column.
   *
   * @param column - Column name
   * @param length - Exact length
   * @returns Column builder for chaining modifiers
   */
  public char(column: string, length: number): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "char", { length });
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  /**
   * Add a text column (unlimited length).
   *
   * @param column - Column name
   * @returns Column builder for chaining modifiers
   */
  public text(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "text");
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  /**
   * Add a medium text column.
   *
   * @param column - Column name
   * @returns Column builder for chaining modifiers
   */
  public mediumText(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "mediumText");
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  /**
   * Add a long text column.
   *
   * @param column - Column name
   * @returns Column builder for chaining modifiers
   */
  public longText(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "longText");
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  // ============================================================================
  // COLUMN TYPES - NUMERIC
  // ============================================================================

  /**
   * Add an integer column.
   *
   * @param column - Column name
   * @returns Column builder for chaining modifiers
   */
  public integer(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "integer");
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  /**
   * Alias for integer().
   */
  public int(column: string): ColumnBuilder {
    return this.integer(column);
  }

  /**
   * Add a small integer column.
   *
   * @param column - Column name
   * @returns Column builder for chaining modifiers
   */
  public smallInteger(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "smallInteger");
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  /**
   * Alias for smallInteger().
   */
  public smallInt(column: string): ColumnBuilder {
    return this.smallInteger(column);
  }

  /**
   * Add a tiny integer column.
   *
   * @param column - Column name
   * @returns Column builder for chaining modifiers
   */
  public tinyInteger(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "tinyInteger");
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  /**
   * Alias for tinyInteger().
   */
  public tinyInt(column: string): ColumnBuilder {
    return this.tinyInteger(column);
  }

  /**
   * Add a big integer column.
   *
   * @param column - Column name
   * @returns Column builder for chaining modifiers
   */
  public bigInteger(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "bigInteger");
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  /**
   * Alias for bigInteger().
   */
  public bigInt(column: string): ColumnBuilder {
    return this.bigInteger(column);
  }

  /**
   * Add a float column.
   *
   * @param column - Column name
   * @returns Column builder for chaining modifiers
   */
  public float(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "float");
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  /**
   * Add a double precision column.
   *
   * @param column - Column name
   * @returns Column builder for chaining modifiers
   */
  public double(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "double");
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  /**
   * Add a decimal column with precision and scale.
   *
   * @param column - Column name
   * @param precision - Total digits (default: 8)
   * @param scale - Decimal places (default: 2)
   * @returns Column builder for chaining modifiers
   *
   * @example
   * ```typescript
   * this.decimal("price", 10, 2); // DECIMAL(10,2) - up to 99999999.99
   * ```
   */
  public decimal(column: string, precision = 8, scale = 2): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "decimal", {
      precision,
      scale,
    });
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  // ============================================================================
  // COLUMN TYPES - BOOLEAN
  // ============================================================================

  /**
   * Add a boolean column.
   *
   * @param column - Column name
   * @returns Column builder for chaining modifiers
   */
  public boolean(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "boolean");
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  /**
   * Alias for boolean().
   */
  public bool(column: string): ColumnBuilder {
    return this.boolean(column);
  }

  // ============================================================================
  // COLUMN TYPES - DATE/TIME
  // ============================================================================

  /**
   * Add a date column (date only, no time).
   *
   * @param column - Column name
   * @returns Column builder for chaining modifiers
   */
  public date(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "date");
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  /**
   * Add a datetime column (date and time).
   *
   * @param column - Column name
   * @returns Column builder for chaining modifiers
   */
  public dateTime(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "dateTime");
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  /**
   * Add a timestamp column.
   *
   * @param column - Column name
   * @returns Column builder for chaining modifiers
   */
  public timestamp(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "timestamp");
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  /**
   * Add a time column (time only, no date).
   *
   * @param column - Column name
   * @returns Column builder for chaining modifiers
   */
  public time(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "time");
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  /**
   * Add a year column.
   *
   * @param column - Column name
   * @returns Column builder for chaining modifiers
   */
  public year(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "year");
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  // ============================================================================
  // COLUMN TYPES - JSON & BINARY
  // ============================================================================

  /**
   * Add a JSON column.
   *
   * @param column - Column name
   * @returns Column builder for chaining modifiers
   */
  public json(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "json");
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  /**
   * Alias for json().
   */
  public object(column: string): ColumnBuilder {
    return this.json(column);
  }

  /**
   * Add a binary/blob column.
   *
   * @param column - Column name
   * @returns Column builder for chaining modifiers
   */
  public binary(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "binary");
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  /**
   * Alias for binary().
   */
  public blob(column: string): ColumnBuilder {
    return this.binary(column);
  }

  // ============================================================================
  // COLUMN TYPES - IDENTIFIERS
  // ============================================================================

  /**
   * Add a UUID column.
   *
   * @param column - Column name
   * @returns Column builder for chaining modifiers
   */
  public uuid(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "uuid");
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  /**
   * Add a ULID column.
   *
   * @param column - Column name
   * @returns Column builder for chaining modifiers
   */
  public ulid(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "ulid");
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  // ============================================================================
  // COLUMN TYPES - NETWORK
  // ============================================================================

  /**
   * Add an IP address column.
   *
   * @param column - Column name
   * @returns Column builder for chaining modifiers
   */
  public ipAddress(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "ipAddress");
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  /**
   * Add a MAC address column.
   *
   * @param column - Column name
   * @returns Column builder for chaining modifiers
   */
  public macAddress(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "macAddress");
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  // ============================================================================
  // COLUMN TYPES - GEO & SPATIAL
  // ============================================================================

  /**
   * Add a geo point column.
   *
   * @param column - Column name
   * @returns Column builder for chaining modifiers
   */
  public point(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "point");
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  /**
   * Add a polygon column.
   *
   * @param column - Column name
   * @returns Column builder for chaining modifiers
   */
  public polygon(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "polygon");
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  /**
   * Add a line string column.
   *
   * @param column - Column name
   * @returns Column builder for chaining modifiers
   */
  public lineString(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "lineString");
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  /**
   * Add a generic geometry column.
   *
   * @param column - Column name
   * @returns Column builder for chaining modifiers
   */
  public geometry(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "geometry");
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  // ============================================================================
  // COLUMN TYPES - AI/ML
  // ============================================================================

  /**
   * Add a vector column for AI embeddings.
   *
   * Used for storing and searching ML embeddings (e.g., OpenAI, Cohere).
   *
   * @param column - Column name
   * @param dimensions - Vector dimensions (e.g., 1536 for OpenAI ada-002)
   * @returns Column builder for chaining modifiers
   *
   * @example
   * ```typescript
   * this.vector("embedding", 1536); // OpenAI ada-002
   * this.vector("embedding", 384);  // Sentence Transformers
   * ```
   */
  public vector(column: string, dimensions: number): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "vector", { dimensions });
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  // ============================================================================
  // COLUMN TYPES - ENUM & SET
  // ============================================================================

  /**
   * Add an enum column with allowed values.
   *
   * @param column - Column name
   * @param values - Allowed enum values
   * @returns Column builder for chaining modifiers
   *
   * @example
   * ```typescript
   * this.enum("status", ["pending", "active", "archived"]);
   * ```
   */
  public enum(column: string, values: string[]): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "enum", { values });
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  /**
   * Add a set column (multiple values from a set).
   *
   * @param column - Column name
   * @param values - Allowed set values
   * @returns Column builder for chaining modifiers
   */
  public set(column: string, values: string[]): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "set", { values });
    this.pendingOperations.push({
      type: "addColumn",
      payload: builder.getDefinition(),
    });
    return builder;
  }

  // ============================================================================
  // COLUMN TYPES - POSTGRESQL ARRAYS
  // ============================================================================

  /**
   * Add an INTEGER[] column (array of integers).
   *
   * @example
   * ```typescript
   * this.arrayInt("scores"); // INTEGER[]
   * ```
   */
  public arrayInt(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "arrayInt");
    this.pendingOperations.push({ type: "addColumn", payload: builder.getDefinition() });
    return builder;
  }

  /**
   * Add a BIGINT[] column (array of big integers).
   *
   * @example
   * ```typescript
   * this.arrayBigInt("ids"); // BIGINT[]
   * ```
   */
  public arrayBigInt(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "arrayBigInt");
    this.pendingOperations.push({ type: "addColumn", payload: builder.getDefinition() });
    return builder;
  }

  /**
   * Add a REAL[] column (array of floats).
   *
   * @example
   * ```typescript
   * this.arrayFloat("weights"); // REAL[]
   * ```
   */
  public arrayFloat(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "arrayFloat");
    this.pendingOperations.push({ type: "addColumn", payload: builder.getDefinition() });
    return builder;
  }

  /**
   * Add a DECIMAL[] column (array of decimals).
   *
   * @param precision - Total digits
   * @param scale - Digits after decimal point
   *
   * @example
   * ```typescript
   * this.arrayDecimal("prices", 10, 2); // DECIMAL(10,2)[]
   * this.arrayDecimal("amounts");        // DECIMAL[]
   * ```
   */
  public arrayDecimal(column: string, precision?: number, scale?: number): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "arrayDecimal", { precision, scale });
    this.pendingOperations.push({ type: "addColumn", payload: builder.getDefinition() });
    return builder;
  }

  /**
   * Add a BOOLEAN[] column (array of booleans).
   *
   * @example
   * ```typescript
   * this.arrayBoolean("flags"); // BOOLEAN[]
   * ```
   */
  public arrayBoolean(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "arrayBoolean");
    this.pendingOperations.push({ type: "addColumn", payload: builder.getDefinition() });
    return builder;
  }

  /**
   * Add a TEXT[] column (array of text values).
   *
   * @example
   * ```typescript
   * this.arrayText("tags"); // TEXT[]
   * ```
   */
  public arrayText(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "arrayText");
    this.pendingOperations.push({ type: "addColumn", payload: builder.getDefinition() });
    return builder;
  }

  /**
   * Add a DATE[] column (array of dates).
   *
   * @example
   * ```typescript
   * this.arrayDate("holidays"); // DATE[]
   * ```
   */
  public arrayDate(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "arrayDate");
    this.pendingOperations.push({ type: "addColumn", payload: builder.getDefinition() });
    return builder;
  }

  /**
   * Add a TIMESTAMPTZ[] column (array of timestamps with time zone).
   *
   * @example
   * ```typescript
   * this.arrayTimestamp("events"); // TIMESTAMPTZ[]
   * ```
   */
  public arrayTimestamp(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "arrayTimestamp");
    this.pendingOperations.push({ type: "addColumn", payload: builder.getDefinition() });
    return builder;
  }

  /**
   * Add a UUID[] column (array of UUIDs).
   *
   * @example
   * ```typescript
   * this.arrayUuid("relatedIds"); // UUID[]
   * ```
   */
  public arrayUuid(column: string): ColumnBuilder {
    const builder = new ColumnBuilder(this, column, "arrayUuid");
    this.pendingOperations.push({ type: "addColumn", payload: builder.getDefinition() });
    return builder;
  }

  // ============================================================================
  // SHORTCUTS
  // ============================================================================

  /**
   * Add an auto-increment primary key column.
   *
   * Creates an unsigned integer with primary key and auto-increment.
   *
   * @param name - Column name (default: "id")
   * @returns Column builder for chaining modifiers
   *
   * @example
   * ```typescript
   * this.id(); // Creates "id" column
   * this.id("userId"); // Creates "userId" column
   * ```
   */
  public id(name = "id"): ColumnBuilder {
    return this.integer(name).primary().autoIncrement().unsigned();
  }

  /**
   * Add a big integer auto-increment primary key column.
   *
   * @param name - Column name (default: "id")
   * @returns Column builder for chaining modifiers
   */
  public bigId(name = "id"): ColumnBuilder {
    return this.bigInteger(name).primary().autoIncrement().unsigned();
  }

  /**
   * Add a UUID primary key column.
   *
   * @param name - Column name (default: "id")
   * @returns Column builder for chaining modifiers
   */
  public uuidId(name = "id"): ColumnBuilder {
    return this.uuid(name).primary();
  }

  /**
   * Add a UUID primary key column with automatic generation.
   *
   * Delegates UUID expression to the migration driver, which resolves
   * the default based on `migrationDefaults` from the DataSource config.
   *
   * Resolution order:
   * 1. `migrationDefaults.uuidExpression` (raw escape hatch)
   * 2. `migrationDefaults.uuidStrategy` (mapped per driver)
   * 3. Driver default (PostgreSQL: `gen_random_uuid()`, MongoDB: undefined)
   *
   * @param name - Column name (default: "id")
   * @returns Column builder for chaining modifiers
   *
   * @example
   * ```typescript
   * this.primaryUuid(); // id UUID PRIMARY KEY DEFAULT gen_random_uuid()
   * this.primaryUuid("organization_id"); // Custom column name
   * ```
   */
  public primaryUuid(name = "id"): ColumnBuilder {
    const uuidDefault = this.driver.getUuidDefault(this._migrationDefaults);
    const builder = this.uuid(name).primary();

    if (uuidDefault) {
      builder.default(uuidDefault);
    }

    return builder;
  }

  /**
   * Add createdAt and updatedAt timestamp columns.
   *
   * Behavior varies by database driver:
   * - PostgreSQL: Creates TIMESTAMPTZ columns with NOW() defaults
   * - MongoDB: No-op (timestamps handled at application level)
   *
   * @returns This migration for chaining
   *
   * @example
   * ```typescript
   * this.timestamps(); // Driver-specific implementation
   * ```
   */
  public timestamps(): this {
    this.pendingOperations.push({ type: "createTimestamps", payload: null });
    return this;
  }

  /**
   * Add a deletedAt column for soft deletes.
   *
   * @param column - Column name (default: "deletedAt")
   * @returns Column builder for chaining modifiers
   */
  public softDeletes(column = "deletedAt"): ColumnBuilder {
    return this.dateTime(column).nullable();
  }

  // ============================================================================
  // DROP COLUMN OPERATIONS
  // ============================================================================

  /**
   * Drop a column.
   *
   * @param column - Column name to drop
   * @returns This migration for chaining
   */
  public dropColumn(column: string): this {
    this.pendingOperations.push({ type: "dropColumn", payload: column });
    return this;
  }

  /**
   * Drop multiple columns.
   *
   * @param columns - Column names to drop
   * @returns This migration for chaining
   */
  public dropColumns(...columns: string[]): this {
    this.pendingOperations.push({ type: "dropColumns", payload: columns });
    return this;
  }

  /**
   * Rename a column.
   *
   * @param from - Current column name
   * @param to - New column name
   * @returns This migration for chaining
   */
  public renameColumn(from: string, to: string): this {
    this.pendingOperations.push({
      type: "renameColumn",
      payload: { from, to },
    });
    return this;
  }

  // ============================================================================
  // INDEX OPERATIONS
  // ============================================================================

  /**
   * Create an index on one or more columns.
   *
   * @param columns - Column(s) to index
   * @param name - Optional index name
   * @param options - Optional index options (include, concurrently)
   * @returns This migration for chaining
   *
   * @example
   * ```typescript
   * this.index("email");
   * this.index(["firstName", "lastName"], "name_idx");
   * this.index("userId", "idx_user", { include: ["name", "email"] });
   * this.index("email", "idx_email", { concurrently: true });
   * ```
   */
  public index(
    columns: string | string[],
    name?: string,
    options?: { include?: string[]; concurrently?: boolean },
  ): this {
    const cols = Array.isArray(columns) ? columns : [columns];
    this.pendingOperations.push({
      type: "createIndex",
      payload: {
        columns: cols,
        name,
        include: options?.include,
        concurrently: options?.concurrently,
      } as IndexDefinition,
    });
    return this;
  }

  /**
   * Drop an index by name or columns.
   *
   * @param nameOrColumns - Index name (string) or columns array
   * @returns This migration for chaining
   *
   * @example
   * ```typescript
   * this.dropIndex("email_idx"); // Drop by name
   * this.dropIndex(["firstName", "lastName"]); // Drop by columns
   * ```
   */
  public dropIndex(nameOrColumns: string | string[]): this {
    this.pendingOperations.push({
      type: "dropIndex",
      payload: nameOrColumns,
    });
    return this;
  }

  /**
   * Create a unique constraint/index.
   *
   * @param columns - Column(s) to make unique
   * @param name - Optional constraint name
   * @param options - Optional index options (include, concurrently)
   * @returns This migration for chaining
   *
   * @example
   * ```typescript
   * this.unique("email");
   * this.unique(["userId", "roleId"], "unique_user_role");
   * this.unique("email", "unique_email", { include: ["name"] });
   * ```
   */
  public unique(
    columns: string | string[],
    name?: string,
    options?: { include?: string[]; concurrently?: boolean },
  ): this {
    const cols = Array.isArray(columns) ? columns : [columns];
    this.pendingOperations.push({
      type: "createUniqueIndex",
      payload: {
        columns: cols,
        name,
        include: options?.include,
        concurrently: options?.concurrently,
      },
    });
    return this;
  }

  /**
   * Drop a unique constraint/index.
   *
   * @param columns - Columns in the unique constraint
   * @returns This migration for chaining
   */
  public dropUnique(columns: string | string[]): this {
    const cols = Array.isArray(columns) ? columns : [columns];
    this.pendingOperations.push({ type: "dropUniqueIndex", payload: cols });
    return this;
  }

  /**
   * Create an expression-based index.
   *
   * Allows indexing on SQL expressions rather than plain columns.
   * Useful for case-insensitive searches, computed values, etc.
   *
   * **Note**: PostgreSQL-specific feature. MongoDB will silently ignore this.
   *
   * @param expressions - SQL expression(s) to index
   * @param name - Optional index name
   * @param options - Optional index options (concurrently)
   * @returns This migration for chaining
   *
   * @example
   * ```typescript
   * // Case-insensitive email index
   * this.expressionIndex(['lower(email)'], 'idx_email_lower');
   *
   * // Multiple expressions
   * this.expressionIndex(['lower(firstName)', 'lower(lastName)'], 'idx_name_lower');
   *
   * // With concurrent creation (requires transactional = false)
   * this.expressionIndex(['lower(email)'], 'idx_email_lower', { concurrently: true });
   * ```
   */
  public expressionIndex(
    expressions: string | string[],
    name?: string,
    options?: { concurrently?: boolean },
  ): this {
    const exprs = Array.isArray(expressions) ? expressions : [expressions];
    this.pendingOperations.push({
      type: "createIndex",
      payload: {
        columns: [], // Empty columns for expression indexes
        expressions: exprs,
        name,
        concurrently: options?.concurrently,
      } as IndexDefinition,
    });
    return this;
  }

  // ============================================================================
  // FULL-TEXT INDEX
  // ============================================================================

  /**
   * Create a full-text search index.
   *
   * @param columns - Column(s) to index
   * @param options - Full-text options
   * @returns This migration for chaining
   */
  public fullText(columns: string | string[], options?: FullTextIndexOptions): this {
    const cols = Array.isArray(columns) ? columns : [columns];
    this.pendingOperations.push({
      type: "createFullTextIndex",
      payload: { columns: cols, options },
    });
    return this;
  }

  /**
   * Drop a full-text search index.
   *
   * @param name - Index name
   * @returns This migration for chaining
   */
  public dropFullText(name: string): this {
    this.pendingOperations.push({ type: "dropFullTextIndex", payload: name });
    return this;
  }

  // ============================================================================
  // GEO INDEX
  // ============================================================================

  /**
   * Create a geo-spatial index.
   *
   * @param column - Geo column
   * @param options - Geo index options
   * @returns This migration for chaining
   *
   * @example
   * ```typescript
   * this.geoIndex("location"); // 2dsphere index
   * this.geoIndex("coordinates", { type: "2d" }); // 2d index
   * ```
   */
  public geoIndex(column: string, options?: GeoIndexOptions): this {
    this.pendingOperations.push({
      type: "createGeoIndex",
      payload: { column, options },
    });
    return this;
  }

  /**
   * Drop a geo-spatial index.
   *
   * @param column - Geo column
   * @returns This migration for chaining
   */
  public dropGeoIndex(column: string): this {
    this.pendingOperations.push({ type: "dropGeoIndex", payload: column });
    return this;
  }

  // ============================================================================
  // VECTOR INDEX
  // ============================================================================

  /**
   * Create a vector search index for AI embeddings.
   *
   * @param column - Vector column
   * @param options - Vector index options
   * @returns This migration for chaining
   *
   * @example
   * ```typescript
   * this.vectorIndex("embedding", {
   *   dimensions: 1536,
   *   similarity: "cosine",
   * });
   * ```
   */
  public vectorIndex(column: string, options: VectorIndexOptions): this {
    this.pendingOperations.push({
      type: "createVectorIndex",
      payload: { column, options },
    });
    return this;
  }

  /**
   * Drop a vector search index.
   *
   * @param column - Vector column
   * @returns This migration for chaining
   */
  public dropVectorIndex(column: string): this {
    this.pendingOperations.push({ type: "dropVectorIndex", payload: column });
    return this;
  }

  // ============================================================================
  // TTL INDEX
  // ============================================================================

  /**
   * Create a TTL (time-to-live) index for automatic document expiration.
   *
   * Primarily for MongoDB. Documents are automatically deleted after the
   * specified time has passed since the date in the column.
   *
   * @param column - Date column to check for expiration
   * @param expireAfterSeconds - Seconds after which documents expire
   * @returns This migration for chaining
   *
   * @example
   * ```typescript
   * // Delete sessions 24 hours after createdAt
   * this.ttlIndex("createdAt", 86400);
   * ```
   */
  public ttlIndex(column: string, expireAfterSeconds: number): this {
    this.pendingOperations.push({
      type: "createTTLIndex",
      payload: { column, seconds: expireAfterSeconds },
    });
    return this;
  }

  /**
   * Drop a TTL index.
   *
   * @param column - Column with TTL
   * @returns This migration for chaining
   */
  public dropTTLIndex(column: string): this {
    this.pendingOperations.push({ type: "dropTTLIndex", payload: column });
    return this;
  }

  // ============================================================================
  // PRIMARY KEY
  // ============================================================================

  /**
   * Add a composite primary key.
   *
   * @param columns - Columns to include in the primary key
   * @returns This migration for chaining
   */
  public primaryKey(columns: string[]): this {
    this.pendingOperations.push({ type: "addPrimaryKey", payload: columns });
    return this;
  }

  /**
   * Drop the primary key constraint.
   *
   * @returns This migration for chaining
   */
  public dropPrimaryKey(): this {
    this.pendingOperations.push({ type: "dropPrimaryKey", payload: null });
    return this;
  }

  // ============================================================================
  // CHECK CONSTRAINTS
  // ============================================================================

  /**
   * Add a CHECK constraint to the table.
   *
   * SQL-only feature. PostgreSQL, MySQL 8.0+, SQLite support this.
   * Validates that rows satisfy the given SQL expression.
   *
   * @param name - Constraint name
   * @param expression - SQL CHECK expression
   * @returns This migration for chaining
   *
   * @example
   * ```typescript
   * this.check("age_positive", "age >= 0");
   * this.check("valid_email", "email LIKE '%@%'");
   * this.check("price_range", "price BETWEEN 0 AND 1000000");
   * ```
   */
  public check(name: string, expression: string): this {
    this.pendingOperations.push({
      type: "addCheck",
      payload: { name, expression },
    });
    return this;
  }

  /**
   * Drop a CHECK constraint by name.
   *
   * @param name - Constraint name
   * @returns This migration for chaining
   *
   * @example
   * ```typescript
   * this.dropCheck("age_positive");
   * ```
   */
  public dropCheck(name: string): this {
    this.pendingOperations.push({
      type: "dropCheck",
      payload: name,
    });
    return this;
  }

  // ============================================================================
  // FOREIGN KEYS (SQL)
  // ============================================================================

  /**
   * Start building a foreign key constraint on an existing column.
   *
   * Use this when adding a foreign key to a column that was defined in a
   * previous migration. For new columns, prefer the inline form:
   * `this.integer("user_id").references("users").onDelete("cascade")`
   *
   * SQL-only feature; NoSQL drivers ignore foreign keys.
   *
   * @param column - Local column that references another table
   * @returns Foreign key builder for chaining
   *
   * @example
   * ```typescript
   * this.foreign("user_id")
   *   .references("users", "id")
   *   .onDelete("cascade");
   * ```
   */
  public foreign(column: string): ForeignKeyBuilder {
    return new ForeignKeyBuilder(this, column);
  }

  /**
   * Drop a foreign key constraint.
   *
   * Two calling forms:
   *
   * 1. Auto-compute the name (matches what `addForeignKey` generates):
   *    ```typescript
   *    this.dropForeign("unit_id", Unit.table);
   *    // → drops: fk_{table}_unit_id_units
   *    ```
   *
   * 2. Raw constraint name (use when the name was set explicitly):
   *    ```typescript
   *    this.dropForeign("my_custom_fk_name");
   *    ```
   *
   * @param columnOrConstraint - Column name (auto mode) or raw constraint name (raw mode)
   * @param referencesTable - Referenced table name; triggers auto-name computation when provided
   * @returns This migration for chaining
   */
  public dropForeign(columnOrConstraint: string, referencesTable?: string): this {
    const constraintName = referencesTable
      ? `fk_${this.table}_${columnOrConstraint}_${referencesTable}`
      : columnOrConstraint;
    this.pendingOperations.push({ type: "dropForeignKey", payload: constraintName });
    return this;
  }

  // ============================================================================
  // SCHEMA VALIDATION (NoSQL)
  // ============================================================================

  /**
   * Set JSON schema validation rules on the collection.
   *
   * MongoDB-only feature. SQL databases ignore this.
   *
   * @param schema - JSON Schema object
   * @returns This migration for chaining
   *
   * @example
   * ```typescript
   * this.schemaValidation({
   *   bsonType: "object",
   *   required: ["name", "email"],
   *   properties: {
   *     name: { bsonType: "string" },
   *     email: { bsonType: "string" },
   *   },
   * });
   * ```
   */
  public schemaValidation(schema: object): this {
    this.pendingOperations.push({
      type: "setSchemaValidation",
      payload: schema,
    });
    return this;
  }

  /**
   * Remove schema validation rules from the collection.
   *
   * @returns This migration for chaining
   */
  public dropSchemaValidation(): this {
    this.pendingOperations.push({
      type: "removeSchemaValidation",
      payload: null,
    });
    return this;
  }

  // ============================================================================
  // RAW ACCESS
  // ============================================================================

  /**
   * Execute raw operations with direct driver/connection access.
   *
   * Use this when you need to bypass the migration API entirely and
   * interact with the native database driver directly.
   *
   * @param callback - Callback receiving the native connection
   * @returns Result from callback
   *
   * @example
   * ```typescript
   * await this.withConnection(async (db) => {
   *   await db.collection("users").updateMany({}, { $set: { active: true } });
   * });
   * ```
   */
  public async withConnection<T>(callback: (connection: unknown) => Promise<T>): Promise<T> {
    return this.driver.raw(callback);
  }

  /**
   * Queue a raw SQL string for execution within the migration.
   *
   * The statement is queued and executed in order with other migration
   * operations, within the transaction context if the migration is transactional.
   *
   * Use `withConnection()` instead if you need direct driver access.
   *
   * Works with PostgreSQL, MySQL, etc. For MongoDB, uses $eval command.
   *
   * @param sql - SQL statement to execute
   * @returns This migration for chaining
   *
   * @example
   * ```typescript
   * // Enable PostgreSQL extension
   * this.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
   *
   * // Create custom type
   * this.raw('CREATE TYPE mood AS ENUM (\'happy\', \'sad\', \'neutral\')');
   * ```
   */
  public raw(sql: string): this {
    this.pendingOperations.push({
      type: "rawStatement",
      payload: sql,
    });
    return this;
  }

  // ============================================================================
  // DECLARATIVE FACTORY STUBS
  // These are assigned after the class body — declared here so TS knows the
  // shape of the static members without triggering abstract-class restrictions.
  // ============================================================================

  /**
   * Create a declarative initial-table migration.
   * Implemented and assigned below the class body.
   */
  public static create: (
    model: ChildModel<Model<any>>,
    columns: ColumnMap,
    options?: MigrationCreateOptions,
  ) => MigrationConstructor;

  /**
   * Create a declarative alteration migration.
   * Implemented and assigned below the class body.
   */
  public static alter: (
    model: ChildModel<Model<any>>,
    schema: AlterSchema,
    options?: MigrationAlterOptions,
  ) => MigrationConstructor;
}

export function migrate(
  model: ChildModel<Model<any>>,
  options?: {
    createdAt?: string;
    name?: string;
    up?: (this: MigrationContract) => void | Promise<void>;
    down?: (this: MigrationContract) => void | Promise<void>;
    transactional?: boolean;
  },
): MigrationConstructor {
  return class AnonymousMigration extends Migration {
    public static migrationName?: string = options?.name;
    public static createdAt?: string = options?.createdAt;
    public readonly table: string = model.table;
    public static transactional?: boolean = options?.transactional;

    public async up() {
      await options?.up?.call(this);
    }

    public async down() {
      await options?.down?.call(this);
    }
  };
}

// ============================================================================
// DECLARATIVE FACTORIES
// ============================================================================

/**
 * A single composite index entry for `Migration.create()` options.
 *
 * @example
 * ```typescript
 * // Simple — columns only, name and type auto-resolved
 * { columns: ["organization_id", "content_type"] }
 *
 * // Named
 * { columns: ["organization_id", "content_type"], name: "idx_org_content" }
 *
 * // Typed (PostgreSQL)
 * { columns: ["embedding"], using: "ivfflat" }
 * ```
 */
export type IndexEntry = {
  /** Column(s) to include in the index. */
  columns: string | string[];
  /** Optional explicit index name. Auto-generated when omitted. */
  name?: string;
  /**
   * Index access method (PostgreSQL).
   * Defaults to `"btree"` when omitted.
   */
  using?: "btree" | "hash" | "gin" | "gist" | "brin" | "ivfflat" | "hnsw" | (string & {});
  /** Extra columns to include in a covering index (PostgreSQL `INCLUDE`). */
  include?: string[];
  /** Build the index without locking the table (PostgreSQL). */
  concurrently?: boolean;
};

/**
 * A single composite unique constraint entry for `Migration.create()` options.
 *
 * @example
 * ```typescript
 * // Simple
 * { columns: ["organization_id", "email"] }
 *
 * // Named — useful when you need to reference it in a future ALTER
 * { columns: ["org_id", "content_id", "lang"], name: "uq_summary_idempotency" }
 * ```
 */
export type UniqueEntry = {
  /** Column(s) that must be unique together. */
  columns: string | string[];
  /** Optional explicit constraint name. Auto-generated when omitted. */
  name?: string;
  /** Extra columns to include (PostgreSQL covering unique index). */
  include?: string[];
  /** Build the constraint without locking the table (PostgreSQL). */
  concurrently?: boolean;
};

/**
 * Options accepted by `Migration.create()`.
 */
export type MigrationCreateOptions = {
  /**
   * Sort order override.
   * @default 0
   */
  order?: number;

  /**
   * ISO timestamp override for migration ordering.
   * Normally extracted from the filename by the runner.
   */
  createdAt?: string;

  /**
   * Override the primary key type for this migration only.
   *
   * - `"uuid"` — UUID primary key (uses `primaryUuid()`)
   * - `"int"` — Auto-increment integer (uses `id()`)
   * - `"bigInt"` — Big auto-increment integer (uses `bigId()`)
   * - `false` — Skip primary key generation entirely
   *
   * When omitted, falls back to `migrationDefaults.primaryKey` from the
   * DataSource config, then to `"int"` as the framework default.
   */
  primaryKey?: "uuid" | "int" | "bigInt" | false;

  /**
   * Whether to add `timestamps()` (created_at / updated_at).
   * @default true
   */
  timestamps?: boolean;

  /**
   * Whether to wrap this migration in a transaction.
   * Falls back to DataSource / driver defaults when omitted.
   */
  transactional?: boolean;

  /**
   * Composite indexes to create on the table.
   *
   * Use this for multi-column indexes. Single-column indexes should be
   * defined at the column level via `.index()`.
   *
   * @example
   * ```typescript
   * index: [
   *   { columns: ["organization_id", "content_type", "content_id"] },
   *   { columns: ["organization_id", "status"], name: "idx_org_status" },
   * ]
   * ```
   */
  index?: IndexEntry[];

  /**
   * Composite unique constraints to create on the table.
   *
   * Use this for multi-column uniqueness. Single-column unique constraints
   * should be defined at the column level via `.unique()`.
   *
   * @example
   * ```typescript
   * unique: [
   *   {
   *     columns: ["organization_id", "content_id", "content_language"],
   *     name: "uq_summary_idempotency",
   *   },
   * ]
   * ```
   */
  unique?: UniqueEntry[];

  /**
   * Custom logic to execute after the declarative definitions.
   * Useful for data seeding or raw SQL following table creation.
   */
  up?: (this: Migration) => void | Promise<void>;

  /**
   * Raw SQL queries to run before the custom `up` logic.
   * Useful for triggering statements or custom constraints.
   */
  raw?: string | string[];

  /**
   * Custom rollback logic to execute before the default `dropTableIfExists`.
   */
  down?: (this: Migration) => void | Promise<void>;
};

/**
 * Column map accepted by `Migration.create()` and `Migration.alter()`.
 *
 * Keys become the column names; values are `DetachedColumnBuilder` instances
 * produced by the standalone column helpers (`uuid()`, `text()`, etc.).
 */
export type ColumnMap = Record<string, import("./column-helpers").DetachedColumnBuilder>;

/**
 * Options accepted by `Migration.alter()`.
 */
export type MigrationAlterOptions = {
  /** Sort order override. */
  order?: number;
  /** ISO timestamp override. */
  createdAt?: string;
  /** Whether to wrap in a transaction. */
  transactional?: boolean;

  /**
   * Custom logic to execute after the declarative definitions.
   */
  up?: (this: Migration) => void | Promise<void>;

  /**
   * Custom rollback logic to execute on rollback.
   * Unlike `create()`, `alter()` does not auto-infer rollbacks.
   */
  down?: (this: Migration) => void | Promise<void>;
};

/**
 * Schema map passed to `Migration.alter()`.
 *
 * Groups all table-level DDL operations by intent.
 * Any key can be omitted when not needed.
 *
 * @example
 * ```typescript
 * export default Migration.alter(User, {
 *   // Column operations
 *   add:    { phone: text().nullable() },
 *   drop:   ["legacy_column"],
 *   rename: { old_name: "new_name" },
 *   modify: { email: string(320).notNullable() },
 *
 *   // Index / constraint operations
 *   addIndex:   [{ columns: ["first_name", "last_name"] }],
 *   addUnique:  [{ columns: ["email"] }],
 *   addForeign: [{ column: "team_id", references: Team }],
 *   dropIndexes: ["old_idx_name"],
 *   dropUnique:  [["email"]],
 * });
 * ```
 */
export type AlterSchema = {
  // ============================================================================
  // Column Operations
  // ============================================================================

  /** Columns to add. Keys become column names. */
  add?: ColumnMap;

  /** Column names to drop. */
  drop?: string[];

  /** Rename map: `{ oldName: newName }`. */
  rename?: Record<string, string>;

  /** Columns to modify. Keys become column names. */
  modify?: ColumnMap;

  // ============================================================================
  // Index Operations
  // ============================================================================

  /**
   * Regular indexes to add.
   *
   * @example
   * ```typescript
   * addIndex: [
   *   { columns: "email" },
   *   { columns: ["first_name", "last_name"], name: "idx_full_name" },
   *   { columns: "email", options: { concurrently: true } },
   * ]
   * ```
   */
  addIndex?: Array<{
    columns: string | string[];
    name?: string;
    options?: { include?: string[]; concurrently?: boolean };
  }>;

  /**
   * Indexes to drop (by name or columns array).
   *
   * @example
   * ```typescript
   * dropIndex: ["idx_old_name", ["first_name", "last_name"]]
   * ```
   */
  dropIndex?: Array<string | string[]>;

  /**
   * Unique constraints / indexes to add.
   *
   * @example
   * ```typescript
   * addUnique: [{ columns: "email" }]
   * ```
   */
  addUnique?: Array<{
    columns: string | string[];
    name?: string;
    options?: { include?: string[]; concurrently?: boolean };
  }>;

  /**
   * Unique constraints to drop (by columns array).
   *
   * @example
   * ```typescript
   * dropUnique: [["email"], ["phone"]]
   * ```
   */
  dropUnique?: Array<string | string[]>;

  /**
   * Expression-based indexes to add (PostgreSQL-specific).
   *
   * @example
   * ```typescript
   * addExpressionIndex: [
   *   { expressions: "lower(email)", name: "idx_email_lower" },
   * ]
   * ```
   */
  addExpressionIndex?: Array<{
    expressions: string | string[];
    name?: string;
    options?: { concurrently?: boolean };
  }>;

  // ============================================================================
  // Specialized Indexes
  // ============================================================================

  /**
   * Full-text search indexes to add.
   *
   * @example
   * ```typescript
   * addFullText: [{ columns: ["title", "body"] }]
   * ```
   */
  addFullText?: Array<{
    columns: string | string[];
    options?: FullTextIndexOptions;
  }>;

  /** Full-text indexes to drop (by name). */
  dropFullText?: string[];

  /**
   * Geo-spatial indexes to add.
   *
   * @example
   * ```typescript
   * addGeoIndex: [{ column: "location" }]
   * ```
   */
  addGeoIndex?: Array<{
    column: string;
    options?: GeoIndexOptions;
  }>;

  /** Geo indexes to drop (by column name). */
  dropGeoIndex?: string[];

  /**
   * Vector search indexes to add.
   *
   * @example
   * ```typescript
   * addVectorIndex: [{ column: "embedding", options: { dimensions: 1536, similarity: "cosine" } }]
   * ```
   */
  addVectorIndex?: Array<{
    column: string;
    options: VectorIndexOptions;
  }>;

  /** Vector indexes to drop (by column name). */
  dropVectorIndex?: string[];

  /**
   * TTL indexes to add (MongoDB-primary).
   *
   * @example
   * ```typescript
   * addTTLIndex: [{ column: "created_at", expireAfterSeconds: 86400 }]
   * ```
   */
  addTTLIndex?: Array<{ column: string; expireAfterSeconds: number }>;

  /** TTL indexes to drop (by column name). */
  dropTTLIndex?: string[];

  // ============================================================================
  // Constraints (SQL)
  // ============================================================================

  /**
   * Foreign keys to add to existing columns.
   *
   * Accepts a Model class or a raw table-name string for `references`.
   *
   * @example
   * ```typescript
   * addForeign: [
   *   { column: "team_id",  references: Team,       onDelete: "cascade" },
   *   { column: "owner_id", references: "users",    on: "id", onDelete: "setNull" },
   * ]
   * ```
   */
  addForeign?: Array<{
    column: string;
    references: string | { table: string };
    on?: string;
    onDelete?: "cascade" | "restrict" | "setNull" | "noAction";
    onUpdate?: "cascade" | "restrict" | "setNull" | "noAction";
  }>;

  /**
   * Foreign keys to drop.
   *
   * Two forms:
   * - `{ columnOrConstraint: "team_id", referencesTable: "teams" }` → auto-name resolution
   * - `{ columnOrConstraint: "fk_my_custom_name" }` → raw constraint name
   */
  dropForeign?: Array<{ columnOrConstraint: string; referencesTable?: string }>;

  /**
   * CHECK constraints to add.
   *
   * @example
   * ```typescript
   * addCheck: [{ name: "age_positive", expression: "age >= 0" }]
   * ```
   */
  addCheck?: Array<{ name: string; expression: string }>;

  /** CHECK constraints to drop (by name). */
  dropCheck?: string[];

  // ============================================================================
  // Raw SQL
  // ============================================================================

  /**
   * Raw SQL queries to execute as part of this alter operation.
   */
  raw?: string | string[];
};

/**
 * Wire a `ColumnMap` onto an active migration instance.
 *
 * Fixes up the placeholder column name in each `DetachedColumnBuilder`,
 * pushes the `addColumn` operation, and transfers any pending FK / index
 * side effects from the detached sink to the real migration.
 *
 * @internal
 */
function wireColumns(migration: Migration, columns: ColumnMap): void {
  for (const [columnName, detached] of Object.entries(columns)) {
    // Overwrite the placeholder name with the real key
    const definition = detached.getDefinition();
    (definition as any).name = columnName;

    // Push the addColumn operation
    (migration as any).pendingOperations.push({
      type: "addColumn",
      payload: definition,
    });

    // Transfer any index operations registered via .unique() / .index()
    // Replace the placeholder column name with the real column name before transfer.
    for (const idx of detached.sink.pendingIndexes) {
      idx.columns = idx.columns.map(col => (col === "__placeholder__" ? columnName : col));
      migration.addPendingIndex(idx);
    }

    // Transfer any FK operations registered via .references()
    for (const fk of detached.sink.pendingForeignKeys as any[]) {
      // Fix the column name on the FK definition too
      fk.column = columnName;
      migration.addForeignKeyOperation(fk);
    }

    // Transfer any Vector indexes registered via .vectorIndex()
    if (detached.sink.pendingVectorIndexes) {
      for (const vIdx of detached.sink.pendingVectorIndexes) {
        vIdx.column = columnName;
        migration.vectorIndex(vIdx.column, vIdx.options);
      }
    }
  }
}

/**
 * Create a declarative initial-table migration.
 *
 * Automatically handles:
 * - `createTableIfNotExists()`
 * - Primary key (type resolved from `migrationDefaults.primaryKey` → options → `"int"`)
 * - `timestamps()`
 * - `down()` → `dropTableIfExists()`
 *
 * The class-based API remains available for complex migrations (raw SQL,
 * data backfills, conditional logic).
 *
 * @param model - Model class to bind (provides table name + data source)
 * @param columns - Column definitions keyed by column name
 * @param options - Optional overrides
 *
 * @example
 * ```typescript
 * import { Migration, uuid, text, timestamp } from "@warlock.js/cascade";
 * import { Organization } from "app/organizations/models/organization";
 * import { Chat } from "../chat.model";
 *
 * export default Migration.create(Chat, {
 *   organization_id: uuid().references(Organization).onDelete("cascade"),
 *   title:           text(),
 *   status:          text(),
 *   started_at:      timestamp().default("NOW()"),
 *   closed_at:       timestamp().nullable(),
 * }, { order: 5 });
 * ```
 */
Migration.create = function createMigration(
  model: ChildModel<Model<any>>,
  columns: ColumnMap,
  options: MigrationCreateOptions = {},
): MigrationConstructor {
  const {
    order = 0,
    createdAt,
    primaryKey: primaryKeyOverride,
    timestamps: withTimestamps = true,
    transactional,
  } = options;

  return class DeclarativeMigration extends Migration {
    public static readonly order = order;
    public static readonly createdAt = createdAt;
    public static readonly transactional = transactional;
    public readonly table = model.table;
    public readonly dataSource = model.dataSource;

    public async up(): Promise<void> {
      this.createTableIfNotExists();

      // Resolve primary key type: option → migrationDefaults → "int"
      const pkType =
        primaryKeyOverride !== undefined
          ? primaryKeyOverride
          : (this._migrationDefaults?.primaryKey ?? "int");

      if (pkType === "uuid") {
        this.primaryUuid();
      } else if (pkType === "bigInt") {
        this.bigId();
      } else if (pkType === "int") {
        this.id();
      }
      // pkType === false → skip primary key

      wireColumns(this, columns);

      if (withTimestamps) {
        this.timestamps();
      }

      // ── Composite indexes ───────────────────────────────────────────────
      if (options.index) {
        for (const entry of options.index) {
          this.index(entry.columns, entry.name, {
            include: entry.include,
            concurrently: entry.concurrently,
          });
        }
      }

      // ── Composite unique constraints ────────────────────────────────────
      if (options.unique) {
        for (const entry of options.unique) {
          this.unique(entry.columns, entry.name, {
            include: entry.include,
            concurrently: entry.concurrently,
          });
        }
      }

      if (options.raw) {
        const rawQueries = Array.isArray(options.raw) ? options.raw : [options.raw];
        for (const query of rawQueries) {
          this.raw(query);
        }
      }

      if (options.up) {
        await options.up.call(this as unknown as Migration);
      }
    }

    public async down(): Promise<void> {
      if (options.down) {
        await options.down.call(this as unknown as Migration);
      }
      this.dropTableIfExists();
    }
  } as unknown as MigrationConstructor;
};

/**
 * Create a declarative alteration migration.
 *
 * @param model - Model class to bind
 * @param schema - What to add / drop / rename / modify
 * @param options - Optional overrides
 *
 * @example
 * ```typescript
 * import { Migration, text } from "@warlock.js/cascade";
 * import { User } from "../user.model";
 *
 * export default Migration.alter(User, {
 *   add: {
 *     phone:  text().nullable(),
 *     avatar: text().nullable(),
 *   },
 *   drop: ["legacy_field"],
 *   rename: { old_name: "new_name" },
 * });
 * ```
 */
Migration.alter = function alterMigration(
  model: ChildModel<Model<any>>,
  schema: AlterSchema,
  options: MigrationAlterOptions = {},
): MigrationConstructor {
  const { order = 0, createdAt, transactional } = options;

  return class AlterMigration extends Migration {
    public static readonly order = order;
    public static readonly createdAt = createdAt;
    public static readonly transactional = transactional;
    public readonly table = model.table;
    public readonly dataSource = model.dataSource;

    public async up(): Promise<void> {
      // ── Column Operations ─────────────────────────────────────────────────
      if (schema.add) {
        wireColumns(this, schema.add);
      }

      if (schema.drop) {
        for (const col of schema.drop) {
          this.dropColumn(col);
        }
      }

      if (schema.rename) {
        for (const [from, to] of Object.entries(schema.rename)) {
          this.renameColumn(from, to);
        }
      }

      if (schema.modify) {
        for (const [columnName, detached] of Object.entries(schema.modify)) {
          const definition = detached.getDefinition();
          (definition as any).name = columnName;

          (this as any).pendingOperations.push({
            type: "modifyColumn",
            payload: definition,
          });

          // Transfer FK side effects
          for (const fk of detached.sink.pendingForeignKeys as any[]) {
            fk.column = columnName;
            this.addForeignKeyOperation(fk);
          }
        }
      }

      // ── Regular Indexes ───────────────────────────────────────────────────
      if (schema.addIndex) {
        for (const { columns, name, options: opts } of schema.addIndex) {
          this.index(columns, name, opts);
        }
      }

      if (schema.dropIndex) {
        for (const target of schema.dropIndex) {
          this.dropIndex(target);
        }
      }

      // ── Unique Indexes ────────────────────────────────────────────────────
      if (schema.addUnique) {
        for (const { columns, name, options: opts } of schema.addUnique) {
          this.unique(columns, name, opts);
        }
      }

      if (schema.dropUnique) {
        for (const cols of schema.dropUnique) {
          this.dropUnique(cols);
        }
      }

      // ── Expression Indexes ───────────────────────────────────────────────
      if (schema.addExpressionIndex) {
        for (const { expressions, name, options: opts } of schema.addExpressionIndex) {
          this.expressionIndex(expressions, name, opts);
        }
      }

      // ── Specialized Indexes ───────────────────────────────────────────────
      if (schema.addFullText) {
        for (const { columns, options: opts } of schema.addFullText) {
          this.fullText(columns, opts);
        }
      }

      if (schema.dropFullText) {
        for (const name of schema.dropFullText) {
          this.dropFullText(name);
        }
      }

      if (schema.addGeoIndex) {
        for (const { column, options: opts } of schema.addGeoIndex) {
          this.geoIndex(column, opts);
        }
      }

      if (schema.dropGeoIndex) {
        for (const column of schema.dropGeoIndex) {
          this.dropGeoIndex(column);
        }
      }

      if (schema.addVectorIndex) {
        for (const { column, options: opts } of schema.addVectorIndex) {
          this.vectorIndex(column, opts);
        }
      }

      if (schema.dropVectorIndex) {
        for (const column of schema.dropVectorIndex) {
          this.dropVectorIndex(column);
        }
      }

      if (schema.addTTLIndex) {
        for (const { column, expireAfterSeconds } of schema.addTTLIndex) {
          this.ttlIndex(column, expireAfterSeconds);
        }
      }

      if (schema.dropTTLIndex) {
        for (const column of schema.dropTTLIndex) {
          this.dropTTLIndex(column);
        }
      }

      // ── Foreign Keys ──────────────────────────────────────────────────────
      if (schema.addForeign) {
        for (const fk of schema.addForeign) {
          const tableName = typeof fk.references === "string" ? fk.references : fk.references.table;

          this.foreign(fk.column)
            .references(tableName, fk.on ?? "id")
            .onDelete(fk.onDelete ?? "restrict")
            .onUpdate(fk.onUpdate ?? "restrict");
        }
      }

      if (schema.dropForeign) {
        for (const { columnOrConstraint, referencesTable } of schema.dropForeign) {
          this.dropForeign(columnOrConstraint, referencesTable);
        }
      }

      // ── Check Constraints ─────────────────────────────────────────────────
      if (schema.addCheck) {
        for (const { name, expression } of schema.addCheck) {
          this.check(name, expression);
        }
      }

      if (schema.dropCheck) {
        for (const name of schema.dropCheck) {
          this.dropCheck(name);
        }
      }

      // ── Raw SQL ───────────────────────────────────────────────────────────
      if (schema.raw) {
        const rawQueries = Array.isArray(schema.raw) ? schema.raw : [schema.raw];
        for (const query of rawQueries) {
          this.raw(query);
        }
      }

      if (options.up) {
        await options.up.call(this as unknown as Migration);
      }
    }

    public async down(): Promise<void> {
      if (options.down) {
        await options.down.call(this as unknown as Migration);
      }
    }
  } as unknown as MigrationConstructor;
};

// The no-op re-assignments below silence the TS "used before assigned" check;
// the real implementations are set by the Migration.create = ... and
// Migration.alter = ... blocks immediately above.
(Migration as any).__declarativeFactoriesAttached = true;
