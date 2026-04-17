# Contracts
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> TypeScript interfaces that define every capability a database driver, query builder, migration engine, and model pipeline component must implement, forming the abstraction boundary between the model layer and any concrete driver.

## What lives here
- `database-driver.contract.ts` — primary `DriverContract` interface plus transaction, insert/update result, and atomic update operation types
- `database-id-generator.contract.ts` — `IdGeneratorContract` for atomic sequential auto-increment ID generation in NoSQL stores
- `database-remover.contract.ts` — `RemoverContract` orchestrating the full model deletion pipeline with strategy, events, and result types
- `database-restorer.contract.ts` — `RestorerContract` orchestrating the full model restoration pipeline with ID-conflict resolution
- `database-writer.contract.ts` — `WriterContract` orchestrating validation, ID generation, events, and driver insert/update
- `driver-blueprint.contract.ts` — `DriverBlueprintContract` for live schema inspection (tables, columns, indexes)
- `migration-driver.contract.ts` — `MigrationDriverContract` covering all DDL operations across SQL and NoSQL drivers
- `query-builder.contract.ts` — `QueryBuilderContract<T>` fluent, chainable, database-agnostic query builder interface
- `sync-adapter.contract.ts` — `SyncAdapterContract` for driver-level bulk denormalization sync execution
- `index.ts` — barrel re-exporting every contract symbol

## Public API
- `DriverContract` — primary driver interface consumed by the model layer
- `DriverTransactionContract` — manual transaction object with commit/rollback
- `TransactionContext` — callback-scoped explicit rollback handle
- `InsertResult` — document shape returned after insert
- `UpdateResult` — modified count returned after update
- `UpdateOperations` — cross-driver atomic update operations (`$set`, `$inc`, `$push`, etc.)
- `CreateDatabaseOptions` — options for database creation
- `DropDatabaseOptions` — options for database drop
- `IdGeneratorContract` — atomic sequential ID generation interface
- `GenerateIdOptions` — options for `generateNextId`
- `RemoverContract` — model deletion orchestration interface
- `RemoverOptions` — controls strategy, event, and sync behaviour for destroy
- `RemoverResult` — result shape returned after destroy
- `RestorerContract` — model restoration orchestration interface
- `RestorerOptions` — controls strategy and ID-conflict behaviour for restore
- `RestorerResult` — result shape returned after restore
- `WriterContract` — model save orchestration interface
- `WriterOptions` — controls validation, events, sync, and replace behaviour
- `WriterResult` — result shape returned after save
- `BuildUpdateOperationsResult` — internal alias for `UpdateOperations`
- `DriverBlueprintContract` — information-schema query interface
- `TableIndexInformation` — index metadata shape
- `ColumnType` — union of all supported column type strings
- `ColumnDefinition` — full column specification for DDL
- `IndexDefinition` — index creation options
- `FullTextIndexOptions` — full-text index configuration
- `GeoIndexOptions` — geo-spatial index configuration
- `VectorIndexOptions` — vector/AI index configuration
- `ForeignKeyDefinition` — FK constraint definition
- `MigrationDriverContract` — DDL driver interface
- `MigrationDriverFactory` — factory function type for migration drivers
- `OrderDirection` — `"asc" | "desc"` order direction union
- `JoinOptions` — join clause descriptor
- `PaginationResult<T>` — page/limit pagination output shape
- `CursorPaginationResult<T>` — cursor pagination output shape
- `ChunkCallback<T>` — chunk iteration callback type
- `CursorPaginationOptions` — cursor pagination input
- `PaginationOptions` — standard pagination input
- `WhereOperator` — supported comparison operator union
- `WhereObject` — object-based predicate type
- `WhereCallback<T>` — callback-based predicate type
- `GroupByInput` — groupBy field payload
- `HavingInput` — having clause payload
- `RawExpression` — native expression placeholder
- `DriverQuery` — parsed query representation
- `QueryBuilderContract<T>` — full fluent query builder interface
- `SyncInstruction` — descriptor for a single sync update operation
- `SyncAdapterContract` — interface for executing sync instruction batches

## How it fits together
All contracts are pure TypeScript interfaces with no runtime implementation — concrete drivers (MongoDB, MySQL, PostgreSQL, etc.) implement `DriverContract`, which in turn exposes `queryBuilder()` returning a `QueryBuilderContract<T>`, `syncAdapter()` returning a `SyncAdapterContract`, and `migrationDriver()` returning a `MigrationDriverContract`. The model pipeline delegates persistence to `WriterContract`, deletion to `RemoverContract`, and restoration to `RestorerContract`, each of which receives a bound `DriverContract` so the model layer never imports a concrete driver. `DriverBlueprintContract` and `MigrationDriverContract` share `TableIndexInformation` (re-exported from `migration-driver.contract.ts`) to keep schema metadata consistent across introspection and migration code paths.

