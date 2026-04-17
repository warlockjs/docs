# index
source: index.ts
description: Central barrel export file for Cascade ORM, re-exporting all public modules
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
None (barrel file)

## Exports
- `*` from `./context/database-data-source-context` [lines 2]
- `*` from `./context/database-transaction-context` [lines 3]
- `*` from `./contracts/database-driver.contract` [lines 6]
- `*` from `./contracts/database-id-generator.contract` [lines 7]
- `*` from `./contracts/database-remover.contract` [lines 8]
- `*` from `./contracts/database-restorer.contract` [lines 9]
- `*` from `./contracts/database-writer.contract` [lines 10]
- `*` from `./contracts/migration-driver.contract` [lines 11]
- `*` from `./contracts/query-builder.contract` [lines 12]
- `*` from `./contracts/sync-adapter.contract` [lines 13]
- `*` from `./data-source/data-source` [lines 16]
- `*` from `./data-source/data-source-registry` [lines 17]
- `*` from `./errors/missing-data-source.error` [lines 20]
- `*` from `./errors/transaction-rollback.error` [lines 21]
- `*` from `./database-dirty-tracker` [lines 24]
- `*` from `./events/model-events` [lines 25]
- `*` from `./model/model` [lines 26]
- `*` from `./model/register-model` [lines 27]
- `*` from `./remover/database-remover` [lines 28]
- `*` from `./restorer/database-restorer` [lines 29]
- `*` from `./types` [lines 30]
- `*` from `./validation` [lines 31]
- `*` from `./writer/database-writer` [lines 32]
- `*` from `./relations` [lines 35]
- `*` from `./expressions` [lines 38]
- `*` from `./drivers/mongodb/mongodb-driver` [lines 41]
- `*` from `./drivers/mongodb/mongodb-id-generator` [lines 42]
- `*` from `./drivers/mongodb/mongodb-query-builder` [lines 43]
- `*` from `./drivers/mongodb/mongodb-sync-adapter` [lines 44]
- `*` from `./drivers/mongodb/types` [lines 45]
- `MongoClientOptions, TransactionOptions` from `mongodb` [lines 48, type-only]
- `modelSync` from `./sync/model-sync` [lines 51]
- `ModelSyncOperation` from `./sync/model-sync-operation` [lines 52]
- `DEFAULT_MAX_SYNC_DEPTH, SyncContextManager` from `./sync/sync-context` [lines 53]
- `SyncManager` from `./sync/sync-manager` [lines 54]
- Types: `EmbedKey, ModelSyncConfig, ModelSyncContract, ModelSyncOperationContract, SyncConfig, SyncContext, SyncEventPayload, SyncInstruction, SyncInstructionOptions, SyncResult` [lines 56-66]
- `*` from `./utils/connect-to-database` [lines 69]
- `*` from `./utils/database-writer.utils` [lines 70]
- `*` from `./utils/define-model` [lines 71]
- `*` from `./utils/once-connected` [lines 72]
- `*` from `./migration` [lines 75]
- `MongoMigrationDriver` from `./drivers/mongodb/mongodb-migration-driver` [lines 78]
- `*` from `./drivers/sql` [lines 81]
- `*` from `./drivers/postgres` [lines 84]

## Summary
Comprehensive barrel export aggregating all Cascade ORM public APIs including context, contracts, data-source, errors, models, relations, expressions, drivers (MongoDB, SQL, PostgreSQL), sync system, migration, utilities, and MongoDB/PostgreSQL-specific types.
