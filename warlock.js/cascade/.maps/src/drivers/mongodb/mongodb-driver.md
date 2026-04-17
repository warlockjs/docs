# mongodb-driver
source: drivers/mongodb/mongodb-driver.ts
description: MongoDB driver implementation fulfilling the Cascade DriverContract (CRUD, transactions, lifecycle, sync, migration).
complexity: complex
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-opus-4-7
last-updated-by: claude-opus-4-7

## Imports
- `colors` from `@mongez/copper`
- `log` from `@warlock.js/logger`
- `BulkWriteOptions, ClientSession, Db, DeleteOptions, FindOneAndDeleteOptions, FindOneAndUpdateOptions, InsertManyResult, InsertOneOptions, MongoClient, MongoClientOptions, TransactionOptions, UpdateFilter, UpdateOptions` (types) from `mongodb`
- `EventEmitter` from `node:events`
- `databaseTransactionContext` from `../../context/database-transaction-context`
- `DriverBlueprintContract, DriverContract, DriverEvent, DriverEventListener, DriverTransactionContract, IdGeneratorContract, InsertResult, MigrationDriverContract, QueryBuilderContract, SyncAdapterContract, TransactionContext, UpdateOperations, UpdateResult` (types) from `../../contracts`
- `dataSourceRegistry` from `../../data-source/data-source-registry`
- `DatabaseDirtyTracker` from `../../database-dirty-tracker`
- `TransactionRollbackError` from `../../errors/transaction-rollback.error`
- `SQLSerializer` (type) from `../../migration/sql-serializer`
- `ModelDefaults` (type) from `../../types`
- `isValidDateValue` from `../../utils/is-valid-date-value`
- `MongoDBBlueprint` from `./mongodb-blueprint`
- `MongoIdGenerator` from `./mongodb-id-generator`
- `MongoMigrationDriver` from `./mongodb-migration-driver`
- `MongoQueryBuilder` from `./mongodb-query-builder`
- `MongoSyncAdapter` from `./mongodb-sync-adapter`
- `MongoDriverOptions` (type) from `./types`

## Exports
- `isMongoDBDriverLoaded` — Returns whether the dynamic `mongodb` package import succeeded (`true | false | null`).  [lines 100-102]
- `MongoDbDriver` — MongoDB driver class implementing `DriverContract`.  [lines 122-1113]

## Classes / Functions / Types / Constants

### `DEFAULT_TRANSACTION_OPTIONS` [lines 48-52]
- Module-level constant `TransactionOptions` defaulting to `readPreference: "primary"`, `readConcern: { level: "local" }`, `writeConcern: { w: "majority" }`.

### `MONGODB_INSTALL_INSTRUCTIONS` [lines 72-82]
- Module-level error message string thrown when the `mongodb` package is not installed.

### `isMongoDBDriverLoaded(): boolean | null` [lines 100-102]
- Returns the cached module-load flag indicating whether the MongoDB SDK was dynamically imported.

### `MongoDbDriver` [lines 122-1113]
- Concrete `DriverContract` implementation wrapping the native MongoDB Node.js driver.
- Manages a `MongoClient`/`Db`, emits lifecycle events via an internal `EventEmitter`, and lazily instantiates a blueprint, sync adapter, migration driver, and ID generator.
- Public fields: `client?: MongoClient`, `database?: Db`, readonly `name = "mongodb"`, readonly `modelDefaults: Partial<ModelDefaults>` (camelCase fields, timestamps on, `autoGenerateId: true`, `deleteStrategy: "trash"`, per-collection `trashTable` suffix).

#### `get blueprint(): DriverBlueprintContract` [lines 133-139]
- Lazily constructs and caches a `MongoDBBlueprint` bound to the active `Db`.

#### `constructor(config: { database; uri?; host?; port?; username?; password?; authSource?; logging?; clientOptions? }, driverOptions?: MongoDriverOptions)` [lines 178-196]
- Stores the connection config and driver options; merges `DEFAULT_TRANSACTION_OPTIONS` with `driverOptions?.transactionOptions`.

