# database-remover
source: remover/database-remover.ts
description: Implements the full model deletion pipeline supporting trash, soft, and permanent strategies.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `events` from `@mongez/events`
- `DriverContract`, `UpdateOperations` from `../contracts/database-driver.contract`
- `RemoverContract`, `RemoverOptions`, `RemoverResult` from `../contracts/database-remover.contract`
- `OnDeletedEventContext` from `../events/model-events`
- `ChildModel`, `Model` from `../model/model`
- `getModelDeletedEvent` from `../sync/model-events`
- `DataSource` from `./../data-source/data-source`

## Exports
- `DatabaseRemover` — orchestrates model deletion with strategy routing  [lines 33-266]

## Classes / Functions / Types / Constants

### `DatabaseRemover` [lines 33-266]
implements `RemoverContract`; orchestrates model deletion via strategy.

#### `constructor(model: Model)` [lines 64-71]
Initializes remover from model instance; resolves driver and table.
side-effects: reads model constructor, data source, and driver references.

#### `destroy(options?: RemoverOptions): Promise<RemoverResult>` [lines 80-200]
Executes deletion pipeline; resolves strategy, validates, emits events.
throws: `Error` if model is new, primary key missing, or record not found.
side-effects: emits `deleting`/`deleted` events; mutates `model.isNew`; triggers async sync.
