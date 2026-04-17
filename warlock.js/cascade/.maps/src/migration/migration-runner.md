# migration-runner
source: migration/migration-runner.ts
description: Pure migration executor that runs, rolls back, and tracks migrations against a database via a driver.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `colors` from `@mongez/copper`
- `log` from `@warlock.js/logger`
- `fs` from `fs`
- `path` from `path`
- `MigrationDriverContract` from `../contracts/migration-driver.contract`
- `DataSource` from `../data-source/data-source`
- `dataSourceRegistry` from `../data-source/data-source-registry`
- `Migration` from `./migration`
- `SQLGrammar` from `./sql-grammar`
- `MigrationRecord`, `MigrationResult`, `TaggedSQL` from `./types`

## Exports
- `MigrationRunner` — batch/single migration executor class  [lines 155-1053]
- `migrationRunner` — default singleton MigrationRunner instance  [line 1055]

## Classes / Functions / Types / Constants

### `MigrationRunner` [lines 155-1053]
- Registers, executes, and rolls back migrations; tracks state in DB table.
- side-effects: writes to database, logs via `log`, writes SQL files to disk

#### `constructor(options?)` [lines 176-186]
- Accepts optional dataSource, migrationsTable, verbose settings.

#### `setDataSource(dataSource)` [lines 195-199]
- Replaces data source and clears cached driver; returns `this`.

#### `register(MigrationClass)` [lines 240-254]
- Adds migration to registry; throws if migrationName not set.
- throws: `Error` if `migrationName` property missing

#### `registerMany(migrations)` [lines 262-267]
- Registers an array of migration classes; returns `this`.

#### `clear()` [lines 272-275]
- Empties the registered migrations list; returns `this`.

#### `getRegisteredNames()` [lines 280-282]
- Returns array of registered migration name strings.

#### `run(MigrationClass, options?)` [lines 301-309]
- Executes a single migration's `up()` method.
- throws: propagates driver/query errors

#### `rollback(MigrationClass, options?)` [lines 323-331]
- Executes a single migration's `down()` method.
- throws: propagates driver/query errors

#### `runAll(options?)` [lines 352-529]
- Runs all pending registered migrations in a phase-sorted batch.
- throws: `Error` on batch transaction failure
- side-effects: writes migration records, logs progress

#### `exportSQL(options?)` [lines 535-605]
- Exports phase-ordered SQL files to `database/sql/` directory.
- side-effects: creates directories and writes `.up.sql`/`.down.sql` files

#### `rollbackLast(options?)` [lines 613-615]
- Rolls back the last migration batch.

#### `rollbackBatches(batches, options?)` [lines 624-661]
- Rolls back N most-recent migration batches.

#### `rollbackAll(options?)` [lines 669-678]
- Rolls back all executed migrations.

#### `fresh(options?)` [lines 686-690]
- Rolls back all then runs all migrations.

#### `status()` [lines 699-721]
- Returns execution status for all registered migrations.

#### `getExecutedMigrations()` [lines 1003-1017]
- Queries the migrations table and returns all executed records.
