# driver-blueprint.contract
source: contracts/driver-blueprint.contract.ts
description: Contract for database schema introspection across drivers
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Exports
- `DriverBlueprintContract` — Interface for database schema inspection [lines 1-25]
- `TableIndexInformation` — Type for index metadata [lines 27-57]

## Types

### `TableIndexInformation` [lines 27-57]
- `name: string` — Index name
- `columns?: string[]` — Indexed column names
- `type?: string` — Index type (btree, hash, gin, etc)
- `unique: boolean` — Whether index enforces uniqueness
- `partial: boolean` — Whether index is partial
- `options: Record<string, any>` — Additional driver-specific options

## Interfaces

### `DriverBlueprintContract` [lines 1-25]

#### `listTables(): Promise<string[]>` [lines 5-5]
- Returns array of all table names in the database

#### `listIndexes(table: string): Promise<TableIndexInformation[]>` [lines 9-9]
- Returns all indexes for the specified table with metadata

#### `listColumns(table: string): Promise<string[]>` [lines 19-19]
- Returns all column names for the specified table

#### `tableExists(table: string): Promise<boolean>` [lines 24-24]
- Checks if the specified table exists
