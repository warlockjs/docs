# write-methods
source: model/methods/write-methods.ts
description: Async write helpers for creating, upserting, and saving model records.
complexity: medium
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `DatabaseWriter` from `../../writer/database-writer`
- `WriterOptions` from `../../contracts`
- `ChildModel`, `Model`, `ModelSchema` from `../model`
- `emitModelEvent` from `./instance-event-methods`

## Exports
- `saveModel` — persists model instance via DatabaseWriter  [lines 6-16]
- `createRecord` — instantiates and saves a new model record  [lines 18-25]
- `createManyRecords` — creates multiple records in parallel  [lines 27-32]
- `findOrCreateRecord` — returns existing record or creates new one  [lines 34-49]
- `upsertRecord` — upserts record with timestamps and saving events  [lines 51-97]

## Classes / Functions / Types / Constants
### `saveModel<TModel>`  async
[lines 6-16]
- Merges optional partial schema before delegating to `DatabaseWriter.save`.
- side-effects: mutates model data via merge; persists to database
- throws: propagates writer errors

### `createRecord<TModel, TSchema>`  async
[lines 18-25]
- side-effects: inserts new row into database
- throws: propagates save errors

### `createManyRecords<TModel, TSchema>`  async
[lines 27-32]
- side-effects: inserts multiple rows concurrently
- throws: propagates save errors

### `findOrCreateRecord<TModel, TSchema>`  async
[lines 34-49]
- throws: propagates query or save errors

### `upsertRecord<TModel, TSchema>`  async
[lines 51-97]
- Emits `saving`/`saved` events; injects createdAt/updatedAt timestamps before upsert.
- side-effects: writes to database; emits model events; resets dirty tracker
- throws: propagates driver or event errors
