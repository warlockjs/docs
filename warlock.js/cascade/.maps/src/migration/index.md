# index
source: migration/index.ts
description: Central export for migration system components
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
None (barrel file)

## Exports
- `ColumnBuilder` from `./column-builder` [line 2]
- `ForeignKeyBuilder` from `./foreign-key-builder` [line 3]
- `*` from `./column-helpers` [line 4]
- `*` from `./migration` [line 5]
- `*` from `./migration-runner` [line 6]
- Types: `MigrationRecord, MigrationResult, MigrationRunnerOptions, MigrationStatus, PendingMigration, RollbackOptions, RunMigrationsOptions` [lines 9-17]

## Summary
Barrel file exporting core migration builders (ColumnBuilder, ForeignKeyBuilder), helpers, and type definitions for migration operations.
