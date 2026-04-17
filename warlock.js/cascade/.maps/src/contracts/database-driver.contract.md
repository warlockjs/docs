# database-driver.contract
source: contracts/database-driver.contract.ts
description: Unified database driver contract defining lifecycle, CRUD, transactions, schema management, and database management operations used by the model layer.
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-opus-4-7
last-updated-by: claude-opus-4-7

## Imports
- `DatabaseDirtyTracker` (type) from `../database-dirty-tracker`
- `ModelDefaults` (type) from `../types`
- `DatabaseDriver` from `../utils/connect-to-database`
- `DriverBlueprintContract` from `./driver-blueprint.contract`
- `MigrationDriverContract` (type) from `./migration-driver.contract`
- `QueryBuilderContract` (type) from `./query-builder.contract`
- `SyncAdapterContract` (type) from `./sync-adapter.contract`
- `SQLSerializer` (inline type import) from `../migration/sql-serializer`

## Exports
- `DriverEvent` — supported driver lifecycle event names (open-ended union). [line 10]
- `DriverEventListener` — listener signature for driver lifecycle events. [line 13]
- `DriverTransactionContract` — representation of a manually-opened transaction. [lines 16-23]
- `TransactionContext` — callback transaction context with explicit rollback. [lines 31-51]
- `InsertResult` — result returned after insert operations. [lines 54-56]
- `UpdateResult` — result returned after update operations. [lines 59-61]
- `UpdateOperations` — database-agnostic update operations set. [lines 89-102]
- `DriverContract` — unified driver contract used by the model layer. [lines 107-530]
- `CreateDatabaseOptions` — options for creating a database. [lines 535-544]
- `DropDatabaseOptions` — options for dropping a database. [lines 549-554]

## Classes / Functions / Types / Constants

### `DriverEvent` [line 10]
- Type alias: `"connected" | "disconnected" | string` — supported driver lifecycle events. Open-ended string union allows custom events.

### `DriverEventListener` [line 13]
- Type alias: `(...args: unknown[]) => void` — variadic callback signature for driver lifecycle events.

### `DriverTransactionContract<TContext = unknown>` [lines 16-23]
- Interface representing a manually-opened transaction handle.
- Members:
  - `context: TContext` — driver-specific transaction context (session, connection, etc.). [line 18]
  - `commit(): Promise<void>` — commit the transaction. [line 20]
  - `rollback(): Promise<void>` — rollback the transaction. [line 22]

### `TransactionContext` [lines 31-51]
- Interface passed to callback-based `transaction()` executions; provides explicit rollback capability.
- Members:
  - `rollback(reason?: string): never` — throws `TransactionRollbackError` to exit the callback; optional `reason` for logging/debugging. [line 50]

### `InsertResult<TDocument = unknown>` [lines 54-56]
- Type alias object:
  - `document: TDocument` — the inserted document/row.

### `UpdateResult` [lines 59-61]
- Type alias object:
  - `modifiedCount: number` — number of documents/rows modified.

### `UpdateOperations` [lines 89-102]
- Type alias describing database-agnostic update operations. Drivers translate to native syntax (MongoDB uses as-is; SQL translates to SET / SET NULL).
- Members (all optional):
  - `$set?: Record<string, unknown>` — set field values. [line 91]
  - `$unset?: Record<string, 1 | true>` — remove/unset fields (MongoDB: delete field; SQL: SET NULL). [line 93]
  - `$inc?: Record<string, number>` — increment numeric fields. [line 95]
  - `$dec?: Record<string, number>` — decrement numeric fields. [line 97]
  - `$push?: Record<string, unknown>` — push to arrays (NoSQL only; SQL drivers may ignore). [line 99]
  - `$pull?: Record<string, unknown>` — pull from arrays (NoSQL only; SQL drivers may ignore). [line 101]

### `DriverContract` [lines 107-530]
- Unified driver contract used by the model layer. Defines identification, lifecycle, serialization, events, CRUD, transactions, query building, migration integration, and database/table management.

#### Readonly Properties
- `readonly name: DatabaseDriver` [lines 108-115] — driver identifier (e.g., `"mongodb"`, `"postgres"`, `"mysql"`) used for identification, logging, and debugging.
- `readonly blueprint: DriverBlueprintContract` [lines 117-120] — database blueprint (Information Schema).
- `readonly modelDefaults?: Partial<ModelDefaults>` [lines 122-143] — driver-specific model defaults (naming convention, timestamps columns) applied to all models using this driver unless overridden.
- `readonly isConnected: boolean` [line 146] — whether the underlying connection is currently established.

#### Connection Lifecycle

##### `connect(): Promise<void>` [line 149]
- Establish the underlying database connection/pool.

##### `disconnect(): Promise<void>` [line 151]
- Close the underlying database connection/pool.

##### `getClient<Client = unknown>(): Client` [line 153]
- Return the database's native client instance.

#### Serialization

##### `serialize(data: Record<string, unknown>): Record<string, unknown>` [lines 155-158]
- Serialize the given data for storage.

##### `deserialize(data: Record<string, unknown>): Record<string, unknown>` [lines 160-163]
- Deserialize data retrieved from storage.

##### `getDirtyTracker(data: Record<string, unknown>): DatabaseDirtyTracker` [lines 165-170]
- Get the dirty tracker seeded with the provided initial data snapshot.

#### Events

##### `on(event: DriverEvent, listener: DriverEventListener): void` [line 173]
- Register event listeners (`connected`, `disconnected`, or custom events).

#### CRUD Operations

##### `insert(table: string, document: Record<string, unknown>, options?: Record<string, unknown>): Promise<InsertResult>` [lines 175-180]
- Insert a single document/row into the given table.

