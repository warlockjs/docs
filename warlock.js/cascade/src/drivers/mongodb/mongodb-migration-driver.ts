import type { ClientSession, CreateIndexesOptions, Db, IndexDescription } from "mongodb";
import { databaseTransactionContext } from "../../context/database-transaction-context";
import type {
  ColumnDefinition,
  ForeignKeyDefinition,
  FullTextIndexOptions,
  GeoIndexOptions,
  IndexDefinition,
  MigrationDriverContract,
  TableIndexInformation,
  VectorIndexOptions,
} from "../../contracts/migration-driver.contract";
import type { MigrationDefaults } from "../../types";
import type { MongoDbDriver } from "./mongodb-driver";

/**
 * MongoDB-specific migration driver implementation.
 *
 * Key behaviors:
 * - Column operations are **no-ops** (MongoDB is schema-less)
 * - Index operations use native `createIndex()`
 * - Foreign keys are **no-ops** (MongoDB has no FK constraints)
 * - TTL indexes supported natively
 * - Vector indexes use Atlas Search (when available)
 * - Schema validation uses `collMod` command
 *
 * @example
 * ```typescript
 * const migrationDriver = new MongoMigrationDriver(mongoDriver);
 * await migrationDriver.createIndex("users", {
 *   columns: ["email"],
 *   unique: true,
 * });
 * ```
 */
export class MongoMigrationDriver implements MigrationDriverContract {
  /** Active transaction session (if any) */
  private session?: ClientSession;

  /**
   * Create a new MongoDB migration driver.
   *
   * @param driver - The MongoDB driver instance
   */
  public constructor(public readonly driver: MongoDbDriver) {}

  /**
   * Get the MongoDB database instance.
   */
  private get db(): Db {
    return this.driver.getDatabase();
  }

  /**
   * Get session options for operations.
   */
  private get sessionOptions(): { session?: ClientSession } | undefined {
    const session = databaseTransactionContext.getSession<ClientSession>();
    return session ? { session } : undefined;
  }

  // ============================================================================
  // TABLE/COLLECTION OPERATIONS
  // ============================================================================

  /**
   * Create a new collection.
   *
   * MongoDB creates collections lazily on first insert, but this method
   * creates them explicitly for migrations that need to add indexes or
   * schema validation.
   */
  public async createTable(table: string): Promise<void> {
    try {
      await this.db.createCollection(table);
    } catch (error: any) {
      // Collection already exists - ignore
      if (error.codeName === "NamespaceExists") {
        return;
      }
      throw error;
    }
  }

  /**
   * Create table if not exists
   */
  public async createTableIfNotExists(table: string): Promise<void> {
    try {
      await this.db.createCollection(table);
    } catch (error: any) {
      // Collection already exists - ignore
      if (error.codeName === "NamespaceExists") {
        return;
      }
      throw error;
    }
  }

  /**
   * Drop an existing collection.
   *
   * @throws Error if collection doesn't exist
   */
  public async dropTable(table: string): Promise<void> {
    await this.db.dropCollection(table);
  }

  /**
   * Drop collection if it exists (no error if missing).
   */
  public async dropTableIfExists(table: string): Promise<void> {
    try {
      await this.db.dropCollection(table);
    } catch {
      // Collection doesn't exist - ignore
    }
  }

  /**
   * Rename a collection.
   */
  public async renameTable(from: string, to: string): Promise<void> {
    await this.db.renameCollection(from, to);
  }

  /**
   * Truncate a collection — remove all documents.
   *
   * @param table - Collection name
   */
  public async truncateTable(table: string): Promise<void> {
    await this.db.collection(table).deleteMany({});
  }

  /**
   * Check if a collection exists.
   */
  public async tableExists(table: string): Promise<boolean> {
    const collections = await this.db.listCollections({ name: table }).toArray();
    return collections.length > 0;
  }

  /**
   * List all columns in a collection.
   *
   * MongoDB is schema-less, so this returns an empty array.
   * For actual schema inspection, would need to sample documents.
   */
  public async listColumns(_table: string): Promise<ColumnDefinition[]> {
    // No-op: MongoDB is schema-less
    return [];
  }

