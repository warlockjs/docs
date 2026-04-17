# mongodb-migration-driver
source: drivers/mongodb/mongodb-migration-driver.ts
description: MongoDB-specific migration driver implementing MigrationDriverContract with native collection, index, vector-search, TTL, and schema-validation operations.
complexity: complex
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-opus-4-7
last-updated-by: claude-opus-4-7

## Imports
- `ClientSession`, `CreateIndexesOptions`, `Db`, `IndexDescription` from `mongodb`
- `databaseTransactionContext` from `../../context/database-transaction-context`
- `ColumnDefinition`, `ForeignKeyDefinition`, `FullTextIndexOptions`, `GeoIndexOptions`, `IndexDefinition`, `MigrationDriverContract`, `TableIndexInformation`, `VectorIndexOptions` from `../../contracts/migration-driver.contract`
- `MigrationDefaults` from `../../types`
- `MongoDbDriver` from `./mongodb-driver`

## Exports
- `MongoMigrationDriver` — MongoDB migration driver implementing `MigrationDriverContract`  [lines 36-770]

## Classes / Functions / Types / Constants

### `MongoMigrationDriver` [lines 36-770]
- Implements `MigrationDriverContract` for MongoDB.
- Column operations are no-ops (MongoDB is schema-less), index operations use native `createIndex()`, foreign keys / primary keys / CHECK constraints are no-ops, TTL indexes supported natively, vector indexes use Atlas Search with fallback, schema validation via `collMod` command.
- Holds a `MongoDbDriver` and an optional active `ClientSession` for the driver-level transaction.

#### `constructor(driver: MongoDbDriver)` [lines 45-45]
- Stores the MongoDB driver instance as a public readonly field.

#### `createTable(table: string): Promise<void>` [lines 73-83]
- Calls `db.createCollection(table)`; swallows `NamespaceExists` errors so the call is idempotent; rethrows other errors.

#### `createTableIfNotExists(table: string): Promise<void>` [lines 88-98]
- Same behavior as `createTable`: creates collection and ignores `NamespaceExists`.

#### `dropTable(table: string): Promise<void>` [lines 105-107]
- Calls `db.dropCollection(table)`; throws if collection doesn't exist.

#### `dropTableIfExists(table: string): Promise<void>` [lines 112-118]
- Calls `db.dropCollection(table)` and swallows any errors.

#### `renameTable(from: string, to: string): Promise<void>` [lines 123-125]
- Calls `db.renameCollection(from, to)`.

#### `truncateTable(table: string): Promise<void>` [lines 132-134]
- Deletes all documents via `collection.deleteMany({})`.

#### `tableExists(table: string): Promise<boolean>` [lines 139-142]
- Checks existence by filtering `listCollections({ name: table })`.

#### `listColumns(_table: string): Promise<ColumnDefinition[]>` [lines 150-153]
- No-op — always returns `[]` because MongoDB is schema-less.

#### `listTables(): Promise<string[]>` [lines 158-161]
- Returns names of all collections via `db.listCollections().toArray()`.

#### `ensureMigrationsTable(tableName: string): Promise<void>` [lines 171-180]
- Creates the collection if missing, then creates a unique index on `name`.

#### `addColumn(_table: string, _column: ColumnDefinition): Promise<void>` [lines 191-193]
- No-op.

#### `dropColumn(table: string, column: string): Promise<void>` [lines 200-203]
- Runs `updateMany({}, { $unset: { [column]: "" } })` honoring `sessionOptions`.

#### `dropColumns(table: string, columns: string[]): Promise<void>` [lines 208-215]
- Builds a combined `$unset` object for all columns and runs `updateMany` with `sessionOptions`.

#### `renameColumn(table: string, from: string, to: string): Promise<void>` [lines 220-223]
- Runs `updateMany({}, { $rename: { [from]: to } })` with `sessionOptions`.

#### `modifyColumn(_table: string, _column: ColumnDefinition): Promise<void>` [lines 230-232]
- No-op.

#### `createTimestampColumns(_table: string): Promise<void>` [lines 242-244]
- No-op — timestamps handled at application level.

#### `createIndex(table: string, index: IndexDefinition): Promise<void>` [lines 256-292]
- Silently skips expression-based indexes; ignores `include`/`concurrently` (PostgreSQL-specific).
- Builds key spec from `index.columns` with per-column `asc`/`desc` direction (defaults to `1`).
- Maps options: `name`, `unique`, `sparse`, and `where` -> `partialFilterExpression`.
- Invokes `collection.createIndex(indexSpec, options)`.

#### `dropIndex(table: string, indexNameOrColumns: string | string[]): Promise<void>` [lines 299-311]
- Accepts a string or columns array; when columns supplied, generates Mongo-style name `col1_1_col2_1`.
- Calls `collection.dropIndex(indexName)`.

#### `createUniqueIndex(table: string, columns: string[], name?: string): Promise<void>` [lines 316-322]
- Delegates to `createIndex` with `unique: true`.

