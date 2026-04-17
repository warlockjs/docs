# postgres-driver
source: drivers/postgres/postgres-driver.ts
description: PostgreSQL DriverContract implementation for CRUD, transactions, and schema operations.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `colors` from `@mongez/copper`
- `log, logger` from `@warlock.js/logger`
- `databaseTransactionContext` from `../../context/database-transaction-context`
- `CreateDatabaseOptions, DriverContract, DriverEventListener, DriverTransactionContract, DropDatabaseOptions, InsertResult, TransactionContext, UpdateOperations, UpdateResult` from `../../contracts/database-driver.contract`
- `DriverBlueprintContract` from `../../contracts/driver-blueprint.contract`
- `MigrationDriverContract` from `../../contracts/migration-driver.contract`
- `QueryBuilderContract` from `../../contracts/query-builder.contract`
- `SyncAdapterContract` from `../../contracts/sync-adapter.contract`
- `TransactionRollbackError` from `../../errors/transaction-rollback.error`
- `SQLSerializer` from `../../migration/sql-serializer`
- `SqlDatabaseDirtyTracker` from `../../sql-database-dirty-tracker`
- `ModelDefaults` from `../../types`
- `DatabaseDriver` from `../../utils/connect-to-database`
- `isValidDateValue` from `../../utils/is-valid-date-value`
- `PostgresBlueprint` from `./postgres-blueprint`
- `PostgresDialect` from `./postgres-dialect`
- `PostgresMigrationDriver` from `./postgres-migration-driver`
- `PostgresQueryBuilder` from `./postgres-query-builder`
- `PostgresSQLSerializer` from `./postgres-sql-serializer`
- `PostgresSyncAdapter` from `./postgres-sync-adapter`
- `PostgresPoolConfig, PostgresQueryResult, PostgresTransactionOptions` from `./types`

## Exports
- `PostgresDriver` — PostgreSQL driver class  [lines 107-1292]

## Classes
### PostgresDriver  [lines 107-1292] — PostgreSQL driver implementing Cascade DriverContract
implements: DriverContract

fields:
- `readonly name: DatabaseDriver`  [line 111]
- `readonly dialect: PostgresDialect`  [line 116]
- `readonly modelDefaults: Partial<ModelDefaults>`  [lines 127-136]

methods:
- `constructor(config: PostgresPoolConfig)`  [line 173] — Create driver instance
- `get pool(): PgPool`  [lines 180-185] — Get connection pool
  - throws: `Error` — when not connected
- `getClient<Client = PgPool>(): Client`  [lines 190-192] — Get native database client
- `get isConnected(): boolean`  [lines 197-199] — Check connection status
- `get blueprint(): DriverBlueprintContract`  [lines 204-209] — Get blueprint schema accessor
- `connect(): Promise<void>`  [lines 217-264] — Establish connection pool
  - throws: `Error` — when pg missing or connection fails
  - side-effects: creates pool, emits connected, logs
- `disconnect(): Promise<void>`  [lines 272-281] — Close connection pool
  - side-effects: ends pool, emits disconnected
- `on(event: string, listener: DriverEventListener): void`  [lines 289-295] — Register event listener
  - side-effects: mutates listener map
- `serialize(data: Record<string, unknown>): Record<string, unknown>`  [lines 306-336] — Serialize values for PostgreSQL
- `getDirtyTracker(data: Record<string, unknown>): SqlDatabaseDirtyTracker`  [lines 341-343] — Get dirty tracker instance
- `deserialize(data: Record<string, unknown>): Record<string, unknown>`  [lines 353-389] — Convert PostgreSQL types to JS
  - side-effects: mutates data object
- `insert(table: string, document: Record<string, unknown>, _options?): Promise<InsertResult>`  [lines 401-437] — Insert single row
  - throws: `Error` — when document empty
- `insertMany(table: string, documents: Record<string, unknown>[], _options?): Promise<InsertResult[]>`  [lines 449-495] — Insert multiple rows
  - throws: `Error` — on query failure
- `update(table, filter, update: UpdateOperations, _options?): Promise<UpdateResult>`  [lines 506-524] — Update single row
  - throws: `Error` — on query failure
- `findOneAndUpdate<T>(table, filter, update, _options?): Promise<T | null>`  [lines 534-545] — Update and return row
  - throws: `Error` — on query failure
- `updateMany(table, filter, update, _options?): Promise<UpdateResult>`  [lines 556-569] — Update multiple rows
  - throws: `Error` — on query failure
- `replace<T>(table, filter, document, _options?): Promise<T | null>`  [lines 582-605] — Replace document fully
  - throws: `Error` — on query failure
- `upsert<T>(table, filter, document, options?): Promise<T>`  [lines 618-672] — Insert or update on conflict
  - throws: `Error` — when empty or missing conflict columns
- `findOneAndDelete<T>(table, filter, _options?): Promise<T | null>`  [lines 682-696] — Delete and return row
  - throws: `Error` — on query failure
- `delete(table, filter?, _options?): Promise<number>`  [lines 706-720] — Delete single row
  - throws: `Error` — on query failure
- `deleteMany(table, filter?, _options?): Promise<number>`  [lines 730-743] — Delete multiple rows
  - throws: `Error` — on query failure
- `truncateTable(table, options?: { cascade?: boolean }): Promise<number>`  [lines 755-760] — Truncate table rows
  - throws: `Error` — on query failure
- `queryBuilder<T>(table: string): QueryBuilderContract<T>`  [lines 768-770] — Create query builder
- `beginTransaction(options?: PostgresTransactionOptions): Promise<DriverTransactionContract<PgPoolClient>>`  [lines 782-811] — Begin transaction
  - throws: `Error` — on pool or BEGIN failure
  - side-effects: acquires pool client
- `transaction<T>(fn, options?): Promise<T>`  [lines 824-869] — Run function in transaction
  - throws: `Error` — when callback fails or rolled back
  - side-effects: enters context, commits/rolls back
- `atomic(table, filter, operations, _options?): Promise<UpdateResult>`  [lines 882-897] — Perform atomic update
  - throws: `Error` — on query failure
- `syncAdapter(): SyncAdapterContract`  [lines 904-909] — Get sync adapter
- `migrationDriver(): MigrationDriverContract`  [lines 916-921] — Get migration driver
- `getSQLSerializer(): SQLSerializer`  [lines 927-929] — Get SQL serializer
- `query<T>(sql: string, params?: unknown[]): Promise<PostgresQueryResult<T>>`  [lines 940-1001] — Execute raw SQL query
  - throws: `Error` — on query execution failure
  - side-effects: logs query, uses transaction client
- `createDatabase(name: string, options?: CreateDatabaseOptions): Promise<boolean>`  [lines 1139-1177] — Create database
  - throws: `Error` — on creation failure
- `dropDatabase(name: string, options?: DropDatabaseOptions): Promise<boolean>`  [lines 1186-1214] — Drop database
  - throws: `Error` — on drop failure
- `databaseExists(name: string): Promise<boolean>`  [lines 1222-1229] — Check database existence
  - throws: `Error` — on query failure
- `listDatabases(): Promise<string[]>`  [lines 1236-1242] — List all databases
  - throws: `Error` — on query failure
- `dropTable(name: string): Promise<void>`  [lines 1254-1258] — Drop table
  - throws: `Error` — when table missing
- `dropTableIfExists(name: string): Promise<void>`  [lines 1265-1268] — Drop table if exists
  - throws: `Error` — on query failure
- `dropAllTables(): Promise<void>`  [lines 1276-1291] — Drop all tables cascade
  - throws: `Error` — on query failure
