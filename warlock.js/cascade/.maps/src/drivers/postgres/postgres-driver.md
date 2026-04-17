# postgres-driver
source: drivers/postgres/postgres-driver.ts
description: PostgreSQL database driver implementing Cascade's DriverContract with connection pooling, CRUD operations, transactions, and schema lifecycle management via the `pg` package.
complexity: complex
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-opus-4-7
last-updated-by: claude-opus-4-7

## Imports
- `colors` from `@mongez/copper`
- `log, logger` from `@warlock.js/logger`
- `databaseTransactionContext` from `../../context/database-transaction-context`
- `CreateDatabaseOptions, DriverContract, DriverEventListener, DriverTransactionContract, DropDatabaseOptions, InsertResult, TransactionContext, UpdateOperations, UpdateResult` (type) from `../../contracts/database-driver.contract`
- `DriverBlueprintContract` (type) from `../../contracts/driver-blueprint.contract`
- `MigrationDriverContract` (type) from `../../contracts/migration-driver.contract`
- `QueryBuilderContract` (type) from `../../contracts/query-builder.contract`
- `SyncAdapterContract` (type) from `../../contracts/sync-adapter.contract`
- `TransactionRollbackError` from `../../errors/transaction-rollback.error`
- `SQLSerializer` from `../../migration/sql-serializer`
- `SqlDatabaseDirtyTracker` from `../../sql-database-dirty-tracker`
- `ModelDefaults` (type) from `../../types`
- `DatabaseDriver` from `../../utils/connect-to-database`
- `isValidDateValue` from `../../utils/is-valid-date-value`
- `PostgresBlueprint` from `./postgres-blueprint`
- `PostgresDialect` from `./postgres-dialect`
- `PostgresMigrationDriver` from `./postgres-migration-driver`
- `PostgresQueryBuilder` from `./postgres-query-builder`
- `PostgresSQLSerializer` from `./postgres-sql-serializer`
- `PostgresSyncAdapter` from `./postgres-sync-adapter`
- `PostgresPoolConfig, PostgresQueryResult, PostgresTransactionOptions` (type) from `./types`
- `Pool, PoolClient, PoolConfig` (dynamic type imports) from `pg`

## Exports
- `PostgresDriver` — PostgreSQL driver class implementing `DriverContract`, with connection pooling, CRUD, transactions, migrations, and lifecycle operations.  [lines 107-1292]

## Classes / Functions / Types / Constants

### `loadPg()` [lines 63-76] (module-private helper, not exported)
- Lazily loads and caches the `pg` package; throws if the package is not installed.

### `PostgresDriver` [lines 107-1292]
- Implements `DriverContract`. Holds a `pg.Pool`, event listeners, and lazy-loaded blueprint/migration/sync adapters. Configured via a `PostgresPoolConfig` constructor argument.

#### Public readonly properties
- `name: DatabaseDriver` — `"postgres"` identifier. [line 111]
- `dialect: PostgresDialect` — SQL dialect helper instance. [line 116]
- `modelDefaults: Partial<ModelDefaults>` — snake_case, timestamps, permanent delete, SERIAL id defaults. [lines 127-136]

#### `constructor(config: PostgresPoolConfig)` [line 173]
- Stores the pool configuration; no side effects until `connect()` is called.

#### `get pool(): PgPool` [lines 180-185]
- Returns the live `pg.Pool`; throws if the driver has not been connected.

#### `getClient<Client = PgPool>(): Client` [lines 190-192]
- Returns the native pool client, cast to the generic `Client` type.

#### `get isConnected(): boolean` [lines 197-199]
- Reports whether the driver is currently connected.

#### `get blueprint(): DriverBlueprintContract` [lines 204-209]
- Lazily constructs and returns a `PostgresBlueprint` for schema introspection.

#### `connect(): Promise<void>` [lines 217-264]
- Creates the `pg.Pool` with merged defaults, probes a client to verify connectivity, sets `_isConnected = true`, and emits `"connected"`.

#### `disconnect(): Promise<void>` [lines 272-281]
- Ends the pool if present, clears state, emits `"disconnected"`. No-op when already disconnected.

#### `on(event: string, listener: DriverEventListener): void` [lines 289-295]
- Registers a listener for lifecycle events, creating the listener set on demand.