  /**
   * List all collections in the current database.
   */
  public async listTables(): Promise<string[]> {
    const collections = await this.db.listCollections().toArray();
    return collections.map((col) => col.name);
  }

  /**
   * Ensure the migrations tracking collection exists.
   *
   * MongoDB creates collections lazily, but we can create explicitly
   * and add a unique index on the name field.
   *
   * @param tableName - Name of the migrations collection
   */
  public async ensureMigrationsTable(tableName: string): Promise<void> {
    // Create collection if not exists
    const exists = await this.tableExists(tableName);
    if (!exists) {
      await this.db.createCollection(tableName);
    }

    // Ensure unique index on name
    await this.db.collection(tableName).createIndex({ name: 1 }, { unique: true });
  }

  // ============================================================================
  // COLUMN OPERATIONS (No-ops for MongoDB)
  // ============================================================================

  /**
   * Add a column (no-op for MongoDB).
   *
   * MongoDB is schema-less, so columns don't need to be declared.
   */
  public async addColumn(_table: string, _column: ColumnDefinition): Promise<void> {
    // No-op: MongoDB is schema-less
  }

  /**
   * Drop a column by running $unset on all documents.
   *
   * This actually removes the field from all documents in the collection.
   */
  public async dropColumn(table: string, column: string): Promise<void> {
    const collection = this.db.collection(table);
    await collection.updateMany({}, { $unset: { [column]: "" } }, this.sessionOptions);
  }

  /**
   * Drop multiple columns by running $unset on all documents.
   */
  public async dropColumns(table: string, columns: string[]): Promise<void> {
    const collection = this.db.collection(table);
    const unsetFields: Record<string, string> = {};
    for (const column of columns) {
      unsetFields[column] = "";
    }
    await collection.updateMany({}, { $unset: unsetFields }, this.sessionOptions);
  }

  /**
   * Rename a column by running $rename on all documents.
   */
  public async renameColumn(table: string, from: string, to: string): Promise<void> {
    const collection = this.db.collection(table);
    await collection.updateMany({}, { $rename: { [from]: to } }, this.sessionOptions);
  }

  /**
   * Modify a column definition (no-op for MongoDB).
   *
   * MongoDB is schema-less, so column types don't need to be modified.
   */
  public async modifyColumn(_table: string, _column: ColumnDefinition): Promise<void> {
    // No-op: MongoDB is schema-less
  }

  /**
   * Create standard timestamp columns (created_at, updated_at).
   *
   * MongoDB implementation is a no-op since timestamps are handled
   * at the application level via Model hooks.
   *
   * @param _table - Collection name (unused)
   */
  public async createTimestampColumns(_table: string): Promise<void> {
    // No-op: MongoDB handles timestamps at application level
  }

  // ============================================================================
  // INDEX OPERATIONS
  // ============================================================================

  /**
   * Create an index on one or more columns.
   *
   * **Note**: Expression-based indexes, INCLUDE clause, and concurrent creation
   * are PostgreSQL-specific features and are silently ignored by MongoDB.
   */
  public async createIndex(table: string, index: IndexDefinition): Promise<void> {
    // Skip expression-based indexes (PostgreSQL-specific)
    if (index.expressions && index.expressions.length > 0) {
      // No-op: MongoDB doesn't support expression-based indexes
      return;
    }

    // Ignore include and concurrently options (PostgreSQL-specific)
    // MongoDB doesn't support covering indexes or concurrent creation

    const collection = this.db.collection(table);

    // Build index specification
    const indexSpec: IndexDescription["key"] = {};
    for (let i = 0; i < index.columns.length; i++) {
      const column = index.columns[i];
      const direction = index.directions?.[i] === "desc" ? -1 : 1;
      indexSpec[column] = direction;
    }

    // Build index options
    const options: CreateIndexesOptions = {};
    if (index.name) {
      options.name = index.name;
    }
    if (index.unique) {
      options.unique = true;
    }
    if (index.sparse) {
      options.sparse = true;
    }
    if (index.where) {
      options.partialFilterExpression = index.where;
    }

    await collection.createIndex(indexSpec, options);
  }

