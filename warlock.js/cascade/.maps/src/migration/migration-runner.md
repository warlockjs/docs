# migration-runner
source: migration/migration-runner.ts
description: Pure executor that runs, rolls back, exports, and reports status for registered migrations against a data source.
complexity: complex
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-opus-4-7
last-updated-by: claude-opus-4-7

## Imports
- `colors` from `@mongez/copper`
- `log` from `@warlock.js/logger`
- `fs` from `fs`
- `path` from `path`
- `MigrationDriverContract` (type) from `../contracts/migration-driver.contract`
- `DataSource` (type) from `../data-source/data-source`
- `dataSourceRegistry` from `../data-source/data-source-registry`
- `Migration` (type) from `./migration`
- `SQLGrammar` from `./sql-grammar`
- `MigrationRecord`, `MigrationResult`, `TaggedSQL` (types) from `./types`

## Exports
- `MigrationRunner` — class that executes, rolls back, exports, and reports on migrations  [lines 155-1053]
- `migrationRunner` — default singleton instance of `MigrationRunner`  [line 1055]

## Classes / Functions / Types / Constants

### `MigrationRunner` [lines 155-1053]
- Pure migration executor. Does not discover migrations — the caller registers classes (each must carry a static `migrationName`). Supports single and batched execution, dry-run, SQL export, rollbacks, status reports, and extension pre-flight checks. Uses the resolved `DataSource`'s driver and migration driver; defaults migrations table to `_migrations`.
- side-effects: writes to database, emits logs via `log`, writes SQL export files to `database/sql/`.

#### `public readonly migrations: MigrationClass[]` (field) [line 157]
- List of registered migration classes.

#### `constructor(options: { dataSource?: DataSource; migrationsTable?: string; verbose?: boolean } = {})` [lines 176-186]
- Stores optional `dataSource`, defaults `migrationsTable` to `"_migrations"` and `verbose` to `true`.

#### `setDataSource(dataSource: DataSource): this` [lines 195-199]
- Assigns the data source and clears the cached migration driver. Returns `this`.

#### `register(MigrationClass: MigrationClass): this` [lines 240-254]
- Registers a migration class. Throws if static `migrationName` is missing. Deduplicates by `migrationName`.
- throws: `Error` when `MigrationClass.migrationName` is not set.

#### `registerMany(migrations: MigrationClass[]): this` [lines 262-267]
- Registers an array of migration classes by calling `register` on each.

#### `clear(): this` [lines 272-275]
- Removes all registered migrations.

#### `getRegisteredNames(): string[]` [lines 280-282]
- Returns the `migrationName` value of every registered migration.

#### `async run(MigrationClass: MigrationClass, options: ExecuteOptions = {}): Promise<MigrationResult>` [lines 301-309]
- Executes a single migration's `up()` via `runMigration`. Single-run `record` defaults to `false`.
- throws: propagates driver/query errors.

#### `async rollback(MigrationClass: MigrationClass, options: ExecuteOptions = {}): Promise<MigrationResult>` [lines 323-331]
- Executes a single migration's `down()` via `runMigration`. Single-run `record` defaults to `false`.
- throws: propagates driver/query errors.

#### `async runAll(options: ExecuteOptions = {}): Promise<MigrationResult[]>` [lines 352-529]
- Collects SQL from all pending migrations, classifies/tags/sorts statements via `SQLGrammar`, fires concurrent `CREATE EXTENSION` pre-flight checks, then executes the batch (inside a driver transaction when available). On failure, identifies the single culprit migration and reports all others as rolled back / not reached. Dry-run prints statements without executing. Records migrations in the tracking table when `record` is true (defaults `true` for batch).
- throws: `Error("Migration batch failed: ...")` when the batched execution fails.

