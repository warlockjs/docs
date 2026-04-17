# mongodb-blueprint
source: drivers/mongodb/mongodb-blueprint.ts
description: MongoDB blueprint driver exposing collection and index introspection.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `colors` from `@mongez/copper`
- `Db`, `IndexDescriptionInfo` from `mongodb`
- `DriverBlueprintContract`, `TableIndexInformation` from `../../contracts/driver-blueprint.contract`

## Exports
- `MongoDBBlueprint` — MongoDB blueprint class  [lines 8-65]

## Classes
### MongoDBBlueprint  [lines 8-65] — MongoDB schema introspection blueprint driver
extends: none
implements: DriverBlueprintContract

fields:
- `protected database: Db`  [line 12]

methods:
- `constructor(database: Db)`  [line 12] — Store MongoDB database reference
- `listTables(): Promise<string[]>`  [lines 17-20] — List all collection names
  - throws: `Error` — when database listCollections fails
  - side-effects: issues MongoDB listCollections query
- `listIndexes(table: string): Promise<TableIndexInformation[]>`  [lines 25-29] — List indexes for a collection
  - throws: `Error` — when collection indexes retrieval fails
  - side-effects: issues MongoDB indexes query
- `protected buildIndexInformation(index: IndexDescriptionInfo): TableIndexInformation`  [lines 34-43] — Map raw index to blueprint shape
- `listColumns(table: string): Promise<string[]>`  [lines 48-56] — Returns empty; MongoDB is schemaless
  - side-effects: logs yellow warning to console
- `tableExists(table: string): Promise<boolean>`  [lines 61-64] — Check collection existence by name
  - throws: `Error` — when database listCollections fails
  - side-effects: issues MongoDB listCollections query
