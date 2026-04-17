# database-writer
source: writer/database-writer.ts
description: Database writer service orchestrating model persistence pipeline with validation and events.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `events` from `@mongez/events`
- `getSealConfig`, `v`, `ObjectValidator` from `@warlock.js/seal`
- `DriverContract`, `InsertResult`, `UpdateOperations`, `UpdateResult` from `../contracts/database-driver.contract`
- `WriterContract`, `WriterOptions`, `WriterResult` from `../contracts/database-writer.contract`
- `ChildModel`, `Model` from `../model/model`
- `getModelUpdatedEvent` from `../sync/model-events`
- `StrictMode` from `../types`
- `DatabaseWriterValidationError` from `../validation`
- `DataSource` from `./../data-source/data-source`

## Exports
- `DatabaseWriter` — persists model via pipeline  [lines 54-494]

## Classes
### DatabaseWriter  [lines 54-494] — Orchestrates model save pipeline with events.
implements: WriterContract

methods:
- `constructor(model: Model)`  [lines 91-100] — Initializes writer from model metadata.
  - side-effects: reads model constructor and data source
- `save(options?: WriterOptions): Promise<WriterResult>`  [lines 109-165] — Executes full save pipeline.
  - throws: `DatabaseWriterValidationError` — when validation fails
  - side-effects: emits events, mutates model, writes DB, triggers sync
- `generateNextId(): Promise<void>`  [lines 339-361] — Generates id when auto-generation enabled.
  - side-effects: mutates model id field