##### `insertMany(table: string, documents: Record<string, unknown>[], options?: Record<string, unknown>): Promise<InsertResult[]>` [lines 182-187]
- Insert multiple documents/rows into the given table.

##### `update(table: string, filter: Record<string, unknown>, update: UpdateOperations, options?: Record<string, unknown>): Promise<UpdateResult>` [lines 189-195]
- Update documents/rows matching the filter.

##### `updateMany(table: string, filter: Record<string, unknown>, update: UpdateOperations, options?: Record<string, unknown>): Promise<UpdateResult>` [lines 197-203]
- Update many documents/rows matching the filter.

##### `replace<T = unknown>(table: string, filter: Record<string, unknown>, document: Record<string, unknown>, options?: Record<string, unknown>): Promise<T | null>` [lines 205-211]
- Replace a single document that matches the provided filter.

##### `findOneAndUpdate<T = unknown>(table: string, filter: Record<string, unknown>, update: Record<string, unknown>, options?: Record<string, unknown>): Promise<T | null>` [lines 213-219]
- Find one and update a single matching document; return the updated document.

##### `upsert<T = unknown>(table: string, filter: Record<string, unknown>, document: Record<string, unknown>, options?: Record<string, unknown>): Promise<T>` [lines 221-254]
- Upsert a single document/row (insert if missing, update if exists). SQL drivers may accept `options.conflictColumns`.

##### `findOneAndDelete<T = unknown>(table: string, filter: Record<string, unknown>, options?: Record<string, unknown>): Promise<T | null>` [lines 256-276]
- Find one and delete a single matching document; returns the deleted document or `null`.

##### `delete(table: string, filter?: Record<string, unknown>, options?: Record<string, unknown>): Promise<number>` [lines 278-283]
- Delete a single document matching the filter; returns count.

##### `deleteMany(table: string, filter?: Record<string, unknown>, options?: Record<string, unknown>): Promise<number>` [lines 285-290]
- Delete documents/rows matching the filter; returns count.

##### `truncateTable(table: string, options?: Record<string, unknown>): Promise<number>` [lines 292-311]
- Remove all records from a table/collection (destructive); returns number of records deleted.

#### Query Building

##### `queryBuilder<T = unknown>(table: string): QueryBuilderContract<T>` [line 314]
- Obtain a query builder for custom querying against the given table.

#### Transactions

##### `beginTransaction(options?: Record<string, unknown>): Promise<DriverTransactionContract>` [lines 316-340]
- Start a new transaction (manual pattern). Caller must invoke `commit()` / `rollback()` and handle cleanup.

##### `transaction<T>(fn: (ctx: TransactionContext) => Promise<T>, options?: Record<string, unknown>): Promise<T>` [lines 342-388]
- Execute a function within a transaction scope. Auto-commits on success, auto-rolls back on error, supports explicit `ctx.rollback()`. Nested calls unsupported; MongoDB requires replica set.

#### Atomic / Sync / Migration

##### `atomic(table: string, filter: Record<string, unknown>, operations: UpdateOperations, options?: Record<string, unknown>): Promise<UpdateResult>` [lines 390-396]
- Perform atomic updates matching the filter.

##### `syncAdapter(): SyncAdapterContract` [line 399]
- Access the sync adapter used for bulk denormalized updates.

##### `migrationDriver(): MigrationDriverContract` [line 402]
- Access the migration driver for schema operations.

##### `getSQLSerializer(): SQLSerializer` [lines 404-408]
- Return a SQL serializer for this driver's dialect; used by `Migration.toSQL()` to convert pending operations to SQL strings. Return type is inline type-imported from `../migration/sql-serializer`.

##### `query<T = unknown>(sql: string, params?: unknown[]): Promise<any>` [lines 410-418]
- Execute a raw SQL query; used by the runner for phase-ordered SQL. Note: declared generic `T` is unused in the return type (`Promise<any>`).

#### Database Lifecycle Operations

##### `createDatabase(name: string, options?: CreateDatabaseOptions): Promise<boolean>` [lines 424-442]
- Create a new database. Returns `true` if created, `false` if it already exists.

##### `dropDatabase(name: string, options?: DropDatabaseOptions): Promise<boolean>` [lines 444-459]
- Drop a database. Returns `true` if dropped, `false` if it didn't exist.

##### `databaseExists(name: string): Promise<boolean>` [lines 461-475]
- Check if a database exists.

##### `listDatabases(): Promise<string[]>` [lines 477-482]
- List all databases; returns an array of database names.

#### Table Management Operations

##### `dropTable(name: string): Promise<void>` [lines 488-500]
- Drop a table/collection; throws if the table doesn't exist.

##### `dropTableIfExists(name: string): Promise<void>` [lines 502-514]
- Drop a table/collection if it exists; no error if missing.

##### `dropAllTables(): Promise<void>` [lines 516-529]
- Drop all tables/collections in the current database (destructive; typically used for `migrate:fresh` or test suite resets).

### `CreateDatabaseOptions` [lines 535-544]
- Type alias for database creation options.
- Members (all optional):
  - `encoding?: string` — database encoding (PostgreSQL: UTF8, LATIN1, etc.). [line 537]
  - `template?: string` — template database (PostgreSQL). [line 539]
  - `locale?: string` — locale/collation settings. [line 541]
  - `owner?: string` — owner of the new database. [line 543]

### `DropDatabaseOptions` [lines 549-554]
- Type alias for database drop options.
- Members (all optional):
  - `force?: boolean` — force drop even if there are active connections. [line 551]
  - `ifExists?: boolean` — skip error if database doesn't exist. [line 553]
