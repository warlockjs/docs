# mongodb-sync-adapter
source: drivers/mongodb/mongodb-sync-adapter.ts
description: MongoDB implementation of SyncAdapterContract that executes relational sync instructions using positional operators and arrayFilters.
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- `SyncAdapterContract` from `../../contracts/sync-adapter.contract`
- `SyncInstruction` from `../../contracts/sync-adapter.contract`
- `MongoDbDriver` from `./mongodb-driver`

## Exports
- `MongoSyncAdapter` — MongoDB sync adapter that applies batched sync instructions to related collections, delegating to `MongoDbDriver.updateMany` for session/transaction awareness.  [lines 15-200]

## Classes / Functions / Types / Constants

### `MongoSyncAdapter` [lines 15-200]
- Implements `SyncAdapterContract`. Holds a reference to `MongoDbDriver` and dispatches each `SyncInstruction` either as a plain `updateMany` or as an array-aware update using MongoDB's positional `$` operator or `arrayFilters`. Private methods (`canUsePositionalOperator`, `executeWithArrayFilters`, `buildOptimizedFilter`, `transformUpdateForArrayFilters`) are internal strategy helpers and not documented here.

#### `constructor(driver: MongoDbDriver)` [lines 23-25]
- Stores the driver reference used for all subsequent update calls.

#### `executeBatch(instructions: SyncInstruction[]): Promise<number>` [lines 33-45]
- Iterates over all instructions in order. Dispatches each to `executeArrayUpdate` when `instruction.isArrayUpdate` is truthy, otherwise to `executeOne`. Accumulates and returns the total `modifiedCount` across all instructions.

#### `executeOne(instruction: SyncInstruction): Promise<number>` [lines 54-62]
- Calls `this.driver.updateMany(targetTable, filter, update)` for a simple (non-array) sync instruction. Returns `result.modifiedCount`.

#### `executeArrayUpdate(instruction: SyncInstruction): Promise<number>` [lines 71-90]
- Entry point for array-field sync. Throws `Error` if `arrayField` or `identifierField` is missing on the instruction. Tries Strategy 1 (positional `$` operator) first by calling the private `canUsePositionalOperator` check; falls back to Strategy 2 (`executeWithArrayFilters`) when the filter does not already contain an array-element match key.
