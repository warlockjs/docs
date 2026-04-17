# database-remover
source: remover/database-remover.ts
description: Orchestrates the complete model deletion pipeline including strategy resolution, validation, event emission, driver execution, and post-deletion cleanup.
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- `events` from `@mongez/events`
- `DriverContract`, `UpdateOperations` from `../contracts/database-driver.contract`
- `RemoverContract`, `RemoverOptions`, `RemoverResult` from `../contracts/database-remover.contract`
- `OnDeletedEventContext` from `../events/model-events`
- `ChildModel`, `Model` from `../model/model`
- `getModelDeletedEvent` from `../sync/model-events`
- `DataSource` from `./../data-source/data-source`

## Exports
- `DatabaseRemover` — Class implementing `RemoverContract` that manages the full deletion lifecycle for a model instance.  [lines 33-266]

## Classes / Functions / Types / Constants

### `DatabaseRemover` [lines 33-266]
- Implements `RemoverContract`. Accepts a `Model` instance at construction and resolves the data source, driver, table, and primary key from the model's static constructor. Supports three deletion strategies: `"trash"` (moves record to a trash table then deletes original), `"permanent"` (direct hard delete), and `"soft"` (sets a `deletedAt` timestamp via update). Strategy is resolved in priority order: call-time option → model static `deleteStrategy` → data source `defaultDeleteStrategy` → `"permanent"`.

#### `constructor(model: Model)` [lines 64-71]
- Stores the model instance and derives `ctor`, `dataSource`, `driver`, `table`, and `primaryKey` from it.

#### `destroy(options: RemoverOptions = {}): Promise<RemoverResult>` [lines 80-200]
- Resolves the deletion strategy, validates that the model is persisted and has a primary key, emits a `"deleting"` event (unless `options.skipEvents`), executes the appropriate driver operation for the resolved strategy, throws if `deletedCount === 0`, marks the model as new for `"trash"` and `"permanent"` strategies, emits a `"deleted"` event (unless `options.skipEvents`), triggers sync operations fire-and-forget (unless `options.skipSync`), and returns `{ success: true, deletedCount, strategy, trashRecord }`.
