# mongodb-sync-adapter
source: drivers/mongodb/mongodb-sync-adapter.ts
description: MongoDB sync adapter executing batch sync instructions using positional operators and arrayFilters.
complexity: medium
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `SyncAdapterContract`, `SyncInstruction` from `../../contracts/sync-adapter.contract`
- `MongoDbDriver` from `./mongodb-driver`

## Exports
- `MongoSyncAdapter` — executes sync instructions against MongoDB collections  [lines 15-200]

## Classes / Functions / Types / Constants

### class `MongoSyncAdapter` implements `SyncAdapterContract`  [lines 15-200]
Applies sync instructions to MongoDB using session-aware updateMany.

- `constructor(driver: MongoDbDriver)`  [lines 23-25]
- `async executeBatch(instructions: SyncInstruction[]): Promise<number>`  [lines 33-45]
  - side-effects: issues multiple updateMany calls against MongoDB
- `async executeOne(instruction: SyncInstruction): Promise<number>`  [lines 54-62]
  - side-effects: calls driver.updateMany on targetTable
- `async executeArrayUpdate(instruction: SyncInstruction): Promise<number>`  [lines 71-90]
  - throws: Error if arrayField or identifierField missing
  - side-effects: calls driver.updateMany with positional or arrayFilters strategy
