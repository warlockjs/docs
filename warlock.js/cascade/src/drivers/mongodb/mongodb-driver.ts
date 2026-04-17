import { colors } from "@mongez/copper";
import { log } from "@warlock.js/logger";
import type {
  BulkWriteOptions,
  ClientSession,
  Db,
  DeleteOptions,
  FindOneAndDeleteOptions,
  FindOneAndUpdateOptions,
  InsertManyResult,
  InsertOneOptions,
  MongoClient,
  MongoClientOptions,
  TransactionOptions,
  UpdateFilter,
  UpdateOptions,
} from "mongodb";
import { EventEmitter } from "node:events";
import { databaseTransactionContext } from "../../context/database-transaction-context";
import type {
  DriverBlueprintContract,
  DriverContract,
  DriverEvent,
  DriverEventListener,
  DriverTransactionContract,
  IdGeneratorContract,
  InsertResult,
  MigrationDriverContract,
  QueryBuilderContract,
  SyncAdapterContract,
  TransactionContext,
  UpdateOperations,
  UpdateResult,
} from "../../contracts";
import { dataSourceRegistry } from "../../data-source/data-source-registry";
import { DatabaseDirtyTracker } from "../../database-dirty-tracker";
import { TransactionRollbackError } from "../../errors/transaction-rollback.error";
import { type SQLSerializer } from "../../migration/sql-serializer";
import type { ModelDefaults } from "../../types";
import { isValidDateValue } from "../../utils/is-valid-date-value";
import { MongoDBBlueprint } from "./mongodb-blueprint";
import { MongoIdGenerator } from "./mongodb-id-generator";
import { MongoMigrationDriver } from "./mongodb-migration-driver";
import { MongoQueryBuilder } from "./mongodb-query-builder";
import { MongoSyncAdapter } from "./mongodb-sync-adapter";
import type { MongoDriverOptions } from "./types";

const DEFAULT_TRANSACTION_OPTIONS: TransactionOptions = {
  readPreference: "primary",
  readConcern: { level: "local" },
  writeConcern: { w: "majority" },
};

// ============================================================
// Lazy-loaded MongoDB SDK Types
// ============================================================

/**
 * Cached MongoDB module (loaded once, reused)
 */
let MongoDBClient: typeof import("mongodb");

let ObjectId: typeof import("mongodb").ObjectId;

let isModuleExists: boolean | null = null;

let loadingPromise: Promise<any>;

/**
 * Installation instructions for MongoDB package
 */
const MONGODB_INSTALL_INSTRUCTIONS = `
MongoDB driver requires the mongodb package.
Install it with:

  npm install mongodb

Or with your preferred package manager:

  pnpm add mongodb
  yarn add mongodb
`.trim();

/**
 * Load MongoDB module
 */
async function loadMongoDB() {
  try {
    loadingPromise = import("mongodb");
    MongoDBClient = await loadingPromise;
    ObjectId = MongoDBClient.ObjectId;
    isModuleExists = true;
  } catch {
    isModuleExists = false;
  }
}

loadMongoDB();

export function isMongoDBDriverLoaded() {
  return isModuleExists;
}

async function assertModuleIsLoaded() {
  if (isModuleExists === false) {
    throw new Error(MONGODB_INSTALL_INSTRUCTIONS);
  }

  if (isModuleExists === null) {
    await loadingPromise;

    return await assertModuleIsLoaded();
  }
}

/**
 * MongoDB driver implementation that fulfils the Cascade driver contract.
 *
 * It encapsulates the native Mongo client, exposes lifecycle events, and
 * provides helpers for CRUD, transactions, atomic updates, and sync adapters.
 */
export class MongoDbDriver implements DriverContract {
  private readonly events = new EventEmitter();
  public client?: MongoClient;
  public database?: Db;
  private connected = false;
  private syncAdapterInstance?: MongoSyncAdapter;
  private migrationDriverInstance?: MigrationDriverContract;
  private readonly transactionOptions: TransactionOptions;
  private idGeneratorInstance?: IdGeneratorContract;
  private _blueprint?: DriverBlueprintContract;

  public get blueprint(): DriverBlueprintContract {
    if (!this._blueprint) {
      this._blueprint = new MongoDBBlueprint(this.database!);
    }

    return this._blueprint!;
  }