  /**
   * Drop an index by name or columns.
   *
   * @param indexNameOrColumns - Index name (string) or columns array
   */
  public async dropIndex(table: string, indexNameOrColumns: string | string[]): Promise<void> {
    const collection = this.db.collection(table);

    if (!Array.isArray(indexNameOrColumns)) {
      indexNameOrColumns = [indexNameOrColumns];
    }

    // If columns array provided, generate MongoDB-style index name
    // MongoDB creates index names like: "column1_1_column2_1"
    const indexName = indexNameOrColumns.map((col) => `${col}_1`).join("_");

    await collection.dropIndex(indexName);
  }

  /**
   * Create a unique index/constraint.
   */
  public async createUniqueIndex(table: string, columns: string[], name?: string): Promise<void> {
    await this.createIndex(table, {
      columns,
      unique: true,
      name,
    });
  }

  /**
   * Drop a unique index by finding its name from columns.
   */
  public async dropUniqueIndex(table: string, columns: string[]): Promise<void> {
    const collection = this.db.collection(table);
    const indexes = await collection.indexes();

    // Find the index that matches the columns
    for (const idx of indexes) {
      const indexKeys = Object.keys(idx.key || {});
      if (indexKeys.length === columns.length && indexKeys.every((key, i) => key === columns[i])) {
        if (idx.name && idx.name !== "_id_") {
          await collection.dropIndex(idx.name);
          return;
        }
      }
    }
  }

  // ============================================================================
  // SPECIALIZED INDEXES
  // ============================================================================

  /**
   * Create a full-text search index.
   *
   * MongoDB uses "text" index type for full-text search.
   */
  public async createFullTextIndex(
    table: string,
    columns: string[],
    options?: FullTextIndexOptions,
  ): Promise<void> {
    const collection = this.db.collection(table);

    // Build text index specification
    const indexSpec: Record<string, "text"> = {};
    for (const column of columns) {
      indexSpec[column] = "text";
    }

    // Build options
    const indexOptions: CreateIndexesOptions = {};
    if (options?.name) {
      indexOptions.name = options.name;
    }
    if (options?.language) {
      indexOptions.default_language = options.language;
    }
    if (options?.weights) {
      indexOptions.weights = options.weights;
    }

    await collection.createIndex(indexSpec, indexOptions);
  }

  /**
   * Drop a full-text search index.
   */
  public async dropFullTextIndex(table: string, name: string): Promise<void> {
    await this.dropIndex(table, name);
  }

  /**
   * Create a geo-spatial index.
   */
  public async createGeoIndex(
    table: string,
    column: string,
    options?: GeoIndexOptions,
  ): Promise<void> {
    const collection = this.db.collection(table);

    // Build geo index specification - MongoDB accepts string values for geo indexes
    const indexType = options?.type ?? "2dsphere";

    // Build options
    const indexOptions: CreateIndexesOptions = {};
    if (options?.name) {
      indexOptions.name = options.name;
    }
    if (options?.min !== undefined) {
      indexOptions.min = options.min;
    }
    if (options?.max !== undefined) {
      indexOptions.max = options.max;
    }

    await collection.createIndex({ [column]: indexType } as any, indexOptions);
  }

  /**
   * Drop a geo-spatial index.
   */
  public async dropGeoIndex(table: string, column: string): Promise<void> {
    const collection = this.db.collection(table);
    const indexes = await collection.indexes();

    // Find the geo index for this column
    for (const idx of indexes) {
      const key = idx.key || {};
      if (column in key && (key[column] === "2dsphere" || key[column] === "2d")) {
        if (idx.name && idx.name !== "_id_") {
          await collection.dropIndex(idx.name);
          return;
        }
      }
    }
  }

