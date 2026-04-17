import { DriverContract, TransactionContext } from "../contracts";
import { DataSource } from "../data-source/data-source";
import { dataSourceRegistry } from "../data-source/data-source-registry";
import { MongoDbDriver } from "../drivers/mongodb/mongodb-driver";
import { PostgresDriver } from "../drivers/postgres";
import type { DeleteStrategy, MigrationDefaults, ModelDefaults } from "../types";

/**
 * Supported database driver types.
 */
export type DatabaseDriver = "mongodb" | "postgres" | "mysql";

/**
 * Default model configuration options.
 *
 * These settings will be applied to all models using this data source,
 * unless overridden by individual model static properties.
 *
 * This is a re-export of Partial<ModelDefaults> for backward compatibility
 * and to provide clearer naming in the connection config context.
 *
 * The full hierarchy is:
 * 1. Model static property (highest priority)
 * 2. Database config modelDefaults (this type)
 * 3. Driver defaults (e.g., snake_case for PostgreSQL, camelCase for MongoDB)
 * 4. Framework defaults (fallback values)
 *
 * @see ModelDefaults for complete type definition and documentation
 */
export type ModelDefaultConfig = Partial<ModelDefaults>;

/**
 * Connection options for establishing a database connection.
 *
 * Generic type that separates concerns:
 * - Shared config (driver, name, database, connection details)
 * - Driver options (cascade-next driver-specific settings)
 * - Client options (native database client settings)
 * - Model options (default model behaviors)
 *
 * @template TDriverOptions - Driver-specific options (e.g., MongoDriverOptions)
 * @template TClientOptions - Native client options (e.g., MongoClientOptions from mongodb package)
 *
 * @example
 * ```typescript
 * // MongoDB
 * import type { MongoClientOptions } from "mongodb";
 * import type { MongoDriverOptions } from "@warlock.js/cascade";
 *
 * const config: ConnectionOptions<MongoDriverOptions, MongoClientOptions> = {
 *   driver: "mongodb",
 *   database: "myapp",
 *   host: "localhost",
 *   port: 27017,
 *   driverOptions: {
 *     autoGenerateId: true,
 *     counterCollection: "counters",
 *   },
 *   clientOptions: {
 *     minPoolSize: 5,
 *     maxPoolSize: 10,
 *   },
 *   modelOptions: {
 *     randomIncrement: true,
 *     initialId: 1000,
 *   },
 * };
 * ```
 */
