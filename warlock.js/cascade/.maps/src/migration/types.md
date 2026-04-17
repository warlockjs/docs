# types
source: migration/types.ts
description: Shared TypeScript interfaces and types for migration results, records, options, and SQL tagging.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `Migration` from `./migration`

## Exports
- `MigrationResult` — result of a single migration execution  [lines 6-21]
- `MigrationStatus` — file-level status with executed flag  [lines 26-39]
- `PendingMigration` — pending migration ready to execute  [lines 44-55]
- `MigrationRecord` — row stored in the migrations tracking table  [lines 60-69]
- `MigrationRunnerOptions` — configuration for the migration runner  [lines 74-107]
- `RunMigrationsOptions` — options for running migrations  [lines 112-123]
- `RollbackOptions` — options for rolling back migrations  [lines 128-145]
- `SQLStatementType` — union of semantic SQL statement categories  [lines 154-174]
- `TaggedSQL` — SQL string annotated with phase and ordering metadata  [lines 179-190]

## Classes / Functions / Types / Constants

### `MigrationResult` [lines 6-21]
- Readonly interface: name, table, direction, success, error, durationMs, executedAt.

### `MigrationStatus` [lines 26-39]
- Readonly interface: name, table, executed bool, batch, executedAt, filePath.

### `PendingMigration` [lines 44-55]
- Readonly interface holding migration instance, name, table, filePath, createdAt.

### `MigrationRecord` [lines 60-69]
- Mutable interface stored in `_migrations` table: name, batch, executedAt, createdAt.

### `MigrationRunnerOptions` [lines 74-107]
- Config interface: pattern glob, directory, migrationsTable, dryRun, verbose.

### `RunMigrationsOptions` [lines 112-123]
- Options for selective forward runs: optional `only` names array, dryRun flag.

### `RollbackOptions` [lines 128-145]
- Options: batches count, optional `only` names array, dryRun flag.

### `SQLStatementType` [lines 154-174]
- Union of 19 semantic DDL/DML category strings for statement classification.

### `TaggedSQL` [lines 179-190]
- Type: sql string, phase 1-6, statementType, optional createdAt and migrationName.