  /**
   * Create a vector search index for AI embeddings.
   *
   * Note: This requires MongoDB Atlas with Vector Search enabled.
   * For self-hosted MongoDB, this will create a regular index on the field.
   */
  public async createVectorIndex(
    table: string,
    column: string,
    options: VectorIndexOptions,
  ): Promise<void> {
    const collection = this.db.collection(table);

    // Try to create Atlas vector search index first
    try {
      // Check if we're on Atlas by looking for vectorSearch indexes
      const searchIndexes = await (collection as any).listSearchIndexes?.()?.toArray?.();
      if (Array.isArray(searchIndexes)) {
        // We're on Atlas - create a vector search index
        await (collection as any).createSearchIndex({
          name: options.name ?? `${column}_vector_idx`,
          definition: {
            mappings: {
              dynamic: false,
              fields: {
                [column]: {
                  type: "knnVector",
                  dimensions: options.dimensions,
                  similarity: options.similarity ?? "cosine",
                },
              },
            },
          },
        });
        return;
      }
    } catch {
      // Not on Atlas or doesn't support search indexes
    }

    // Fallback: Create a regular index on the vector field
    // This won't provide vector search capabilities but ensures the field is indexed
    await collection.createIndex({ [column]: 1 }, { name: options.name ?? `${column}_vector_idx` });
  }

  /**
   * Drop a vector search index.
   */
  public async dropVectorIndex(table: string, column: string): Promise<void> {
    const collection = this.db.collection(table);

    // Try to drop Atlas search index first
    try {
      const searchIndexes = await (collection as any).listSearchIndexes?.()?.toArray?.();
      if (Array.isArray(searchIndexes)) {
        for (const idx of searchIndexes) {
          if (idx.name?.includes(column)) {
            await (collection as any).dropSearchIndex(idx.name);
            return;
          }
        }
      }
    } catch {
      // Not on Atlas
    }

    // Fallback: Try to drop regular index
    const indexName = `${column}_vector_idx`;
    try {
      await collection.dropIndex(indexName);
    } catch {
      // Index doesn't exist
    }
  }

  /**
   * Create a TTL (time-to-live) index for automatic document expiration.
   */
  public async createTTLIndex(
    table: string,
    column: string,
    expireAfterSeconds: number,
  ): Promise<void> {
    const collection = this.db.collection(table);
    await collection.createIndex({ [column]: 1 }, { expireAfterSeconds });
  }

  /**
   * Drop a TTL index.
   */
  public async dropTTLIndex(table: string, column: string): Promise<void> {
    const collection = this.db.collection(table);
    const indexes = await collection.indexes();

    // Find the TTL index for this column
    for (const idx of indexes) {
      const key = idx.key || {};
      if (column in key && idx.expireAfterSeconds !== undefined) {
        if (idx.name && idx.name !== "_id_") {
          await collection.dropIndex(idx.name);
          return;
        }
      }
    }
  }

  /**
   * List all indexes on a collection.
   *
   * @param table - Collection name
   * @returns Array of index metadata
   */
  public async listIndexes(table: string): Promise<TableIndexInformation[]> {
    const collection = this.db.collection(table);
    const indexes = await collection.indexes();

    return indexes.map((idx) => ({
      name: idx.name ?? "",
      columns: Object.keys(idx.key ?? {}),
      type: "btree",
      unique: idx.unique ?? false,
      partial: !!idx.partialFilterExpression,
      options: { sparse: idx.sparse, expireAfterSeconds: idx.expireAfterSeconds },
    }));
  }

  // ============================================================================
  // CONSTRAINTS (No-ops for MongoDB)
  // ============================================================================

  /**
   * Add a foreign key constraint (no-op for MongoDB).
   *
   * MongoDB doesn't support foreign key constraints.
   * Use application-level validation or DBRefs instead.
   */
  public async addForeignKey(_table: string, _foreignKey: ForeignKeyDefinition): Promise<void> {
    // No-op: MongoDB doesn't support foreign keys
  }

  /**
   * Drop a foreign key constraint (no-op for MongoDB).
   */
  public async dropForeignKey(_table: string, _name: string): Promise<void> {
    // No-op: MongoDB doesn't support foreign keys
  }

  /**
   * Add a primary key constraint (no-op for MongoDB).
   *
   * MongoDB always has _id as the primary key.
   */
  public async addPrimaryKey(_table: string, _columns: string[]): Promise<void> {
    // No-op: MongoDB always has _id as primary key
  }

  /**
   * Drop the primary key constraint (no-op for MongoDB).
   */
  public async dropPrimaryKey(_table: string): Promise<void> {
    // No-op: Cannot drop _id index in MongoDB
  }

  /**
   * Add a CHECK constraint (no-op for MongoDB).
   *
   * MongoDB doesn't support CHECK constraints.
   * Use schema validation instead.
   */
  public async addCheck(_table: string, _name: string, _expression: string): Promise<void> {
    // No-op: MongoDB doesn't support CHECK constraints
  }