  /**
   * The name of this driver.
   */
  public readonly name = "mongodb";

  /**
   * Current database name
   */
  protected _databaseName?: string;

  /**
   * MongoDB driver model defaults.
   *
   * MongoDB follows NoSQL conventions:
   * - camelCase naming for fields (createdAt, updatedAt, deletedAt)
   * - Manual ID generation (auto-increment id field separate from _id)
   * - Timestamps enabled by default
   * - Trash delete strategy with per-collection trash tables
   */
  public readonly modelDefaults: Partial<ModelDefaults> = {
    namingConvention: "camelCase",
    createdAtColumn: "createdAt",
    updatedAtColumn: "updatedAt",
    deletedAtColumn: "deletedAt",
    timestamps: true,
    autoGenerateId: true, // MongoDB needs manual ID generation
    strictMode: "strip",
    deleteStrategy: "trash",
    trashTable: (table) => `${table}Trash`, // Per-collection trash (usersTrash, productsTrash)
  };

  /**
   * Create a new MongoDB driver using the supplied connection options.
   *
   * @param config - Connection configuration
   * @param driverOptions - Driver-specific options
   */
  public constructor(
    private readonly config: {
      database: string;
      uri?: string;
      host?: string;
      port?: number;
      username?: string;
      password?: string;
      authSource?: string;
      logging?: boolean;
      clientOptions?: MongoClientOptions;
    },
    private readonly driverOptions?: MongoDriverOptions,
  ) {
    this.transactionOptions = {
      ...DEFAULT_TRANSACTION_OPTIONS,
      ...driverOptions?.transactionOptions,
    };
  }

  /**
   * Get data base name
   */
  public get databaseName(): string | undefined {
    if (!this._databaseName) {
      this.resolveDatabaseName();
    }

    return this._databaseName;
  }

  /**
   * Resolve database name either from config or uri
   */
  private resolveDatabaseName() {
    if (this.config.database) {
      this._databaseName = this.config.database;
    } else if (this.config.uri) {
      this._databaseName = this.config.uri.split("/").pop()?.split("?")?.[0];
    }
  }

  /**
   * Indicates whether the driver currently maintains an active connection.
   */
  public get isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get the MongoDB database instance.
   *
   * @returns The MongoDB Db instance
   * @throws {Error} If not connected
   *
   * @example
   * ```typescript
   * const db = driver.getDatabase();
   * const collection = db.collection("users");
   * ```
   */
  public getDatabase(): Db {
    if (!this.database) {
      throw new Error(
        "Database not available. Ensure the driver is connected before accessing the database.",
      );
    }
    return this.database;
  }

  /**
   * Get the ID generator instance for this driver.
   *
   * Creates a MongoIdGenerator on first access if autoGenerateId is enabled.
   *
   * @returns The ID generator instance, or undefined if disabled
   *
   * @example
   * ```typescript
   * const idGenerator = driver.getIdGenerator();
   * if (idGenerator) {
   *   const id = await idGenerator.generateNextId({ table: "users" });
   * }
   * ```
   */
  public getIdGenerator(): IdGeneratorContract | undefined {
    // Return undefined if ID generation is disabled
    if (this.driverOptions?.autoGenerateId === false) {
      return undefined;
    }

    // Create ID generator lazily on first access
    if (!this.idGeneratorInstance) {
      this.idGeneratorInstance = new MongoIdGenerator(this, this.driverOptions?.counterCollection);
    }

    return this.idGeneratorInstance;
  }

  /**
   * Establish a MongoDB connection using the configured options.
   * Throws if the connection attempt fails.
   */
  public async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    await assertModuleIsLoaded();

    const uri = this.resolveUri();

    const { MongoClient, ObjectId: ObjectIdMongoDB } = MongoDBClient;

    ObjectId = ObjectIdMongoDB;

    const client = new MongoClient(uri, this.buildClientOptions());