#### `get databaseName(): string | undefined` [lines 201-207]
- Returns the resolved database name, triggering `resolveDatabaseName` on first access (reads `config.database` or parses the URI).

#### `get isConnected(): boolean` [lines 223-225]
- Returns `true` when the driver holds an active connection.

#### `getDatabase(): Db` [lines 239-246]
- Returns the MongoDB `Db` instance; throws if not connected.

#### `getIdGenerator(): IdGeneratorContract | undefined` [lines 263-275]
- Returns a cached `MongoIdGenerator`, or `undefined` when `driverOptions.autoGenerateId === false`.

#### `connect(): Promise<void>` [lines 281-369]
- Asserts the SDK is loaded, resolves URI, builds client options, opens the connection, and attaches `close`/`commandStarted`/`commandSucceeded`/`commandFailed` listeners when `config.logging` is set. Emits `connected` on success and `disconnected` on failure/close.

#### `disconnect(): Promise<void>` [lines 374-385]
- Closes the underlying `MongoClient`, clears the connected flag, and emits `disconnected`.

#### `on(event: DriverEvent, listener: DriverEventListener): void` [lines 390-392]
- Subscribes a listener to driver lifecycle events via the internal `EventEmitter`.

#### `insert(table: string, document: Record<string, unknown>, options?: Record<string, unknown>): Promise<InsertResult>` [lines 397-412]
- Inserts a single document via `collection.insertOne` (with active session attached); returns the document merged with `_id: result.insertedId`.

#### `insertMany(table: string, documents: Record<string, unknown>[], options?: Record<string, unknown>): Promise<InsertResult[]>` [lines 417-439]
- Inserts multiple documents via `collection.insertMany` and maps each back with its generated `_id`.

#### `update(table: string, filter: Record<string, unknown>, update: Record<string, unknown>, options?: Record<string, unknown>): Promise<UpdateResult>` [lines 444-459]
- Runs `collection.updateOne` with the session-attached options; returns `{ modifiedCount }`.

#### `replace<T = unknown>(table: string, filter: Record<string, unknown>, document: Record<string, unknown>, options?: Record<string, unknown>): Promise<T | null>` [lines 464-474]
- Calls `collection.findOneAndReplace` and returns the previous document's `value` (cast to `T`).

#### `findOneAndUpdate<T = unknown>(table: string, filter: Record<string, unknown>, update: UpdateOperations, options?: Record<string, unknown>): Promise<T | null>` [lines 479-493]
- Executes `findOneAndUpdate` with `returnDocument: "after"`; returns the updated document.

#### `upsert<T = unknown>(table: string, filter: Record<string, unknown>, document: Record<string, unknown>, options?: Record<string, unknown>): Promise<T>` [lines 506-525]
- Performs a `findOneAndUpdate` with `{ $set: document }`, `upsert: true`, and `returnDocument: "after"`.

#### `findOneAndDelete<T = unknown>(table: string, filter: Record<string, unknown>, options?: Record<string, unknown>): Promise<T | null>` [lines 535-546]
- Deletes one matching document and returns it (or `null`).

#### `updateMany(table: string, filter: Record<string, unknown>, update: UpdateOperations, options?: Record<string, unknown>): Promise<UpdateResult>` [lines 551-566]
- Executes `collection.updateMany`; returns `{ modifiedCount }`.

#### `delete(table: string, filter?: Record<string, unknown>, options?: Record<string, unknown>): Promise<number>` [lines 571-581]
- Executes `collection.deleteOne`; returns `1` when a document was deleted, otherwise `0`.

#### `deleteMany(table: string, filter?: Record<string, unknown>, options?: Record<string, unknown>): Promise<number>` [lines 586-597]
- Executes `collection.deleteMany`; returns the `deletedCount`.