  /**
   * Drop a CHECK constraint (no-op for MongoDB).
   */
  public async dropCheck(_table: string, _name: string): Promise<void> {
    // No-op: MongoDB doesn't support CHECK constraints
  }

  // ============================================================================
  // SCHEMA VALIDATION (NoSQL)
  // ============================================================================

  /**
   * Set JSON schema validation rules on a collection.
   *
   * Uses MongoDB's validator feature to enforce document structure.
   *
   * @example
   * ```typescript
   * await driver.setSchemaValidation("users", {
   *   bsonType: "object",
   *   required: ["name", "email"],
   *   properties: {
   *     name: { bsonType: "string" },
   *     email: { bsonType: "string" },
   *   },
   * });
   * ```
   */
  public async setSchemaValidation(table: string, schema: object): Promise<void> {
    await this.db.command({
      collMod: table,
      validator: { $jsonSchema: schema },
      validationLevel: "strict",
      validationAction: "error",
    });
  }

  /**
   * Remove schema validation rules from a collection.
   */
  public async removeSchemaValidation(table: string): Promise<void> {
    await this.db.command({
      collMod: table,
      validator: {},
      validationLevel: "off",
    });
  }

  // ============================================================================
  // TRANSACTIONS
  // ============================================================================

  /**
   * Begin a database transaction.
   *
   * Uses the driver's transaction mechanism.
   */
  public async beginTransaction(): Promise<void> {
    const transaction = await this.driver.beginTransaction();
    this.session = transaction.context;
  }

  /**
   * Commit the current transaction.
   */
  public async commit(): Promise<void> {
    if (this.session) {
      await this.session.commitTransaction();
      await this.session.endSession();
      this.session = undefined;
    }
  }

  /**
   * Rollback the current transaction.
   */
  public async rollback(): Promise<void> {
    if (this.session) {
      await this.session.abortTransaction();
      await this.session.endSession();
      this.session = undefined;
    }
  }

  /**
   * MongoDB supports transactions (requires replica set).
   */
  public supportsTransactions(): boolean {
    return true;
  }

  /**
   * Get the default transactional behavior for MongoDB.
   *
   * MongoDB DDL operations (createCollection, createIndex, etc.) cannot
   * be wrapped in transactions, even with replica sets. Transactions only
   * work for document CRUD operations.
   *
   * @returns false (MongoDB DDL is not transactional)
   */
  public getDefaultTransactional(): boolean {
    return false;
  }

  // ============================================================================
  // DEFAULTS
  // ============================================================================

  /**
   * Get the default UUID generation expression for MongoDB.
   *
   * MongoDB does not use SQL-level UUID defaults — UUID generation
   * is handled at the application level. Always returns `undefined`.
   *
   * @param _migrationDefaults - Ignored (MongoDB handles UUIDs at app level)
   * @returns undefined
   */
  public getUuidDefault(_migrationDefaults?: MigrationDefaults): undefined {
    return undefined;
  }

  // ============================================================================
  // EXTENSIONS
  // ============================================================================

  /**
   * Check if a database extension is available (no-op for MongoDB).
   *
   * @param _extension - Extension name
   */
  public async isExtensionAvailable(_extension: string): Promise<boolean> {
    return true; // MongoDB doesn't use SQL extensions
  }

  /**
   * Get the official documentation or installation URL for a database extension.
   *
   * @param _extension - Extension name
   */
  public getExtensionDocsUrl(_extension: string): string | undefined {
    return undefined; // MongoDB doesn't use SQL extensions
  }

  // ============================================================================
  // RAW ACCESS
  // ============================================================================

  /**
   * Execute raw operations with direct database access.
   *
   * @param callback - Callback receiving the MongoDB Db instance
   * @returns Result from callback
   *
   * @example
   * ```typescript
   * await driver.raw(async (db) => {
   *   await db.collection("users").updateMany({}, { $set: { active: true } });
   * });
   * ```
   */
  public async raw<T>(callback: (connection: unknown) => Promise<T>): Promise<T> {
    return callback(this.db);
  }
}