export type ConnectionOptions<TDriverOptions = any, TClientOptions = any> = {
  // ============================================================================
  // SHARED CONFIGURATION (Framework-level)
  // ============================================================================

  /**
   * Database driver to use.
   * @default "mongodb"
   */
  driver?: DatabaseDriver;

  /**
   * Unique name for this data source.
   * Used for registration in DataSourceRegistry.
   * @default "default"
   */
  name?: string;

  /**
   * Whether this should be the default data source.
   * @default true
   */
  isDefault?: boolean;

  /**
   * Database name (required).
   */
  database: string;

  /**
   * Enable database operation logging (queries, execution time, parameters).
   * Highly recommended to keep this disabled in production to prevent sensitive data leakage.
   *
   * @default false
   */
  logging?: boolean;

  // ============================================================================
  // CONNECTION DETAILS (Shared across drivers)
  // ============================================================================

  /**
   * Database connection URI.
   * Alternative to specifying host/port separately.
   *
   * @example "mongodb://localhost:27017/mydb"
   * @example "postgresql://user:pass@localhost:5432/mydb"
   */
  uri?: string;

  /**
   * Database host.
   * @default "localhost"
   */
  host?: string;

  /**
   * Database port.
   * @default 27017 (MongoDB), 5432 (PostgreSQL)
   */
  port?: number;

  /**
   * Database username for authentication.
   */
  username?: string;

  /**
   * Database password for authentication.
   */
  password?: string;

  /**
   * Authentication source database.
   * Typically "admin" for MongoDB.
   */
  authSource?: string;

  // ============================================================================
  // DRIVER OPTIONS (Package-level, driver-specific)
  // ============================================================================

  /**
   * Driver-specific options.
   *
   * For MongoDB: { autoGenerateId, counterCollection, transactionOptions }
   * For PostgreSQL: { schema, ... }
   */
  driverOptions?: TDriverOptions;

  // ============================================================================
  // CLIENT OPTIONS (Native database client library)
  // ============================================================================

  /**
   * Native database client options.
   *
   * For MongoDB: MongoClientOptions from 'mongodb' package
   * For PostgreSQL: PoolConfig from 'pg' package
   */
  clientOptions?: TClientOptions;

  // ============================================================================
  // MODEL OPTIONS (Model defaults)
  // ============================================================================

  /**
   * Default model configuration for all models using this data source.
   *
   * These settings override driver defaults but are overridden by
   * individual model static properties.
   *
   * **Configuration Hierarchy (highest to lowest):**
   * 1. Model static property - `User.createdAtColumn = "creation_date"`
   * 2. **modelOptions (this)** - Database-wide overrides
   * 3. Driver defaults - PostgreSQL: snake_case, MongoDB: camelCase
   * 4. Framework defaults - Fallback values
   *
   * @example
   * ```typescript
   * // PostgreSQL database with custom settings
   * {
   *   driver: "postgres",
   *   modelOptions: {
   *     // Override PostgreSQL default (snake_case) to use camelCase
   *     namingConvention: "camelCase",
   *     createdAtColumn: "createdAt",
   *     updatedAtColumn: "updatedAt",
   *
   *     // ID generation settings (for MongoDB)
   *     randomIncrement: true,
   *     initialId: 1000,
   *
   *     // Deletion settings
   *     deleteStrategy: "soft",
   *     trashTable: "archive", // All models use same trash table
   *   }
   * }
   *
   * // MongoDB database with defaults
   * {
   *   driver: "mongodb",
   *   modelOptions: {
   *     // MongoDB already uses camelCase by default
   *     randomIncrement: true,
   *     initialId: 10000,
   *     deleteStrategy: "trash", // Use RecycleBin
   *   }
   * }
   * ```
   */
  modelOptions?: ModelDefaultConfig;

  /**
   * Migration-level defaults (UUID strategy, etc.).
   *
   * These defaults override driver migration defaults but can be
   * overridden by individual migration calls.
   *
   * @default undefined (uses driver defaults)
   *
   * @example
   * ```typescript
   * migrationDefaults: {
   *   uuidStrategy: "v7", // Use UUID v7 for all migrations
   * }
   * ```
   */
  migrationOptions?: MigrationDefaults;

  // ============================================================================
  // DATA SOURCE DEFAULTS
  // ============================================================================

  /**
   * Default delete strategy for models using this data source.
   *
   * - MongoDB: Typically `"trash"` (uses RecycleBin collection)
   * - PostgreSQL: Typically `"permanent"` or `"soft"`
   *
   * Can be overridden by model static property or destroy() options.
   *
   * @default undefined (falls back to "permanent")
   */
  defaultDeleteStrategy?: DeleteStrategy;

  /**
   * Default trash table/collection name for "trash" delete strategy.
   *
   * - MongoDB: Typically `"RecycleBin"`
   * - If not set, defaults to `{table}Trash` pattern
   *
   * Can be overridden by Model.trashTable static property.
   *
   * @default undefined (uses {table}Trash pattern)
   */
  defaultTrashTable?: string;

  // ============================================================================
  // MIGRATION OPTIONS
  // ============================================================================

  /**
   * Migration configuration options.
   */
  migrations?: {
    /**
     * Whether to wrap migrations in database transactions.
     *
     * Overrides driver defaults:
     * - PostgreSQL default: `true` (DDL is transactional)
     * - MongoDB default: `false` (DDL cannot be transactional)
     *
     * Individual migrations can override this with their own `transactional` property.
     *
     * @default undefined (uses driver default)
     */
    transactional?: boolean;

    /**
     * Name of the migrations tracking table/collection.
     *
     * @default "_migrations"
     */
    table?: string;
  };
};