#### `truncateTable(table: string, options?: Record<string, unknown>): Promise<number>` [lines 606-612]
- Empties a collection by calling `deleteMany({})`; returns the deletion count.

#### `serialize(data: Record<string, unknown>): Record<string, unknown>` [lines 617-640]
- Normalises values for storage: skips `undefined`, stringifies `ObjectId`/`Date`/`bigint`, preserves nested objects. (Note: constructs a `serialized` record but returns the original `data` object — apparent bug.)

#### `getDirtyTracker(data: Record<string, unknown>): DatabaseDirtyTracker` [lines 645-647]
- Returns a fresh `DatabaseDirtyTracker` wrapping the provided data.

#### `deserialize(data: Record<string, unknown>): Record<string, unknown>` [lines 652-665]
- Re-hydrates a document: converts string `_id` back to `ObjectId` and inflates ISO-style date strings to `Date` via `isValidDateValue`.

#### `queryBuilder<T = unknown>(table: string): QueryBuilderContract<T>` [lines 670-672]
- Returns a new `MongoQueryBuilder` bound to the table and the active data source.

#### `beginTransaction(): Promise<DriverTransactionContract<ClientSession>>` [lines 677-715]
- Starts a session and transaction, enters `databaseTransactionContext`, and returns `{ context, commit, rollback }`. The internal `finalize` guarantees `endSession` and context cleanup; `commit` aborts on failure.

#### `transaction<T>(fn: (ctx: TransactionContext) => Promise<T>, options?: Record<string, unknown>): Promise<T>` [lines 732-786]
- Executes `fn(ctx)` inside an auto-committed transaction. Prevents nested `transaction()` calls, asserts replica-set availability, auto-rolls-back on any error (including `ctx.rollback(reason)` via `TransactionRollbackError`), and guarantees session/context cleanup.

#### `atomic(table: string, filter: Record<string, unknown>, operations: Record<string, unknown>, options?: Record<string, unknown>): Promise<UpdateResult>` [lines 793-808]
- Applies atomic update operators (e.g. `$inc`, `$set`) to all matched documents via `updateMany`.

#### `syncAdapter(): SyncAdapterContract` [lines 815-821]
- Returns the cached `MongoSyncAdapter` (created on first call, bound to this driver).

#### `migrationDriver(): MigrationDriverContract` [lines 827-833]
- Returns the cached `MongoMigrationDriver` (created on first call).

#### `getClient<Client = MongoClient>(): Client` [lines 838-840]
- Returns the underlying `MongoClient` cast to `Client`; throws if disconnected.

#### `getSQLSerializer(): SQLSerializer` [lines 967-969]
- Not supported — always throws `"MongoDB driver does not support SQL serialization."`.

#### `query<T = unknown>(_sql: string, _params?: unknown[]): Promise<any>` [lines 975-977]
- Not supported — always throws `"MongoDB driver does not support raw SQL queries."`.

#### `createDatabase(name: string): Promise<boolean>` [lines 992-1013]
- Creates a database by creating and dropping an `__init__` collection; returns `false` if it already exists.

#### `dropDatabase(name: string): Promise<boolean>` [lines 1021-1037]
- Drops the named database; returns `false` when it does not exist.

#### `databaseExists(name: string): Promise<boolean>` [lines 1045-1050]
- Uses the admin interface's `listDatabases` to check whether `name` is present.

#### `listDatabases(): Promise<string[]>` [lines 1057-1064]
- Returns the list of user database names (excludes `admin`, `local`, `config`).

#### `dropTable(name: string): Promise<void>` [lines 1076-1080]
- Drops a collection by name and logs success; throws if the collection does not exist.

#### `dropTableIfExists(name: string): Promise<void>` [lines 1087-1091]
- Drops a collection only if `blueprint.tableExists(name)` returns `true`.

#### `dropAllTables(): Promise<void>` [lines 1098-1112]
- Lists every collection via the blueprint and drops each one (used by `migrate:fresh`).