## Working examples
```typescript
// Begin a managed transaction with automatic commit/rollback
import {
  DriverContract,
  TransactionContext,
  UpdateOperations,
} from "./contracts";

async function transferBalance(
  driver: DriverContract,
  fromId: string,
  toId: string,
  amount: number,
): Promise<void> {
  await driver.transaction(async (ctx: TransactionContext) => {
    const debit: UpdateOperations = { $inc: { balance: -amount } };
    const credit: UpdateOperations = { $inc: { balance: amount } };

    const fromResult = await driver.atomic("accounts", { _id: fromId }, debit);
    if (fromResult.modifiedCount === 0) {
      ctx.rollback("Source account not found");
    }

    await driver.atomic("accounts", { _id: toId }, credit);
  });
}
```

```typescript
// Fluent query with pagination using QueryBuilderContract
import { QueryBuilderContract, PaginationResult } from "./contracts";

async function getActiveUsers(
  qb: QueryBuilderContract<{ id: number; name: string; active: boolean }>,
): Promise<PaginationResult<{ id: number; name: string; active: boolean }>> {
  return qb
    .where("active", true)
    .orderBy("name", "asc")
    .paginate({ page: 1, limit: 20 });
}
```

```typescript
// Inspect live schema with DriverBlueprintContract
import { DriverBlueprintContract, TableIndexInformation } from "./contracts";

async function auditIndexes(
  blueprint: DriverBlueprintContract,
  table: string,
): Promise<void> {
  const exists = await blueprint.tableExists(table);
  if (!exists) return;

  const indexes: TableIndexInformation[] = await blueprint.listIndexes(table);
  for (const idx of indexes) {
    if (!idx.unique && idx.columns) {
      console.log(`Non-unique index "${idx.name}" on [${idx.columns.join(", ")}]`);
    }
  }
}
```

```typescript
// Execute a sync batch with SyncAdapterContract
import { SyncAdapterContract, SyncInstruction } from "./contracts";

async function propagateNameChange(
  adapter: SyncAdapterContract,
  userId: string | number,
  newName: string,
): Promise<number> {
  const instruction: SyncInstruction = {
    targetTable: "posts",
    targetModel: "Post",
    filter: { "author.id": userId },
    update: { "author.name": newName },
    depth: 1,
    chain: ["User"],
    sourceModel: "User",
    sourceId: userId,
  };
  return adapter.executeOne(instruction);
}
```

```typescript
// Save a model document through WriterContract
import { WriterContract, WriterResult, WriterOptions } from "./contracts";

async function persistModel(writer: WriterContract): Promise<WriterResult> {
  const options: WriterOptions = {
    skipValidation: false,
    skipEvents: false,
    skipSync: false,
    replace: false,
  };
  return writer.save(options);
}
```

```typescript
// Generate a sequential ID with IdGeneratorContract
import { IdGeneratorContract, GenerateIdOptions } from "./contracts";

async function nextOrderId(generator: IdGeneratorContract): Promise<number> {
  const options: GenerateIdOptions = {
    table: "orders",
    initialId: 1000,
    incrementIdBy: 1,
  };
  return generator.generateNextId(options);
}
```

## DO NOT
- Do NOT implement `DriverContract` without covering every method in the interface — the model layer calls all of them and partial implementations cause runtime crashes.
- Do NOT import concrete driver classes in code that accepts a `DriverContract`, `QueryBuilderContract`, `MigrationDriverContract`, or any other contract — the entire purpose of this folder is to keep the model layer driver-agnostic.
- Do NOT call `ctx.rollback()` outside a `driver.transaction()` callback — it throws `TransactionRollbackError` as a control-flow mechanism and is only caught by the transaction wrapper.
- Do NOT skip the `DriverBlueprintContract.tableExists()` check before calling `listIndexes` or `listColumns` — some drivers throw when queried against a missing table.
- Do NOT use `UpdateOperations.$push` or `UpdateOperations.$pull` in SQL drivers — these fields are marked NoSQL only and will produce errors or be silently ignored depending on the driver implementation.
- Do NOT call `driver.dropAllTables()` in production migration code — it destroys the entire schema with no per-table guard and is irreversible.
