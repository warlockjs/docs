# database-remover.contract
source: contracts/database-remover.contract.ts
description: Contract for orchestrating model deletion with strategies and events
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `DeleteStrategy` from `../types`

## Exports
- `RemoverContract` — Interface for model deletion [lines 24-52]
- `RemoverOptions` — Configuration for destroy operation [lines 58-82]
- `RemoverResult` — Result of destroy operation [lines 87-111]

## Types

### `RemoverOptions` [lines 58-82]
- `strategy?: DeleteStrategy` — Override delete strategy (trash, permanent, soft)
- `skipEvents?: boolean` — Skip lifecycle event emission (default: false)
- `skipSync?: boolean` — Skip sync operations after delete (default: false)

### `RemoverResult` [lines 87-111]
- `success: boolean` — Whether destroy operation succeeded
- `deletedCount: number` — Number of records deleted
- `strategy: DeleteStrategy` — Delete strategy that was used
- `trashRecord?: Record<string, unknown>` — Original data if trash strategy used

## Interfaces

### `RemoverContract` [lines 24-52]

#### `destroy(options?: RemoverOptions): Promise<RemoverResult>` [lines 52-52]
- Destroys (deletes) model instance from database
- Performs deletion based on resolved strategy
- Automatically emits lifecycle events
- Returns result with success status and metadata
- Throws if model is new or deletion fails
