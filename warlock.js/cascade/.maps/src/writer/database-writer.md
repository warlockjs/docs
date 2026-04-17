# database-writer
source: writer/database-writer.ts
description: Database writer service orchestrating the model save pipeline (validation, insert/update, events, sync).
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-opus-4-7
last-updated-by: claude-opus-4-7

## Imports
- `events` from `@mongez/events`
- `getSealConfig`, `v`, `ObjectValidator` (type) from `@warlock.js/seal`
- `DriverContract`, `InsertResult`, `UpdateOperations`, `UpdateResult` (types) from `../contracts/database-driver.contract`
- `WriterContract`, `WriterOptions`, `WriterResult` (types) from `../contracts/database-writer.contract`
- `ChildModel`, `Model` (types) from `../model/model`
- `getModelUpdatedEvent` from `../sync/model-events`
- `StrictMode` (type) from `../types`
- `DatabaseWriterValidationError` from `../validation`
- `DataSource` (type) from `./../data-source/data-source`

## Exports
- `DatabaseWriter` — Class that orchestrates the full model persistence pipeline, implementing `WriterContract`.  [lines 54-494]

## Classes / Functions / Types / Constants

### `DatabaseWriter` [lines 54-494]
- Implements `WriterContract` and handles the complete save pipeline: change detection, `saving`/`validating` events, schema validation & casting via `@warlock.js/seal`, ID generation for new NoSQL records, insert or update via driver, merging driver-returned data, resetting the dirty tracker, and emitting `saved`/`created`/`updated` events plus a fire-and-forget sync trigger.
- Private fields: `model` (Model), `ctor` (ChildModel<Model>), `dataSource` (DataSource), `driver` (DriverContract), `table` (string), `primaryKey` (string), `schema` (ObjectValidator | undefined), `strictMode` (StrictMode).

#### `constructor(model: Model)` [lines 91-100]
- Initializes the writer by pulling `ctor`, `dataSource`, `driver`, `table`, `primaryKey`, `schema`, and `strictMode` from the model's constructor and data source.

#### `save(options: WriterOptions = {}): Promise<WriterResult>` [lines 109-165]
- Runs the full save pipeline. Short-circuits when the model is not new and has no changes. Emits `saving`, runs `validateAndCast`, dispatches to `performInsert` or `performUpdate`, resets the dirty tracker, sets `isNew = false`, emits `saved` and `created`/`updated`, and triggers sync (non-blocking) for updates when `skipSync` is not set. Returns `{ success, document, isNew, modifiedCount }`.

#### `generateNextId(): Promise<void>` [lines 339-361]
- Declared `public` (despite a `@private` JSDoc tag). Generates and assigns a new `id` on the model when `ctor.autoGenerateId` is truthy, `id` is not already set, and the data source has an `idGenerator`. Resolves initial ID and increment via `resolveInitialId()` and `resolveIncrementBy()` and calls `idGenerator.generateNextId({ table, initialId, incrementIdBy })`.

## Ambiguities
- `generateNextId` is annotated `@private` in JSDoc but declared with the `public` TypeScript modifier. It is mapped as public here to honor the language-level visibility.
- The file contains a duplicate JSDoc block for `triggerSync` (lines 474-480 and 481-489 describe the same method). No behavioral impact.
- All remaining methods (`validateAndCast`, `performInsert`, `performUpdate`, `buildUpdateOperations`, `resolveInitialId`, `resolveIncrementBy`, `randomInt`, `triggerSync`) are `private` and intentionally omitted per mapping rules.
