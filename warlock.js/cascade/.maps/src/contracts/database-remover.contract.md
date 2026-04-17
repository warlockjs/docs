# database-remover.contract
source: contracts/database-remover.contract.ts
description: Defines RemoverContract and supporting types for the full model deletion pipeline.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `DeleteStrategy` from `../types`

## Exports
- `RemoverContract` — deletion orchestration interface  [lines 24-53]
- `RemoverOptions` — options controlling destroy behaviour  [lines 58-82]
- `RemoverResult` — result returned after destroy completes  [lines 87-111]

## Types / Interfaces

### `RemoverContract` [lines 24-53]
Orchestrates strategy resolution, events, and driver execution for deletion.
- `destroy(options?: RemoverOptions): Promise<RemoverResult>` [line 52]
  — throws: if model is new or deletion fails; side-effects: emits deleting/deleted events

### `RemoverOptions` [lines 58-82]
- `strategy?: DeleteStrategy` — overrides model/datasource default = undefined
- `skipEvents?: boolean` — suppress lifecycle events = false
- `skipSync?: boolean` — suppress post-delete sync = false

### `RemoverResult` [lines 87-111]
- `success: boolean`
- `deletedCount: number` — 0 on failure, 1 otherwise
- `strategy: DeleteStrategy`
- `trashRecord?: Record<string, unknown>` — populated when strategy is "trash"
