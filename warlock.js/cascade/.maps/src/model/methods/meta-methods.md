# meta-methods
source: model/methods/meta-methods.ts
description: Static default application, ID generation, and atomic increment/decrement operations.
complexity: medium
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `DatabaseWriter` from `../../writer/database-writer`
- `Model` from `../model`

## Exports
- `applyDefaultsToModel` — apply config defaults to ModelClass statics  [lines 4-61]
- `generateModelNextId` — generate and assign next model ID  [lines 63-67]
- `performAtomicUpdate` — run raw atomic operations on model  [lines 69-74]
- `performAtomicIncrement` — atomically increment a field  [lines 76-87]
- `performAtomicDecrement` — atomically decrement a field  [lines 89-100]

## Classes / Functions / Types / Constants
### `applyDefaultsToModel(ModelClass, defaults)` [lines 4-61]
- side-effects: mutates ModelClass static properties if unset
- Covers: autoGenerateId, initialId, randomInitialId, incrementIdBy,
  randomIncrement, createdAtColumn, updatedAtColumn, deleteStrategy,
  deletedAtColumn, trashTable, strictMode

### `generateModelNextId(model)` [lines 63-67]
- async
- throws: propagates DatabaseWriter errors
- side-effects: mutates `model.id` via `DatabaseWriter.generateNextId`

### `performAtomicUpdate(model, operations)` [lines 69-74]
- async
- throws: propagates driver errors
- side-effects: issues atomic write to database for `model.id`

### `performAtomicIncrement<T>(model, field, amount?)` [lines 76-87]
- async
- throws: propagates from `performAtomicUpdate`
- side-effects: calls `model.increment`, then atomic `$inc` write

### `performAtomicDecrement<T>(model, field, amount?)` [lines 89-100]
- async
- throws: propagates from `performAtomicUpdate`
- side-effects: calls `model.decrement`, then atomic `$inc` write with negated amount
