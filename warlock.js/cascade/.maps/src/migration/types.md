# types
source: migration/types.ts
description: Shared TypeScript types and interfaces for the migration subsystem
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- `Migration` from `./migration`

## Exports
- `MigrationResult` — Result of a single migration execution  [lines 6-21]
- `MigrationStatus` — Status of a migration file (executed or pending)  [lines 26-39]
- `PendingMigration` — Pending migration ready to be executed  [lines 44-55]
- `MigrationRecord` — Record stored in the migrations tracking table  [lines 60-69]
- `MigrationRunnerOptions` — Options for configuring the migration runner  [lines 74-107]
- `RunMigrationsOptions` — Options for a run-migrations call  [lines 112-123]
- `RollbackOptions` — Options for rolling back migrations  [lines 128-145]
- `SQLStatementType` — Union of semantic DDL/DML statement classification strings  [lines 154-174]
- `TaggedSQL` — Tagged SQL statement with phase and ordering metadata  [lines 179-190]

## Classes / Functions / Types / Constants

### `MigrationResult` [lines 6-21]
- Read-only interface capturing the outcome of executing a single migration.
- Fields: `name: string`, `table: string`, `direction: "up" | "down"`, `success: boolean`, `error?: string`, `durationMs: number`, `executedAt: Date`.

### `MigrationStatus` [lines 26-39]
- Read-only interface describing whether a discovered migration file has been executed.
- Fields: `name: string`, `table: string`, `executed: boolean`, `batch: number | null`, `executedAt: Date | null`, `filePath: string`.

### `PendingMigration` [lines 44-55]
- Read-only interface for a migration that has been discovered but not yet executed.
- Fields: `name: string`, `table: string`, `migration: Migration`, `filePath: string`, `createdAt: Date`.

### `MigrationRecord` [lines 60-69]
- Mutable interface representing a row in the `_migrations` tracking table.
- Fields: `name: string`, `batch: number`, `executedAt: Date`, `createdAt: Date`.

### `MigrationRunnerOptions` [lines 74-107]
- Read-only configuration interface for the migration runner.
- Fields: `pattern?: string` (default `"**/*.migration.ts"`), `directory: string` (required), `migrationsTable?: string` (default `"_migrations"`), `dryRun?: boolean` (default `false`), `verbose?: boolean` (default `true`).

### `RunMigrationsOptions` [lines 112-123]
- Read-only options for a single run-migrations operation.
- Fields: `only?: string[]` (specific migration names; if absent, all pending are run), `dryRun?: boolean`.

### `RollbackOptions` [lines 128-145]
- Read-only options for a rollback operation.
- Fields: `batches?: number` (default `1`), `only?: string[]` (target migration names), `dryRun?: boolean`.

### `SQLStatementType` [lines 154-174]
- String union type classifying a SQL statement by its semantic meaning.
- Members: `"CREATE_EXTENSION"` | `"CREATE_SCHEMA"` | `"CREATE_TYPE"` | `"CREATE_DOMAIN"` | `"CREATE_TABLE"` | `"DROP_TABLE"` | `"TRUNCATE_TABLE"` | `"RENAME_TABLE"` | `"ADD_COLUMN"` | `"DROP_COLUMN"` | `"MODIFY_COLUMN"` | `"RENAME_COLUMN"` | `"ADD_FOREIGN_KEY"` | `"DROP_FOREIGN_KEY"` | `"ADD_PRIMARY_KEY"` | `"DROP_PRIMARY_KEY"` | `"CREATE_INDEX"` | `"CREATE_UNIQUE_INDEX"` | `"DROP_INDEX"` | `"RAW"`.

### `TaggedSQL` [lines 179-190]
- Object type associating a SQL string with its execution phase and ordering metadata.
- Fields: `sql: string`, `phase: 1 | 2 | 3 | 4 | 5 | 6`, `statementType: SQLStatementType`, `createdAt?: string`, `migrationName?: string`.
