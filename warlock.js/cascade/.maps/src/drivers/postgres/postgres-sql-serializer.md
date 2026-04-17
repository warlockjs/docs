# postgres-sql-serializer
source: drivers/postgres/postgres-sql-serializer.ts
description: Converts pending migration operations into PostgreSQL DDL SQL strings without executing them.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `SqlDialectContract` from `../sql/sql-dialect.contract`
- `PendingOperation` from `../../migration/migration`
- `SQLSerializer` from `../../migration/sql-serializer`
- `ColumnDefinition`, `ForeignKeyDefinition`, `FullTextIndexOptions`, `GeoIndexOptions`, `IndexDefinition`, `VectorIndexOptions` from `../../contracts/migration-driver.contract`

## Exports
- `PostgresSQLSerializer` — PostgreSQL DDL serializer extending SQLSerializer  [lines 18-465]

## Classes / Functions / Types / Constants

### class `PostgresSQLSerializer` extends `SQLSerializer`  [lines 18-465]
Pure serializer: converts PendingOperation to SQL strings, no I/O.

- `constructor(dialect: SqlDialectContract)`  [lines 19-21]
- `serialize(operation: PendingOperation, table: string): string | string[] | null` — Dispatches operation type to private builder methods  [lines 23-117]
  - side-effects: none (pure string builder)
  - Returns `null` for unsupported operations (addCheck, dropCheck, schema validation)
  - Returns `string[]` for createTimestamps and vector addColumn (extension + DDL)