#### `dropUniqueIndex(table: string, columns: string[]): Promise<void>` [lines 327-341]
- Scans `collection.indexes()`; drops the first index whose keys exactly match the given columns (skipping `_id_`).

#### `createFullTextIndex(table: string, columns: string[], options?: FullTextIndexOptions): Promise<void>` [lines 352-378]
- Builds `{ [column]: "text" }` spec for each column.
- Maps `options.name`, `options.language` -> `default_language`, and `options.weights`.
- Calls `collection.createIndex`.

#### `dropFullTextIndex(table: string, name: string): Promise<void>` [lines 383-385]
- Delegates to `dropIndex(table, name)`.

#### `createGeoIndex(table: string, column: string, options?: GeoIndexOptions): Promise<void>` [lines 390-413]
- Index type defaults to `"2dsphere"`.
- Maps options: `name`, `min`, `max`.
- Calls `collection.createIndex({ [column]: indexType } as any, indexOptions)`.

#### `dropGeoIndex(table: string, column: string): Promise<void>` [lines 418-432]
- Iterates `collection.indexes()`; drops first index where `key[column]` is `"2dsphere"` or `"2d"` (skips `_id_`).

#### `createVectorIndex(table: string, column: string, options: VectorIndexOptions): Promise<void>` [lines 440-477]
- Attempts Atlas Search path: calls `(collection as any).listSearchIndexes?.()?.toArray?.()` and, if available, creates a `knnVector` search index via `createSearchIndex` with `dimensions` and `similarity` (defaults to `"cosine"`).
- Fallback: creates a regular ascending index on the column with name `options.name ?? ${column}_vector_idx`.

#### `dropVectorIndex(table: string, column: string): Promise<void>` [lines 482-507]
- Attempts to drop Atlas search indexes whose name includes the column.
- Fallback: drops `${column}_vector_idx` regular index, swallowing errors.

#### `createTTLIndex(table: string, column: string, expireAfterSeconds: number): Promise<void>` [lines 512-519]
- Creates ascending index with `{ expireAfterSeconds }` option.

#### `dropTTLIndex(table: string, column: string): Promise<void>` [lines 524-538]
- Iterates `collection.indexes()`; drops first index with the column key and a defined `expireAfterSeconds` (skips `_id_`).

#### `listIndexes(table: string): Promise<TableIndexInformation[]>` [lines 546-558]
- Maps `collection.indexes()` to `TableIndexInformation` with `type: "btree"`, `unique`, `partial` (based on `partialFilterExpression`), and options `{ sparse, expireAfterSeconds }`.

#### `addForeignKey(_table: string, _foreignKey: ForeignKeyDefinition): Promise<void>` [lines 570-572]
- No-op.

#### `dropForeignKey(_table: string, _name: string): Promise<void>` [lines 577-579]
- No-op.

#### `addPrimaryKey(_table: string, _columns: string[]): Promise<void>` [lines 586-588]
- No-op — `_id` is always the primary key.

#### `dropPrimaryKey(_table: string): Promise<void>` [lines 593-595]
- No-op — cannot drop `_id` index.

#### `addCheck(_table: string, _name: string, _expression: string): Promise<void>` [lines 603-605]
- No-op.

#### `dropCheck(_table: string, _name: string): Promise<void>` [lines 610-612]
- No-op.

#### `setSchemaValidation(table: string, schema: object): Promise<void>` [lines 635-642]
- Issues `db.command({ collMod: table, validator: { $jsonSchema: schema }, validationLevel: "strict", validationAction: "error" })`.

#### `removeSchemaValidation(table: string): Promise<void>` [lines 647-653]
- Issues `db.command({ collMod: table, validator: {}, validationLevel: "off" })`.

#### `beginTransaction(): Promise<void>` [lines 664-667]
- Calls `driver.beginTransaction()` and stores `transaction.context` as `this.session`.

#### `commit(): Promise<void>` [lines 672-678]
- Commits and ends the active session if present, then clears `this.session`.

#### `rollback(): Promise<void>` [lines 683-689]
- Aborts and ends the active session if present, then clears `this.session`.

#### `supportsTransactions(): boolean` [lines 694-696]
- Returns `true` (requires replica set at runtime).

#### `getDefaultTransactional(): boolean` [lines 707-709]
- Returns `false` — DDL operations (createCollection, createIndex, etc.) are not transactional in MongoDB.

#### `getUuidDefault(_migrationDefaults?: MigrationDefaults): undefined` [lines 724-726]
- Always returns `undefined`; UUID generation is application-level in MongoDB.

#### `isExtensionAvailable(_extension: string): Promise<boolean>` [lines 737-739]
- Returns `true` — MongoDB does not use SQL extensions.

#### `getExtensionDocsUrl(_extension: string): string | undefined` [lines 746-748]
- Returns `undefined`.

#### `raw<T>(callback: (connection: unknown) => Promise<T>): Promise<T>` [lines 767-769]
- Invokes `callback(this.db)` and returns its result — gives direct access to the MongoDB `Db` instance.