#### `serialize(data: Record<string, unknown>): Record<string, unknown>` [lines 306-336]
- Normalizes values for PostgreSQL: skips `undefined`, converts `Date` to ISO string, `bigint` to string, numeric arrays to pgvector literal `[n1,n2,...]`, and passes nested objects through for JSONB storage.

#### `getDirtyTracker(data: Record<string, unknown>): SqlDatabaseDirtyTracker` [lines 341-343]
- Returns a fresh `SqlDatabaseDirtyTracker` seeded with `data`.

#### `deserialize(data: Record<string, unknown>): Record<string, unknown>` [lines 353-389]
- Post-processes rows returned by `pg`: re-inflates ISO date strings into `Date` objects and parses pgvector-formatted strings into `number[]` when fully numeric.

#### `insert(table: string, document: Record<string, unknown>, _options?: Record<string, unknown>): Promise<InsertResult>` [lines 401-437]
- Builds and runs `INSERT ... VALUES (...) RETURNING *`, filtering out null/undefined `id` to let `SERIAL` auto-generate.

#### `insertMany(table: string, documents: Record<string, unknown>[], _options?: Record<string, unknown>): Promise<InsertResult[]>` [lines 449-495]
- Multi-row insert using the union of all document keys and `DEFAULT` for missing columns, returning the inserted rows via `RETURNING *`.

#### `update(table: string, filter: Record<string, unknown>, update: UpdateOperations, _options?: Record<string, unknown>): Promise<UpdateResult>` [lines 506-524]
- Single-row update using `buildUpdateQuery` with `limit=1` (ctid subquery). Logs SQL on error and rethrows.

#### `findOneAndUpdate<T = unknown>(table: string, filter: Record<string, unknown>, update: UpdateOperations, _options?: Record<string, unknown>): Promise<T | null>` [lines 534-545]
- Single-row update with `RETURNING *`, returning the first updated row or `null`.

#### `updateMany(table: string, filter: Record<string, unknown>, update: UpdateOperations, _options?: Record<string, unknown>): Promise<UpdateResult>` [lines 556-569]
- Updates all rows matching the filter using `buildUpdateQuery` without a row limit.

#### `replace<T = unknown>(table: string, filter: Record<string, unknown>, document: Record<string, unknown>, _options?: Record<string, unknown>): Promise<T | null>` [lines 582-605]
- Full-document `UPDATE ... SET (all columns) ... RETURNING *`, returning the first updated row or `null`.

#### `upsert<T = unknown>(table: string, filter: Record<string, unknown>, document: Record<string, unknown>, options?: Record<string, unknown>): Promise<T>` [lines 618-672]
- `INSERT ... ON CONFLICT (...) DO UPDATE SET ... RETURNING *`. Uses `options.conflictColumns` (or filter keys) as the conflict target and falls back to `EXCLUDED.*` when every column is part of the conflict target.

#### `findOneAndDelete<T = unknown>(table: string, filter: Record<string, unknown>, _options?: Record<string, unknown>): Promise<T | null>` [lines 682-696]
- Deletes a single row via `DELETE ... WHERE ctid IN (SELECT ctid ... LIMIT 1) RETURNING *`, returning the row or `null`.

#### `delete(table: string, filter?: Record<string, unknown>, _options?: Record<string, unknown>): Promise<number>` [lines 706-720]
- Deletes one matching row using a ctid subquery with `LIMIT 1`; returns the deleted row count.

#### `deleteMany(table: string, filter?: Record<string, unknown>, _options?: Record<string, unknown>): Promise<number>` [lines 730-743]
- Deletes all matching rows; returns the affected row count.

#### `truncateTable(table: string, options?: { cascade?: boolean }): Promise<number>` [lines 755-760]
- Runs `TRUNCATE TABLE ... RESTART IDENTITY [CASCADE]`; always returns `0` since TRUNCATE has no row count.

#### `queryBuilder<T = unknown>(table: string): QueryBuilderContract<T>` [lines 768-770]
- Returns a new `PostgresQueryBuilder<T>` cast to the contract type.

#### `beginTransaction(options?: PostgresTransactionOptions): Promise<DriverTransactionContract<PgPoolClient>>` [lines 782-811]
- Acquires a pool client and runs `BEGIN [ISOLATION LEVEL ...] [READ ONLY] [DEFERRABLE]`. Returns a contract whose `commit`/`rollback` run the SQL and release the client.

