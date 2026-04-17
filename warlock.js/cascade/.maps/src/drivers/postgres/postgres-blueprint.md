# postgres-blueprint
source: drivers/postgres/postgres-blueprint.ts
description: PostgreSQL schema introspection blueprint using information_schema and pg_catalog.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `DriverBlueprintContract` from `../../contracts/driver-blueprint.contract`
- `TableIndexInformation` from `../../contracts/driver-blueprint.contract`
- `PostgresDriver` from `./postgres-driver`

## Exports
- `PostgresBlueprint` — PostgreSQL schema introspection class  [lines 33-147]

## Classes
### PostgresBlueprint  [lines 33-147] — PostgreSQL schema introspection blueprint
implements: DriverBlueprintContract

fields:
- `readonly driver: PostgresDriver` (private)  [line 39]

methods:
- `constructor(driver: PostgresDriver)`  [line 39] — Creates blueprint bound to driver
- `listTables(): Promise<string[]>`  [lines 46-56] — Lists public base table names
  - throws: query errors from driver
  - side-effects: executes SQL query
- `listIndexes(table: string): Promise<TableIndexInformation[]>`  [lines 64-108] — Lists and parses table indexes
  - throws: query errors from driver
  - side-effects: executes SQL query
- `listColumns(table: string): Promise<string[]>`  [lines 116-127] — Lists column names ordered by position
  - throws: query errors from driver
  - side-effects: executes SQL query
- `tableExists(table: string): Promise<boolean>`  [lines 135-146] — Checks whether table exists in schema
  - throws: query errors from driver
  - side-effects: executes SQL query