/**
 * Connect to a database and register the data source.
 *
 * This is a high-level utility function that simplifies database connection
 * for small to medium projects. It handles driver instantiation, connection,
 * data source creation, and automatic registration.
 *
 * **Supported Drivers:**
 * - `mongodb` (default) - MongoDB driver with optional auto ID generation
 * - `postgres` - PostgreSQL driver (not yet implemented)
 * - `mysql` - MySQL driver (not yet implemented)
 *
 * **Features:**
 * - Automatic driver instantiation based on driver name
 * - Connection establishment and error handling
 * - DataSource creation and registration
 * - Support for MongoDB-specific features (ID generation, transactions)
 *
 * @param options - Connection configuration options
 * @returns A connected and registered DataSource instance
 * @throws {Error} If connection fails or driver is not implemented
 *
 * @example
 * ```typescript
 * // MongoDB with new structure
 * const dataSource = await connectToDatabase({
 *   driver: "mongodb",
 *   database: "myapp",
 *   host: "localhost",
 *   port: 27017,
 *   driverOptions: {
 *     autoGenerateId: true,
 *   },
 *   clientOptions: {
 *     minPoolSize: 5,
 *     maxPoolSize: 10,
 *   },
 *   modelOptions: {
 *     randomIncrement: true,
 *     initialId: 1000,
 *   },
 * });
 * ```
 */
export async function connectToDatabase<TDriverOptions = any, TClientOptions = any>(
  options: ConnectionOptions<TDriverOptions, TClientOptions>,
): Promise<DataSource> {
  // Default values
  const driverType = options.driver ?? "mongodb";
  const dataSourceName = options.name ?? "default";
  const isDefault = options.isDefault ?? true;

  // Create driver based on type
  let driver: DriverContract;

  switch (driverType) {
    case "mongodb": {
      driver = new MongoDbDriver(
        {
          database: options.database,
          uri: options.uri,
          host: options.host,
          port: options.port,
          username: options.username,
          password: options.password,
          authSource: options.authSource,
          logging: options.logging,
          clientOptions: options.clientOptions as any,
        },
        options.driverOptions as any,
      );
      break;
    }

    case "postgres": {
      driver = new PostgresDriver({
        database: options.database,
        connectionString: options.uri,
        host: options.host,
        port: options.port ?? 5432,
        user: options.username,
        password: options.password,
        logging: options.logging,
        // Spread any additional client options (pool settings, SSL, etc.)
        ...(options.clientOptions as object),
      });
      break;
    }

    case "mysql":
      throw new Error("MySQL driver is not yet implemented. Coming soon!");

    default:
      throw new Error(
        `Unknown driver: "${driverType}". Supported drivers: mongodb, postgres, mysql`,
      );
  }

  // Create data source
  const dataSource = new DataSource({
    name: dataSourceName,
    driver,
    isDefault,
    defaultDeleteStrategy: options.defaultDeleteStrategy,
    defaultTrashTable: options.defaultTrashTable,
    modelDefaults: options.modelOptions,
    migrationDefaults: options.migrationOptions,
    migrations: options.migrations,
  });

  // Register data source
  dataSourceRegistry.register(dataSource);

  // Connect to the database
  try {
    await driver.connect();
  } catch (error) {
    console.log(error);

    throw new Error(
      `Failed to connect to ${driverType} database: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return dataSource;
}

/**
 * Get current driver instance.
 *
 * @example
 * ```typescript
 * const driver = getDatabaseDriver();
 *
 * // Pass type to return Postgres driver type
 * const pgDriver = getDatabaseDriver<PostgresDriver>();
 * ```
 */
export function getDatabaseDriver<T extends DriverContract = any>(): T {
  const driver = dataSourceRegistry.get().driver;

  return driver as unknown as T;
}

/**
 * Perform database transaction(s)
 * Shorthand to `dataSourceRegister.get().driver.transaction
 */
export async function transaction<T = any>(
  fn: (ctx: TransactionContext) => Promise<T>,
  options?: Record<string, unknown>,
): Promise<T> {
  return getDatabaseDriver().transaction(fn, options);
}