#### `async exportSQL(options: { pendingOnly?: boolean; compact?: boolean } = {}): Promise<void>` [lines 535-605]
- Writes phase-ordered SQL to `database/sql/migration_<timestamp>.up.sql` and `.down.sql`. Exports all registered migrations unless `pendingOnly` is true. `down` statements are emitted in reverse order. Uses `formatSQLForExport` to group by `(phase, migrationName)` with block comments (or compact mode with no grouping).
- side-effects: creates directory and writes two files per invocation.

#### `async rollbackLast(options: ExecuteOptions = {}): Promise<MigrationResult[]>` [lines 613-615]
- Rolls back the most recent batch by delegating to `rollbackBatches(1, options)`.

#### `async rollbackBatches(batches: number, options: ExecuteOptions = {}): Promise<MigrationResult[]>` [lines 624-661]
- Rolls back the last N batches. Resolves affected classes, iterates running `runMigration(..., "down", ...)` and stops on the first failure. `record` defaults to `true`.

#### `async rollbackAll(options: ExecuteOptions = {}): Promise<MigrationResult[]>` [lines 669-678]
- Reads executed records and rolls back every batch (calls `rollbackBatches(maxBatch, options)`).

#### `async fresh(options: ExecuteOptions = {}): Promise<MigrationResult[]>` [lines 686-690]
- Performs `rollbackAll` then `runAll`, returning the concatenated results.

#### `async status(): Promise<Array<{ name: string; table: string; executed: boolean; batch: number | null }>>` [lines 699-721]
- Returns execution status for every registered migration, enriched with `batch` from the tracking table when executed. Instantiates each class to read its `table` value.

#### `async getExecutedMigrations(): Promise<MigrationRecord[]>` [lines 1003-1017]
- Ensures the migrations table exists then reads all rows ordered by `batch` then `name`. Returns `[]` if the read throws.

### `migrationRunner` (constant) [line 1055]
- `export const migrationRunner = new MigrationRunner();` — default runner singleton with default options.

### Internal / non-exported types
- `MigrationClass` [lines 15-18] — `(new () => Migration) & { migrationName: string; createdAt?: string }`.
- `MigrationData` [lines 24-28] — `{ MigrationClass; migration; name }` internal bundle.
- `ExecuteOptions` [lines 33-38] — `{ readonly dryRun?: boolean; readonly record?: boolean }` (used in public signatures but not exported).

### Module-scope helpers (not exported)
- `parseCreatedAt(createdAt: string): Date | undefined` [lines 46-96] — parses `MM-DD-YYYY_HH-MM-SS` / `DD-MM-YYYY_HH-MM-SS` timestamps with heuristic format detection; falls back to native `Date` parsing.
- `sortMigrations(a, b): number` [lines 105-119] — comparator using `createdAt` then alphabetical `migrationName`.

### Private members (skipped per rules, listed for completeness)
- `dataSource?` [line 160], `cachedMigrationDriver?` [line 163], `migrationsTable` [line 166], `verbose` [line 169].
- `getDataSource` [lines 204-209], `getMigrationDriver` [lines 214-219], `informIfExtensionMissing` [lines 738-769], `runMigration` [lines 778-900], `createMigrationInstance` [lines 910-915], `formatSQLForExport` [lines 935-967], `getPendingMigrations` [lines 972-978], `getMigrationsToRollback` [lines 983-998], `recordMigration` [lines 1022-1035], `removeMigrationRecord` [lines 1040-1043], `getNextBatchNumber` [lines 1048-1052].

## Notes / Ambiguities
- The class-level JSDoc example (line ~139) mentions `runner.execute(...)`, but the public method is named `run` — the doc example is slightly stale.
- `ExecuteOptions` is used in the signatures of public methods but is not itself exported from the module.
- `status()` constructs each class via `new MigrationClass()` without calling `setDriver` / `setMigrationDefaults` — safe because it only reads `instance.table`.
- `getExecutedMigrations` is the only public read helper; all `record*` / `remove*` / `getNextBatchNumber` / `getPending*` are private.
- Single-execution `run` / `rollback` default `record` to `false` (single-ops are transient); `runAll` / `rollbackBatches` default `record` to `true`.
