# mongodb-blueprint

source: drivers/mongodb/mongodb-blueprint.ts
description: MongoDB driver implementation of DriverBlueprintContract for database schema inspection
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `colors` from `@mongez/copper`
- `Db, IndexDescriptionInfo` from `mongodb` (type)
- `DriverBlueprintContract, TableIndexInformation` from `../../contracts/driver-blueprint.contract`

## Exports
- `MongoDBBlueprint` — MongoDB implementation of DriverBlueprintContract [lines 8-65]

## Classes / Functions / Types / Constants

### `MongoDBBlueprint` [lines 8-65]
- Implements DriverBlueprintContract to provide MongoDB-specific database schema inspection

#### `constructor(protected database: Db)` [lines 12]
- Stores reference to MongoDB database instance

#### `listTables(): Promise<string[]>` [lines 17-20]
- Lists all table/collection names in the database by calling listCollections and extracting names

#### `listIndexes(table: string): Promise<TableIndexInformation[]>` [lines 25-29]
- Lists all indexes for a specific table/collection by fetching indexes and mapping to TableIndexInformation format

#### `buildIndexInformation(index: IndexDescriptionInfo): TableIndexInformation` [lines 34-43]
- Builds TableIndexInformation object from MongoDB IndexDescriptionInfo, extracting name, type, columns, unique, partial, and raw options

#### `listColumns(table: string): Promise<string[]>` [lines 48-56]
- Returns empty array with warning message; MongoDB does not have static column definitions

#### `tableExists(table: string): Promise<boolean>` [lines 61-64]
- Checks if a given table/collection exists in the database by comparing against listCollections results
