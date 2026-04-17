# mongodb-id-generator
source: drivers/mongodb/mongodb-id-generator.ts
description: MongoDB auto-increment ID generator that maintains per-table counters in a dedicated "MasterMind" collection using atomic findOneAndUpdate.
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- `GenerateIdOptions` from `../../contracts`
- `IdGeneratorContract` from `../../contracts`
- `MongoDbDriver` from `./mongodb-driver`

## Exports
- `MongoIdGenerator` — Implements `IdGeneratorContract`. Generates, retrieves, and resets integer auto-increment IDs for any table using a central counter collection.  [lines 43-169]

## Classes / Functions / Types / Constants

### `MongoIdGenerator` [lines 43-169]
- Implements `IdGeneratorContract`. Uses a separate MongoDB collection (default: `"MasterMind"`) with one document per table storing the last generated ID. All writes go through `MongoDbDriver` methods, which automatically attach the active session for transaction support.

#### `counterCollection: string` [lines 50-50]
- Public readonly property. Name of the counter collection. Defaults to `"MasterMind"` for backward compatibility with legacy Cascade. Can be overridden via the constructor.

#### `constructor(driver: MongoDbDriver, counterCollection?: string)` [lines 63-70]
- Stores the driver reference. Overrides `counterCollection` when an optional non-empty string is provided.

#### `generateNextId(options: GenerateIdOptions): Promise<number>` [lines 94-126]
- Atomically increments the counter for `options.table` using `collection.findOneAndUpdate` with an aggregation-pipeline update (`$set` + `$cond`). `initialId` defaults to `1`; `incrementIdBy` defaults to `1`. Uses `upsert: true` and `returnDocument: "after"`. Returns the new ID from the result document, or falls back to `initialId` if the result is null.

#### `getLastId(table: string): Promise<number>` [lines 140-144]
- Queries the counter collection via `driver.queryBuilder` for the document matching `{ collection: table }`. Returns `doc.id` cast to `number`, or `0` if no document exists.

#### `setLastId(table: string, id: number): Promise<void>` [lines 161-168]
- Upserts the counter document for `table` via `driver.update`, setting `{ id, collection: table }` with `upsert: true`. Used for seeding or resetting ID sequences.
