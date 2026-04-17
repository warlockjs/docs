# sql-database-dirty-tracker
source: sql-database-dirty-tracker.ts
description: SQL-specific dirty tracker that preserves nested object structure instead of flattening
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `DatabaseDirtyTracker` from `./database-dirty-tracker`

## Exports
- `SqlDatabaseDirtyTracker` — Dirty tracker for SQL databases that avoids flattening nested objects [lines 8-16]

## Classes / Functions / Types / Constants

### `SqlDatabaseDirtyTracker` [lines 8-16]
- Extends `DatabaseDirtyTracker`
- `flattenData(data)` — Overrides parent method to keep raw data structure without flattening nested objects (shallow copy) [lines 12-15]