#### `transaction<T>(fn: (ctx: TransactionContext) => Promise<T>, options?: Record<string, unknown>): Promise<T>` [lines 824-869]
- Runs `fn` inside a managed transaction, registering the client in `databaseTransactionContext` so nested queries join it. Auto-commits on success, rolls back on any error (logging the failure), rethrows, and always exits the context. A `TransactionRollbackError` thrown from `ctx.rollback()` triggers rollback as an error.

#### `atomic(table: string, filter: Record<string, unknown>, operations: UpdateOperations, _options?: Record<string, unknown>): Promise<UpdateResult>` [lines 882-897]
- Atomic single-row update via `buildUpdateQuery` with `limit=1` (relies on row-level locking semantics of the ctid path).

#### `syncAdapter(): SyncAdapterContract` [lines 904-909]
- Lazily constructs and returns a `PostgresSyncAdapter` for bulk denormalized writes.

#### `migrationDriver(): MigrationDriverContract` [lines 916-921]
- Lazily constructs and returns a `PostgresMigrationDriver` for schema operations.

#### `getSQLSerializer(): SQLSerializer` [lines 927-929]
- Returns a new `PostgresSQLSerializer` bound to this driver's dialect.

#### `query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<PostgresQueryResult<T>>` [lines 940-1001]
- Executes raw SQL, automatically routing to the transaction client when `databaseTransactionContext` has a session. Emits structured log events for executing/executed/error when `config.logging` is on, truncating serialized params to 300 chars.

#### `createDatabase(name: string, options?: CreateDatabaseOptions): Promise<boolean>` [lines 1139-1177]
- Returns `false` if the database already exists, otherwise runs `CREATE DATABASE ... [WITH ENCODING|TEMPLATE|LC_COLLATE|LC_CTYPE|OWNER ...]` and returns `true`.

#### `dropDatabase(name: string, options?: DropDatabaseOptions): Promise<boolean>` [lines 1186-1214]
- Runs `DROP DATABASE [IF EXISTS] <name> [WITH (FORCE)]`. Returns `false` when `ifExists` is not set and the database is missing.

#### `databaseExists(name: string): Promise<boolean>` [lines 1222-1229]
- Queries `pg_database` and returns whether a row with the given `datname` exists.

#### `listDatabases(): Promise<string[]>` [lines 1236-1242]
- Returns non-template database names from `pg_database`, sorted by name.

#### `dropTable(name: string): Promise<void>` [lines 1254-1258]
- Runs `DROP TABLE <name>`; throws if the table is absent.

#### `dropTableIfExists(name: string): Promise<void>` [lines 1265-1268]
- Runs `DROP TABLE IF EXISTS <name>`; silent when missing.

#### `dropAllTables(): Promise<void>` [lines 1276-1291]
- Iterates `blueprint.listTables()` and drops each with `DROP TABLE IF EXISTS ... CASCADE`; logs a summary count.

### Private members (listed, not documented per rules)
- `_pool`, `_eventListeners`, `_isConnected`, `_blueprint`, `_migrationDriver`, `_syncAdapter` fields.
- `emit(event, ...args)` [lines 1009-1016]
- `buildWhereClause(filter, startParamIndex)` [lines 1025-1047]
- `buildUpdateQuery(table, filter, update, limit?)` [lines 1058-1123]

## Ambiguities / Notes
- `PostgresDriver` is the only value export; all other `pg`-related symbols (`PgPool`, `PgPoolClient`, `PgPoolConfig`, `pgModule`, `loadPg`) are module-internal.
- `atomic()` is described as using row-level locking, but the implementation only delegates to the standard single-row `buildUpdateQuery` path (ctid subquery) without an explicit `SELECT FOR UPDATE`; the doc comment may overstate the locking behaviour.
- `transaction()` contains a commented-out nested-transaction guard (lines 829-834); nested calls are currently allowed silently.
- `replace()` and `upsert()` do not call `deserialize()` on the returned row, unlike the read paths elsewhere in the driver.
- `insertMany()` casts `result.rows` directly to `InsertResult[]` rather than wrapping each row in `{ document: ... }` like `insert()` does — an asymmetry worth flagging for contract consumers.
