# driver-blueprint.contract
source: contracts/driver-blueprint.contract.ts
description: Defines DriverBlueprintContract for querying database information schema and TableIndexInformation type.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
_(none)_

## Exports
- `DriverBlueprintContract` — information-schema query interface  [lines 1-25]
- `TableIndexInformation` — index metadata shape  [lines 27-57]

## Types / Interfaces

### `DriverBlueprintContract` [lines 1-25]
Interface for inspecting live database schema (tables, columns, indexes).
- `listTables(): Promise<string[]>` [line 5]
- `listIndexes(table: string): Promise<TableIndexInformation[]>` [line 9]
- `listColumns(table: string): Promise<string[]>` [line 19]
- `tableExists(table: string): Promise<boolean>` [line 24]

### `TableIndexInformation` [lines 27-57]
- `name: string`
- `columns?: string[]`
- `type?: string`
- `unique: boolean`
- `partial: boolean`
- `options: Record<string, any>`