    try {
      log.info(
        "database.mongodb",
        "connection",
        `Connecting to database ${colors.bold(colors.yellowBright(this.databaseName))}`,
      );
      await client.connect();
      this.client = client;
      this.database = client.db(this.databaseName);

      this.connected = true;
      log.success("database.mongodb", "connection", "Connected to database");

      client.on("close", () => {
        if (this.connected) {
          this.connected = false;
          this.emit("disconnected");
          log.warn("database.mongodb", "connection", "Disconnected from database");
        }
      });

      if (this.config.logging) {
        const ignoredCommands = ["isMaster", "hello", "ping", "saslStart", "saslContinue"];

        client.on("commandStarted", (event: any) => {
          if (ignoredCommands.includes(event.commandName)) return;

          let cmdStr = JSON.stringify(event.command);
          if (cmdStr.length > 300) {
            cmdStr = cmdStr.substring(0, 300) + "...";
          }

          log.info({
            module: "database.mongodb",
            action: "query.executing",
            message: `[${event.commandName}] ${cmdStr}`,
            context: { command: event.command },
          });
        });

        client.on("commandSucceeded", (event: any) => {
          if (ignoredCommands.includes(event.commandName)) return;

          log.success({
            module: "database.mongodb",
            action: "query.executed",
            message: `[${event.duration.toFixed(2)}ms] [${event.commandName}]`,
          });
        });

        client.on("commandFailed", (event: any) => {
          if (ignoredCommands.includes(event.commandName)) return;

          log.error({
            module: "database.mongodb",
            action: "query.error",
            message: `[${event.duration.toFixed(2)}ms] [${event.commandName}]`,
            context: { failure: event.failure },
          });
        });
      }

      this.emit("connected");
    } catch (error: any) {
      await client.close().catch(() => undefined);
      this.emit("disconnected");
      log.error(
        "database.mongodb",
        "connection",
        `Failed to connect to database: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Close the underlying MongoDB connection.
   */
  public async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.close();
    } finally {
      this.connected = false;
      this.emit("disconnected");
    }
  }

  /**
   * Subscribe to driver lifecycle events.
   */
  public on(event: DriverEvent, listener: DriverEventListener): void {
    this.events.on(event, listener);
  }

  /**
   * Insert a single document into the given collection.
   */
  public async insert(
    table: string,
    document: Record<string, unknown>,
    options?: Record<string, unknown>,
  ): Promise<InsertResult> {
    const collection = this.getDatabaseInstance().collection(table);
    const mongoOptions = this.withSession<InsertOneOptions>(options);
    const result = await collection.insertOne(document, mongoOptions);

    return {
      document: {
        ...document,
        _id: result.insertedId,
      },
    };
  }

  /**
   * Insert multiple documents into the given collection.
   */
  public async insertMany(
    table: string,
    documents: Record<string, unknown>[],
    options?: Record<string, unknown>,
  ): Promise<InsertResult[]> {
    const collection = this.getDatabaseInstance().collection(table);
    const mongoOptions = this.withSession<BulkWriteOptions>(options);
    const result: InsertManyResult<Record<string, unknown>> = await collection.insertMany(
      documents,
      mongoOptions,
    );

    return documents.map((document, index) => {
      const insertedId = result.insertedIds[index as unknown as keyof typeof result.insertedIds];

      return {
        document: {
          ...document,
          _id: insertedId,
        },
      };
    });
  }

  /**
   * Update a single document that matches the provided filter.
   */
  public async update(
    table: string,
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
    options?: Record<string, unknown>,
  ): Promise<UpdateResult> {
    const collection = this.getDatabaseInstance().collection(table);
    const mongoOptions = this.withSession<UpdateOptions>(options);
    const result = await collection.updateOne(
      filter,
      update as UpdateFilter<Record<string, unknown>>,
      mongoOptions,
    );

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Replace a single document that matches the provided filter.
   */
  public async replace<T = unknown>(
    table: string,
    filter: Record<string, unknown>,
    document: Record<string, unknown>,
    options?: Record<string, unknown>,
  ): Promise<T | null> {
    const collection = this.getDatabaseInstance().collection(table);
    const result = await collection.findOneAndReplace(filter, document as Record<string, unknown>);

    return result?.value as T | null;
  }

  /**
   * Find one and update a single document that matches the provided filter and return the updated document
   */
  public async findOneAndUpdate<T = unknown>(
    table: string,
    filter: Record<string, unknown>,
    update: UpdateOperations,
    options?: Record<string, unknown>,
  ): Promise<T | null> {
    const collection = this.getDatabaseInstance().collection(table);
    const mongoOptions = this.withSession<FindOneAndUpdateOptions>(options);
    const result = await collection.findOneAndUpdate(filter, update as Record<string, unknown>, {
      returnDocument: "after",
      ...mongoOptions,
    });

    return result as T | null;
  }

  /**
   * Upsert (insert or update) a single document.
   *
   * Uses MongoDB's findOneAndUpdate with upsert option.
   *
   * @param table - Target collection name
   * @param filter - Filter conditions to find existing document
   * @param document - Document data to insert or update
   * @param options - Optional upsert options
   * @returns The upserted document
   */
  public async upsert<T = unknown>(
    table: string,
    filter: Record<string, unknown>,
    document: Record<string, unknown>,
    options?: Record<string, unknown>,
  ): Promise<T> {
    const collection = this.getDatabaseInstance().collection(table);
    const mongoOptions = this.withSession<FindOneAndUpdateOptions>(options);

    // Use $set to update all fields from document
    const update = { $set: document };

    const result = await collection.findOneAndUpdate(filter, update, {
      upsert: true,
      returnDocument: "after",
      ...mongoOptions,
    });

    return result as T;
  }

  /**
   * Find one and delete a single document that matches the provided filter and return the deleted document.
   *
   * @param table - Target collection name
   * @param filter - Filter conditions
   * @param options - Optional delete options
   * @returns The deleted document or null if not found
   */
  public async findOneAndDelete<T = unknown>(
    table: string,
    filter: Record<string, unknown>,
    options?: Record<string, unknown>,
  ): Promise<T | null> {
    const collection = this.getDatabaseInstance().collection(table);
    const mongoOptions = this.withSession<FindOneAndDeleteOptions>(options);

    const result = await collection.findOneAndDelete(filter, mongoOptions || {});

    return result as T | null;
  }

  /**
   * Update multiple documents that match the provided filter.
   */
  public async updateMany(
    table: string,
    filter: Record<string, unknown>,
    update: UpdateOperations,
    options?: Record<string, unknown>,
  ): Promise<UpdateResult> {
    const collection = this.getDatabaseInstance().collection(table);
    const mongoOptions = this.withSession<UpdateOptions>(options);
    const result = await collection.updateMany(
      filter,
      update as UpdateFilter<Record<string, unknown>>,
      mongoOptions,
    );

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Delete a single document that matches the provided filter.
   */
  public async delete(
    table: string,
    filter: Record<string, unknown> = {},
    options?: Record<string, unknown>,
  ): Promise<number> {
    const collection = this.getDatabaseInstance().collection(table);
    const mongoOptions = this.withSession<DeleteOptions>(options);
    const result = await collection.deleteOne(filter, mongoOptions);

    return result.deletedCount > 0 ? 1 : 0;
  }

  /**
   * Delete documents that match the provided filter.
   */
  public async deleteMany(
    table: string,
    filter: Record<string, unknown> = {},
    options?: Record<string, unknown>,
  ): Promise<number> {
    const collection = this.getDatabaseInstance().collection(table);
    const mongoOptions = this.withSession<DeleteOptions>(options);

    const result = await collection.deleteMany(filter, mongoOptions);

    return result.deletedCount ?? 0;
  }

  /**
   * Remove all records from a collection.
   *
   * This uses deleteMany with an empty filter to remove all documents.
   * For very large collections, consider using the migration driver's
   * dropTable + createTable approach for better performance.
   */
  public async truncateTable(table: string, options?: Record<string, unknown>): Promise<number> {
    const collection = this.getDatabaseInstance().collection(table);
    const mongoOptions = this.withSession<DeleteOptions>(options);
    const result = await collection.deleteMany({}, mongoOptions);

    return result.deletedCount ?? 0;
  }

  /**
   * Serialize the given data
   */
  public serialize(data: Record<string, unknown>): Record<string, unknown> {
    const serialized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) {
        continue; // Skip undefined values
      }

      if (value instanceof ObjectId) {
        serialized[key] = value.toString();
      } else if (value instanceof Date) {
        serialized[key] = value.toISOString();
      } else if (typeof value === "bigint") {
        serialized[key] = value.toString();
      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        // Nested objects will be stored as JSONB
        serialized[key] = value;
      } else {
        serialized[key] = value;
      }
    }

    return serialized;
  }

  /**
   * Get the dirty tracker for this driver.
   */
  public getDirtyTracker(data: Record<string, unknown>): DatabaseDirtyTracker {
    return new DatabaseDirtyTracker(data);
  }

  /**
   * Deserialize the given data
   */
  public deserialize(data: Record<string, unknown>): Record<string, unknown> {
    if (data._id && typeof data._id === "string") {
      data._id = new ObjectId(data._id);
    }

    for (const [key, value] of Object.entries(data)) {
      // Only re-inflate strings — Mongo driver already returns Date objects from DB reads
      if (typeof value === "string" && isValidDateValue(value)) {
        data[key] = new Date(value);
      }
    }

    return data;
  }

  /**
   * Provide a Mongo-backed query builder instance for the given collection.
   */
  public queryBuilder<T = unknown>(table: string): QueryBuilderContract<T> {
    return new MongoQueryBuilder(table, dataSourceRegistry.get());
  }

  /**
   * Begin a MongoDB transaction, returning commit/rollback helpers.
   */
  public async beginTransaction(): Promise<DriverTransactionContract<ClientSession>> {
    const client = this.getClientInstance();
    const session = client.startSession();

    await session.startTransaction(this.transactionOptions);
    databaseTransactionContext.enter({ session });
    let finished = false;

    const finalize = async (operation: () => Promise<void>): Promise<void> => {
      if (finished) return;

      try {
        await operation();
      } finally {
        finished = true;
        databaseTransactionContext.exit();
        await session.endSession().catch(() => undefined);
      }
    };

    return {
      context: session,
      commit: async () => {
        await finalize(async () => {
          try {
            await session.commitTransaction();
          } catch (error) {
            await session.abortTransaction().catch(() => undefined);
            throw error;
          }
        });
      },
      rollback: async () => {
        await finalize(async () => {
          await session.abortTransaction();
        });
      },
    };
  }

  /**
   * Execute a function within a transaction scope (recommended pattern).
   *
   * Automatically commits on success, rolls back on any error, and guarantees
   * resource cleanup. This is the recommended way to use transactions.
   *
   * **MongoDB Requirements:**
   * - Requires MongoDB 4.0+ with replica set or sharded cluster
   * - Standalone MongoDB instances do not support transactions
   *
   * @param fn - Async function to execute within transaction
   * @param options - Transaction options (read preference, write concern, etc.)
   * @returns The return value of the callback function
   * @throws {Error} If transaction fails, is explicitly rolled back, or replica set not configured
   */
  public async transaction<T>(
    fn: (ctx: TransactionContext) => Promise<T>,
    options?: Record<string, unknown>,
  ): Promise<T> {
    // Prevent nested transaction() calls
    if (databaseTransactionContext.hasActiveTransaction()) {
      throw new Error(
        "Nested transaction() calls are not supported. " +
          "Use beginTransaction() with savepoints for advanced transaction patterns.",
      );
    }

    // Check if MongoDB is running as a replica set (required for transactions)
    await this.ensureReplicaSetAvailable();

    const client = this.getClientInstance();
    const session = client.startSession();

    try {
      await session.startTransaction({
        ...this.transactionOptions,
        ...(options as TransactionOptions),
      });

      // Set transaction context for queries within callback
      databaseTransactionContext.enter({ session });

      try {
        // Create transaction context with rollback method
        const ctx: TransactionContext = {
          rollback(reason?: string): never {
            throw new TransactionRollbackError(reason);
          },
        };

        // Execute callback
        const result = await fn(ctx);

        // Auto-commit on success
        await session.commitTransaction();

        return result;
      } catch (error) {
        // Auto-rollback on any error (including explicit rollback)
        await session.abortTransaction().catch(() => undefined);
        throw error;
      } finally {
        // Guaranteed context cleanup
        databaseTransactionContext.exit();
      }
    } finally {
      // Guaranteed session cleanup
      await session.endSession().catch(() => undefined);
    }
  }

  /**
   * Execute atomic operations (typically $inc/$set style updates) against documents.
   *
   * Uses `updateMany` so callers can atomically modify any set of documents.
   */
  public async atomic(
    table: string,
    filter: Record<string, unknown>,
    operations: Record<string, unknown>,
    options?: Record<string, unknown>,
  ): Promise<UpdateResult> {
    const collection = this.getDatabaseInstance().collection(table);
    const mongoOptions = this.withSession<UpdateOptions>(options);
    const result = await collection.updateMany(
      filter,
      operations as UpdateFilter<Record<string, unknown>>,
      mongoOptions,
    );

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Lazily create (and cache) the Mongo sync adapter.
   * The adapter uses this driver instance to ensure all operations
   * participate in active transactions via the session context.
   */
  public syncAdapter(): SyncAdapterContract {
    if (!this.syncAdapterInstance) {
      this.syncAdapterInstance = new MongoSyncAdapter(this);
    }

    return this.syncAdapterInstance;
  }

  /**
   * Lazily create (and cache) the Mongo migration driver.
   * The migration driver handles schema operations like indexes, collections, etc.
   */
  public migrationDriver(): MigrationDriverContract {
    if (!this.migrationDriverInstance) {
      this.migrationDriverInstance = new MongoMigrationDriver(this);
    }

    return this.migrationDriverInstance!;
  }

  /**
   * Expose the underlying Mongo client for advanced consumers.
   */
  public getClient<Client = MongoClient>(): Client {
    return this.getClientInstance() as Client;
  }

  /**
   * Retrieve the active Mongo client, throwing if the driver is disconnected.
   */
  private getClientInstance(): MongoClient {
    if (!this.client) {
      throw new Error("Mongo driver is not connected.");
    }

    return this.client;
  }

  /**
   * Retrieve the active Mongo database, throwing if the driver is disconnected.
   * @private
   */
  private getDatabaseInstance(): Db {
    if (!this.database) {
      throw new Error("Mongo driver is not connected to a database.");
    }

    return this.database;
  }

  /**
   * Resolve the Mongo connection string based on provided options.
   */
  private resolveUri(): string {
    if (this.config.uri) {
      return this.config.uri;
    }

    const host = this.config.host ?? "localhost";
    const port = this.config.port ?? 27017;

    return `mongodb://${host}:${port}`;
  }

  /**
   * Build the Mongo client options derived from the driver configuration.
   */
  private buildClientOptions(): MongoClientOptions {
    const baseOptions: MongoClientOptions = {
      ...(this.config.clientOptions ?? {}),
    };

    if (this.config.logging) {
      baseOptions.monitorCommands = true;
    }

    if (this.config.username && !baseOptions.auth) {
      baseOptions.auth = {
        username: this.config.username,
        password: this.config.password,
      };
    }

    if (this.config.authSource && !baseOptions.authSource) {
      baseOptions.authSource = this.config.authSource;
    }

    return baseOptions;
  }

  /**
   * Emit a driver lifecycle event.
   */
  private emit(event: DriverEvent, ...args: unknown[]): void {
    this.events.emit(event, ...args);
  }

  /**
   * Ensure MongoDB is running as a replica set (required for transactions).
   *
   * @throws {Error} If MongoDB is running as a standalone instance
   */
  private async ensureReplicaSetAvailable(): Promise<void> {
    try {
      const admin = this.database!.admin();
      const status = await admin.serverStatus();

      if (!status.repl) {
        throw new Error(
          "MongoDB transactions require a replica set or sharded cluster. " +
            "Standalone MongoDB instances do not support transactions.\n\n" +
            "For local development:\n" +
            "  - Run MongoDB with --replSet flag: mongod --replSet rs0\n" +
            "  - Or use Docker with replica set configuration\n" +
            "  - Or use MongoDB Atlas (cloud) which provides replica sets by default",
        );
      }
    } catch (error: any) {
      if (error.message?.includes("replica set")) {
        throw error;
      }
      throw new Error(`Failed to check MongoDB replica set status: ${error.message}`);
    }
  }

  /**
   * Attach the active transaction session (when available) to Mongo options.
   */
  private withSession<TOptions extends { session?: ClientSession }>(
    options?: Record<string, unknown>,
  ): TOptions | undefined {
    const session = databaseTransactionContext.getSession<ClientSession>();

    if (!session) {
      return options as TOptions | undefined;
    }

    const baseOptions = options ? ({ ...options } as TOptions) : ({} as TOptions);

    baseOptions.session = session;

    return baseOptions;
  }

  // ============================================================
  // SQL Compatibility Operations (Not supported in MongoDB)
  // ============================================================

  /**
   * Return a SQL serializer for this driver's dialect.
   * Not supported for MongoDB.
   */
  public getSQLSerializer(): SQLSerializer {
    throw new Error("MongoDB driver does not support SQL serialization.");
  }

  /**
   * Execute a raw SQL query.
   * Not supported for MongoDB.
   */
  public async query<T = unknown>(_sql: string, _params?: unknown[]): Promise<any> {
    throw new Error("MongoDB driver does not support raw SQL queries.");
  }

  // ============================================================
  // Database Lifecycle Operations
  // ============================================================

  /**
   * Create a new database.
   *
   * In MongoDB, databases are created automatically when data is first written.
   * This method creates an empty collection to ensure the database exists.
   *
   * @param name - Database name to create
   * @returns true if created, false if already exists
   */
  public async createDatabase(name: string): Promise<boolean> {
    const client = this.getClientInstance();

    // Check if database already exists
    if (await this.databaseExists(name)) {
      return false;
    }

    try {
      // MongoDB creates databases on first write, so create a system collection
      const db = client.db(name);
      await db.createCollection("__init__");
      // Drop the temp collection
      await db.collection("__init__").drop();

      log.success("database", "lifecycle", `Created database ${name}`);
      return true;
    } catch (error) {
      log.error("database", "lifecycle", `Failed to create database ${name}: ${error}`);
      throw error;
    }
  }

  /**
   * Drop a database.
   *
   * @param name - Database name to drop
   * @returns true if dropped, false if didn't exist
   */
  public async dropDatabase(name: string): Promise<boolean> {
    const client = this.getClientInstance();

    // Check if database exists
    if (!(await this.databaseExists(name))) {
      return false;
    }

    try {
      await client.db(name).dropDatabase();
      log.success("database", "lifecycle", `Dropped database ${name}`);
      return true;
    } catch (error) {
      log.error("database", "lifecycle", `Failed to drop database ${name}: ${error}`);
      throw error;
    }
  }

  /**
   * Check if a database exists.
   *
   * @param name - Database name to check
   * @returns true if database exists
   */
  public async databaseExists(name: string): Promise<boolean> {
    const client = this.getClientInstance();

    const result = await client.db("admin").admin().listDatabases();
    return result.databases.some((db) => db.name === name);
  }

  /**
   * List all databases.
   *
   * @returns Array of database names
   */
  public async listDatabases(): Promise<string[]> {
    const client = this.getClientInstance();

    const result = await client.db("admin").admin().listDatabases();
    return result.databases
      .map((db) => db.name)
      .filter((name) => !["admin", "local", "config"].includes(name));
  }

  // ============================================================
  // Table/Collection Management Operations
  // ============================================================

  /**
   * Drop a collection.
   *
   * @param name - Collection name to drop
   * @throws Error if collection doesn't exist
   */
  public async dropTable(name: string): Promise<void> {
    const db = this.getDatabaseInstance();
    await db.collection(name).drop();
    log.success("database", "collection", `Dropped collection ${name}`);
  }

  /**
   * Drop a collection if it exists.
   *
   * @param name - Collection name to drop
   */
  public async dropTableIfExists(name: string): Promise<void> {
    if (await this.blueprint.tableExists(name)) {
      await this.dropTable(name);
    }
  }

  /**
   * Drop all collections in the current database.
   *
   * Useful for `migrate:fresh` command.
   */
  public async dropAllTables(): Promise<void> {
    const collections = await this.blueprint.listTables();

    if (collections.length === 0) {
      return;
    }

    const db = this.getDatabaseInstance();

    for (const collection of collections) {
      await db.collection(collection).drop();
    }

    log.success("database", "collection", `Dropped ${collections.length} collections`);
  }
}
