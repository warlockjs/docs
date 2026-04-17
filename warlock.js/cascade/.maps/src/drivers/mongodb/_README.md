# MongoDB Driver
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> MongoDB implementation of the Cascade driver contract, providing CRUD, aggregation pipeline query building, migrations, transactions, sync, and atomic ID generation.

## What lives here
- `mongodb-driver.ts` — main `MongoDbDriver` implementing the Cascade driver contract
- `mongodb-blueprint.ts` — collection/index introspection via `MongoDBBlueprint`
- `mongodb-query-builder.ts` — `MongoQueryBuilder<T>` assembling aggregation pipelines
- `mongodb-query-operations.ts` — `MongoQueryOperations` helper pushing pipeline stage operations
- `mongodb-query-parser.ts` — `MongoQueryParser` converting operations into pipelines
- `mongodb-migration-driver.ts` — `MongoMigrationDriver` for DDL, indexes, schema validation
- `mongodb-id-generator.ts` — `MongoIdGenerator` atomic auto-increment counters
- `mongodb-sync-adapter.ts` — `MongoSyncAdapter` applying batch sync instructions
- `types.ts` — `PipelineStage`, `Operation`, `MongoDriverOptions` types

## Public API
- `MongoDbDriver(config, driverOptions?: MongoDriverOptions)` — main driver class
- `isMongoDBDriverLoaded(): boolean` — checks mongodb module loaded
- `MongoDBBlueprint(database: Db)` — schema introspection
- `MongoQueryBuilder<T>(table: string, dataSource?: DataSource)` — aggregation query builder
- `MongoQueryOperations(operations: Operation[])` — pipeline operations accumulator
- `MongoQueryParser(options: MongoQueryParserOptions)` — pipeline parser
- `MongoMigrationDriver` — MongoDB migration driver
- `MongoIdGenerator(driver: MongoDbDriver, counterCollection?: string)` — sequential IDs
- `MongoSyncAdapter(driver: MongoDbDriver)` — executes `SyncInstruction[]`
- `PipelineStage` — aggregation stage literal union type
- `Operation` — `{ stage, mergeable, type, data }` chain entry type
- `MongoDriverOptions` — `{ autoGenerateId?, counterCollection?, transactionOptions? }`
- `MongoQueryParserOptions` — parser configuration type

## How it fits together
`MongoDbDriver` is the entry point; it lazily constructs `MongoDBBlueprint`, `MongoIdGenerator`, `MongoMigrationDriver`, and `MongoSyncAdapter` on demand and returns `MongoQueryBuilder<T>` instances from `queryBuilder()`. `MongoQueryBuilder` collects chain calls into an `Operation[]` via `MongoQueryOperations`; when executed, `MongoQueryParser` transforms those operations into a MongoDB aggregation pipeline run against the live `Collection`. `MongoMigrationDriver` and `MongoSyncAdapter` hold back-references to the driver so they share its connection, transaction session, and event lifecycle.

## Working examples
```typescript
import {
  MongoDbDriver,
  isMongoDBDriverLoaded,
} from "@warlock.js/cascade/drivers/mongodb";

// Connect
if (!isMongoDBDriverLoaded()) throw new Error("mongodb not installed");

const driver = new MongoDbDriver(
  { database: "shop", uri: "mongodb://localhost:27017/shop" },
  { autoGenerateId: true, counterCollection: "counters" },
);

await driver.connect();

// CRUD
const { id } = await driver.insert("users", { name: "Ada" });
await driver.update("users", { id }, { name: "Ada Lovelace" });
const removed = await driver.delete("users", { id });

// Query builder
const users = await driver
  .queryBuilder<{ id: number; name: string }>("users")
  .where("name", "like", "Ada%")
  .orderBy("name", "asc")
  .limit(10)
  .get();

// Transaction
await driver.transaction(async () => {
  await driver.insert("orders", { userId: id, total: 50 });
  await driver.update("users", { id }, { lastOrderAt: new Date() });
});

// Migration / indexes
const migration = driver.migrationDriver();
await migration.createTableIfNotExists("users");
await migration.createUniqueIndex("users", ["email"]);
await migration.createTTLIndex("sessions", "expiresAt", 3600);

// Blueprint introspection
const tables = await driver.blueprint.listTables();
const indexes = await driver.blueprint.listIndexes("users");

await driver.disconnect();
```

## DO NOT
- Do NOT call `getSQLSerializer()` or `query(sql, params)` on `MongoDbDriver` — both always throw; MongoDB has no SQL layer.
- Do NOT call `addColumn`, `modifyColumn`, `createTimestampColumns`, `addForeignKey`, `dropForeignKey`, `addPrimaryKey`, `dropPrimaryKey`, `addCheck`, or `dropCheck` on `MongoMigrationDriver` expecting effects — they are schemaless no-ops.
- Do NOT rely on `listColumns()` returning fields — MongoDB is schemaless; `MongoDBBlueprint.listColumns` logs a warning and returns `[]`, and `MongoMigrationDriver.listColumns` returns `[]`.
- Do NOT call `getDatabase()`, `getClient()`, or query methods before `connect()` resolves — they throw when the driver is not connected.
- Do NOT nest `driver.transaction(fn)` calls or use transactions outside a replica set — the method throws in both cases.
- Do NOT call `extend()` on `MongoQueryBuilder` — it throws; driver-specific extensions are unsupported.

## Internal (not for docs)
- `MongoQueryOperations` — internal chain-to-pipeline operation accumulator shared between builder and parser; users should go through `MongoQueryBuilder`.
- `MongoQueryParser` — internal pipeline compiler invoked by the builder's `execute`/`parse`; not meant to be constructed directly.
- `PipelineStage` / `Operation` — internal pipeline descriptor types used by the builder and parser; not part of user-facing query API.
- Protected methods on `MongoQueryBuilder` (`addWhereClause`, `addRawWhere`, `normalizeSelectFields`, `getParser`, `buildPipeline`, `buildFilter`, `execute`) — subclass hooks, not public surface.
- `MongoMigrationDriver.raw(callback)` — escape hatch for arbitrary native DB operations; prefer dedicated migration methods.
