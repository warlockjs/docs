# PostgreSQL Driver
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> PostgreSQL implementation of Cascade's driver, migration, query builder, and sync contracts backed by the `pg` connection pool.

## What lives here
- `index.ts` — Re-exports all PostgreSQL driver components
- `postgres-driver.ts` — `PostgresDriver` implementing `DriverContract`
- `postgres-dialect.ts` — `PostgresDialect` SQL syntax/placeholder/JSONB rules
- `postgres-query-builder.ts` — `PostgresQueryBuilder<T>` execution and hydration
- `postgres-query-parser.ts` — `PostgresQueryParser` compiling ops to SQL
- `postgres-migration-driver.ts` — `PostgresMigrationDriver` DDL operations
- `postgres-sql-serializer.ts` — `PostgresSQLSerializer` pure DDL string builder
- `postgres-blueprint.ts` — `PostgresBlueprint` schema introspection via `information_schema`/`pg_catalog`
- `postgres-sync-adapter.ts` — `PostgresSyncAdapter` batch JSONB denormalization updates
- `types.ts` — Connection, pool, query-result, transaction, and internal op types

## Public API
- `PostgresDriver(config: PostgresPoolConfig)` — Driver implementing `DriverContract`
- `PostgresDialect()` — SQL dialect (`name = "postgres"`, `supportsReturning`, `upsertKeyword`)
- `PostgresQueryBuilder<T>(table: string, dataSource?: DataSource)` — Query builder with `get`/`first`/`paginate`/`similarTo`
- `PostgresQueryParser(options: PostgresParserOptions)` — Compile ops via `parse(): DriverQuery`
- `PostgresMigrationDriver` — DDL: `createTable`, `addColumn`, `createIndex`, `addForeignKey`, `createVectorIndex`
- `PostgresSQLSerializer(dialect: SqlDialectContract)` — `serialize(operation, table)` pure DDL builder
- `PostgresBlueprint(driver: PostgresDriver)` — `listTables`/`listIndexes`/`listColumns`/`tableExists`
- `PostgresSyncAdapter(driver: PostgresDriver)` — `executeBatch`/`executeOne`/`executeArrayUpdate`
- `PostgresConnectionConfig`, `PostgresPoolConfig`, `PostgresQueryResult<T>` — Config/result types
- `PostgresIsolationLevel`, `PostgresTransactionOptions` — Transaction settings
- `PostgresOperationType`, `PostgresParserOperation`, `PostgresParserOptions` — Parser types
- `PostgresOperation`, `PostgresWhereClause`, `PostgresNotification`, `PostgresCopyOptions` — Internal shapes

## How it fits together
`PostgresDriver` is the entry point: it owns the `pg.Pool`, exposes a `PostgresDialect`, and lazily constructs a `PostgresBlueprint`, `PostgresMigrationDriver`, and `PostgresSyncAdapter`. `queryBuilder()` returns a `PostgresQueryBuilder<T>` that stacks operations on `QueryBuilder` and hands them to `PostgresQueryParser`, which uses the dialect to produce `DriverQuery` SQL + params. `PostgresMigrationDriver` delegates DDL string building to `PostgresSQLSerializer` (pure, no I/O) and then executes via the driver's pool. `PostgresSyncAdapter` performs JSONB `jsonb_set` and CTE array updates for denormalized fan-out.

## Working examples
```typescript
import {
  PostgresDriver,
  PostgresPoolConfig,
  PostgresTransactionOptions,
} from "@warlock.js/cascade/drivers/postgres";

const config: PostgresPoolConfig = {
  host: "localhost",
  port: 5432,
  database: "app",
  user: "postgres",
  password: "secret",
  max: 10,
};

const driver = new PostgresDriver(config);
await driver.connect();

// Raw query
const result = await driver.query<{ id: number; name: string }>(
  "SELECT id, name FROM users WHERE active = $1",
  [true],
);
console.log(result.rows, result.rowCount);

// Insert and query builder
const inserted = await driver.insert("users", { name: "Alice", email: "a@x.io" });
const users = await driver
  .queryBuilder<{ id: number; name: string }>("users")
  .where("name", "Alice")
  .get();

// Vector similarity search
const similar = await driver
  .queryBuilder<{ id: number }>("documents")
  .similarTo("embedding", [0.1, 0.2, 0.3], "score")
  .get();

// Transaction with isolation level
const txOptions: PostgresTransactionOptions = { isolationLevel: "serializable" };
await driver.transaction(async () => {
  await driver.update("accounts", { id: 1 }, { $inc: { balance: -100 } });
  await driver.update("accounts", { id: 2 }, { $inc: { balance: 100 } });
}, txOptions);

// Migration DDL
const migration = driver.migrationDriver();
await migration.createTableIfNotExists("posts");
await migration.addColumn("posts", { name: "title", type: "string" });
await migration.createIndex("posts", { columns: ["title"] });

// Schema introspection
const tables = await driver.blueprint.listTables();
const exists = await driver.blueprint.tableExists("posts");

await driver.disconnect();
```

## DO NOT
- Do NOT import internal classes to build your own pool — use `PostgresDriver.connect()`; the pool is `undefined` until then and throws.
- Do NOT call `driver.pool` before `connect()` — it throws `"PostgreSQL driver is not connected"`.
- Do NOT call `PostgresQueryBuilder.extend()` — it always throws; PG has no extension escape hatch.
- Do NOT expect `addCheck`/`dropCheck`/schema-validation ops from `PostgresSQLSerializer.serialize` — they return `null`.
- Do NOT instantiate `PostgresBlueprint`, `PostgresMigrationDriver`, `PostgresSyncAdapter`, or `PostgresSQLSerializer` directly in app code — access them through `driver.blueprint`, `driver.migrationDriver()`, `driver.syncAdapter()`, `driver.getSQLSerializer()`.
- Do NOT mix placeholder syntaxes — use `dialect.placeholder(index)` which returns `$N` (1-based), not `?`.

## Internal (not for docs)
- `PostgresOperation`, `PostgresWhereClause` — Internal query-builder representations, not part of the authored query API
- `PostgresParserOperation`, `PostgresOperationType` — Parser-internal op shape consumed by `PostgresQueryParser`
- `PostgresNotification`, `PostgresCopyOptions` — Reserved for LISTEN/NOTIFY and COPY features not exposed through the driver contract yet
