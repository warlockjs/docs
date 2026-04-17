# postgres-blueprint
source: drivers/postgres/postgres-blueprint.ts
description: PostgreSQL schema introspection via information_schema
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `DriverBlueprintContract, TableIndexInformation` from `../../contracts/driver-blueprint.contract`
- `PostgresDriver` from `./postgres-driver`

## Exports
- `PostgresBlueprint` — PostgreSQL schema introspection implementation [lines 33-147]

## Classes

### `PostgresBlueprint implements DriverBlueprintContract` [lines 33-147]

#### `constructor(driver: PostgresDriver)` [lines 39-39]
- Stores PostgreSQL driver instance for queries

#### `listTables(): Promise<string[]>` [lines 46-56]
- Queries information_schema for all tables in public schema
- Returns array of table names sorted alphabetically
- Filters for BASE TABLE type only

#### `listIndexes(table: string): Promise<TableIndexInformation[]>` [lines 64-108]
- Queries pg_indexes for all indexes on specified table
- Extracts column names from index definition
- Detects index type (btree, gin, gist, hash, ivfflat)
- Determines if index is unique or primary key
- Detects partial indexes
- Returns array of TableIndexInformation with options

#### `listColumns(table: string): Promise<string[]>` [lines 116-127]
- Queries information_schema for columns in specified table
- Returns array of column names in ordinal position order

#### `tableExists(table: string): Promise<boolean>` [lines 135-146]
- Checks if specified table exists in public schema
- Uses EXISTS subquery for efficiency
- Returns false if table not found or query returns no rows
