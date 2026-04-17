# database-driver.contract
source: contracts/database-driver.contract.ts
description: Defines the unified DriverContract interface and all supporting types for database-agnostic driver operations.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `DatabaseDirtyTracker` from `../database-dirty-tracker`
- `ModelDefaults` from `../types`
- `DatabaseDriver` from `../utils/connect-to-database`
- `DriverBlueprintContract` from `./driver-blueprint.contract`
- `MigrationDriverContract` from `./migration-driver.contract`
- `QueryBuilderContract` from `./query-builder.contract`
- `SyncAdapterContract` from `./sync-adapter.contract`

## Exports
- `DriverEvent` — lifecycle event name union type  [line 10]
- `DriverEventListener` — variadic listener callback type  [line 13]
- `DriverTransactionContract` — manual transaction with commit/rollback  [lines 16-23]
- `TransactionContext` — callback-scoped explicit rollback handle  [lines 31-51]
- `InsertResult` — document returned after insert  [lines 54-56]
- `UpdateResult` — modified count after update  [lines 59-61]
- `UpdateOperations` — cross-driver atomic update operations  [lines 89-102]
- `DriverContract` — primary driver interface used by model layer  [lines 107-530]
- `CreateDatabaseOptions` — options for database creation  [lines 535-544]
- `DropDatabaseOptions` — options for database drop  [lines 549-554]

## Types / Interfaces

### `DriverTransactionContract<TContext>` [lines 16-23]
Manual transaction object with commit and rollback.
- `context: TContext` — driver-specific session or connection
- `commit(): Promise<void>`
- `rollback(): Promise<void>`

### `TransactionContext` [lines 31-51]
- `rollback(reason?: string): never` — throws TransactionRollbackError; side-effects: aborts transaction

### `UpdateOperations` [lines 89-102]
- `$set?: Record<string, unknown>`
- `$unset?: Record<string, 1 | true>`
- `$inc?: Record<string, number>`
- `$dec?: Record<string, number>`
- `$push?: Record<string, unknown>` — NoSQL only
- `$pull?: Record<string, unknown>` — NoSQL only

### `DriverContract` [lines 107-530]
Unified database driver interface consumed by the model layer.
- `readonly name: DatabaseDriver` [line 115]
- `readonly blueprint: DriverBlueprintContract` [line 120]
- `readonly modelDefaults?: Partial<ModelDefaults>` [line 143]
- `readonly isConnected: boolean` [line 146]
- `connect(): Promise<void>` [line 149] — side-effects: opens connection
- `disconnect(): Promise<void>` [line 151] — side-effects: closes connection
- `getClient<Client>(): Client` [line 153]
- `serialize(data): Record<string, unknown>` [line 158]
- `deserialize(data): Record<string, unknown>` [line 163]
- `getDirtyTracker(data): DatabaseDirtyTracker` [line 170]
- `on(event, listener): void` [line 173] — side-effects: registers listener
- `insert(table, document, options?): Promise<InsertResult>` [lines 176-181] — throws: on driver error
- `insertMany(table, documents, options?): Promise<InsertResult[]>` [lines 183-187] — throws: on driver error
- `update(table, filter, update, options?): Promise<UpdateResult>` [lines 189-195] — throws: on driver error
- `updateMany(table, filter, update, options?): Promise<UpdateResult>` [lines 197-203] — throws: on driver error
- `replace<T>(table, filter, document, options?): Promise<T | null>` [lines 206-212]
- `findOneAndUpdate<T>(table, filter, update, options?): Promise<T | null>` [lines 214-219]
- `upsert<T>(table, filter, document, options?): Promise<T>` [lines 249-254]
- `findOneAndDelete<T>(table, filter, options?): Promise<T | null>` [lines 272-277]
- `delete(table, filter?, options?): Promise<number>` [lines 279-283]
- `deleteMany(table, filter?, options?): Promise<number>` [lines 285-290]
- `truncateTable(table, options?): Promise<number>` [lines 311-312] — side-effects: deletes all rows
- `queryBuilder<T>(table): QueryBuilderContract<T>` [line 314]
- `beginTransaction(options?): Promise<DriverTransactionContract>` [line 340]
- `transaction<T>(fn, options?): Promise<T>` [lines 385-388] — throws: on error or explicit rollback; side-effects: auto-commit/rollback
- `atomic(table, filter, operations, options?): Promise<UpdateResult>` [lines 391-396]
- `syncAdapter(): SyncAdapterContract` [line 399]
- `migrationDriver(): MigrationDriverContract` [line 402]
- `getSQLSerializer(): SQLSerializer` [line 408]
- `query<T>(sql, params?): Promise<any>` [lines 418-419]
- `createDatabase(name, options?): Promise<boolean>` [line 442]
- `dropDatabase(name, options?): Promise<boolean>` [line 459]
- `databaseExists(name): Promise<boolean>` [line 475]
- `listDatabases(): Promise<string[]>` [line 482]
- `dropTable(name): Promise<void>` [line 500] — throws: if table missing
- `dropTableIfExists(name): Promise<void>` [line 514]
- `dropAllTables(): Promise<void>` [line 529] — side-effects: destroys entire schema
