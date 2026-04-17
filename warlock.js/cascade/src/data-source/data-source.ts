import type { DriverContract, IdGeneratorContract } from "../contracts";
import type { DeleteStrategy, MigrationDefaults, ModelDefaults } from "../types";

/**
 * Configuration options used when registering a data source.
 */
export type DataSourceOptions = {
  /** Unique name identifying the data source. */
  name: string;
  /** Driver bound to the data source. */
  driver: DriverContract;
  /** Whether this data source should be considered the default one. */
  isDefault?: boolean;
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

  /**
   * Default model configuration for all models using this data source.
   *
   * These defaults override driver defaults but are overridden by
   * individual model static properties.
   *
   * @default undefined
   */
  modelDefaults?: Partial<ModelDefaults>;

  /**
   * Migration-level defaults (UUID strategy, etc.).
   *
   * These defaults override driver migration defaults but can be
   * overridden by individual migration calls.
   *
   * @default undefined (uses driver defaults)
   */
  migrationDefaults?: MigrationDefaults;

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
 * Wrapper that couples a driver with its metadata.
 *
 * A data source represents a database connection with all its associated services.
 * The ID generator (if needed) is provided by the driver itself.
 *
 * @example
 * ```typescript
 * // MongoDB with auto ID generation
 * const mongoDriver = new MongoDbDriver({
 *   host: "localhost",
 *   port: 27017,
 *   database: "myapp",
 *   autoGenerateId: true, // Driver creates its own ID generator
 * });
 *
 * const dataSource = new DataSource({
 *   name: "primary",
 *   driver: mongoDriver,
 *   isDefault: true,
 * });
 *
 * // Access ID generator from driver
 * const idGenerator = dataSource.idGenerator;
 * ```
 */
export class DataSource {
  /** Unique name identifying this data source. */
  public readonly name: string;

  /** Database driver for executing queries. */
  public readonly driver: DriverContract;

  /** Whether this is the default data source. */
  public readonly isDefault: boolean;

  /** Default delete strategy for models using this data source. */
  public readonly defaultDeleteStrategy?: DeleteStrategy;

  /** Default trash table/collection name for "trash" delete strategy. */
  public readonly defaultTrashTable?: string;

  /** Default model configuration for all models using this data source. */
  public readonly modelDefaults?: Partial<ModelDefaults>;

  /** Migration-level defaults (UUID strategy, etc.). */
  public readonly migrationDefaults?: MigrationDefaults;

  /** Migration configuration options. */
  public readonly migrations?: {
    transactional?: boolean;
    table?: string;
  };

  /**
   * Create a new data source.
   *
   * @param options - Configuration options
   */
  public constructor(options: DataSourceOptions) {
    this.name = options.name;
    this.driver = options.driver;
    this.isDefault = Boolean(options.isDefault);
    this.defaultDeleteStrategy = options.defaultDeleteStrategy;
    this.defaultTrashTable = options.defaultTrashTable;
    this.modelDefaults = options.modelDefaults;
    this.migrationDefaults = options.migrationDefaults;
    this.migrations = options.migrations;
  }

  /**
   * Get the ID generator from the driver (if available).
   *
   * NoSQL drivers like MongoDB can provide their own ID generator.
   * SQL drivers return undefined as they use native AUTO_INCREMENT.
   *
   * @returns The ID generator instance, or undefined
   *
   * @example
   * ```typescript
   * const idGenerator = dataSource.idGenerator;
   * if (idGenerator) {
   *   const id = await idGenerator.generateNextId({ table: "users" });
   * }
   * ```
   */
  public get idGenerator(): IdGeneratorContract | undefined {
    // Check if driver has a getIdGenerator method (duck typing)
    const driver = this.driver as any;
    if (typeof driver.getIdGenerator === "function") {
      return driver.getIdGenerator();
    }
    return undefined;
  }
}
