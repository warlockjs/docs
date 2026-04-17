# sql-database-dirty-tracker
source: sql-database-dirty-tracker.ts
description: SQL-specific dirty tracker that skips dot-notation flattening so JSON columns are compared as whole objects rather than decomposed paths.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `DatabaseDirtyTracker` from `./database-dirty-tracker`

## Exports
- `SqlDatabaseDirtyTracker` — SQL-aware subclass of DatabaseDirtyTracker  [lines 8-16]

## Classes / Functions / Types / Constants

### Classes
- `SqlDatabaseDirtyTracker` — overrides flattening to preserve nested JSON structure  [lines 8-16]
  - `flattenData(data)` — shallow-copies data without recursive flattening  [lines 12-14]
