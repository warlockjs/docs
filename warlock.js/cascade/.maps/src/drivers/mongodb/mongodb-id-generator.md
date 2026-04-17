# mongodb-id-generator
source: drivers/mongodb/mongodb-id-generator.ts
description: Implements auto-incrementing integer ID generation for MongoDB using a counter collection.
complexity: medium
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `GenerateIdOptions`, `IdGeneratorContract` from `../../contracts`
- `MongoDbDriver` from `./mongodb-driver`

## Exports
- `MongoIdGenerator` — atomic auto-increment ID generator for MongoDB  [lines 43-169]

## Classes / Functions / Types / Constants

### class `MongoIdGenerator` implements `IdGeneratorContract`  [lines 43-169]
Generates sequential integer IDs stored in a counter collection.

- readonly `counterCollection: string` — name of the ID counter collection  [line 50]
- `constructor(driver: MongoDbDriver, counterCollection?: string)`  [lines 63-70]
  - side-effects: sets `counterCollection` if provided
- `async generateNextId(options: GenerateIdOptions): Promise<number>`  [lines 94-126]
  - throws: propagates MongoDB errors from findOneAndUpdate
  - side-effects: upserts counter document; mutates counter collection
- `async getLastId(table: string): Promise<number>`  [lines 140-144]
  - side-effects: reads from counter collection
- `async setLastId(table: string, id: number): Promise<void>`  [lines 161-168]
  - side-effects: upserts counter document in counter collection
