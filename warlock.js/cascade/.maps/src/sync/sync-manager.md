# sync-manager
source: sync/sync-manager.ts
description: Manages multi-level sync operations across models with depth limiting and batch execution.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `DriverContract` from `../contracts/database-driver.contract`
- `ChildModel`, `Model` from `../model/model`
- `DEFAULT_MAX_SYNC_DEPTH`, `SyncContextManager` from `./sync-context`
- `CollectInstructionsPayload`, `SyncConfig`, `SyncEventPayload`, `SyncInstruction`, `SyncInstructionOptions`, `SyncResult` from `./types`

## Exports
- `SyncManager` — sync orchestrator class  [lines 22-866]

## Classes
### SyncManager  [lines 22-866] — Orchestrates multi-level model sync operations

methods:
- `constructor(sourceModel: ChildModel<Model>, driver: DriverContract)`  [lines 32-35] — Initializes source model and driver
- `syncUpdate(sourceId: string | number, updatedData: Record<string, unknown> | Model, changedFields: string[]): Promise<SyncResult>`  [lines 45-101] — Executes sync for model update
  - throws: caught internally, returned in result
  - side-effects: emits syncing/synced events, logs errors
- `syncUpdateWithConfig(sourceId: string | number, updatedData: Record<string, unknown> | Model, changedFields: string[], config: SyncConfig): Promise<SyncResult>`  [lines 113-166] — Sync update using specific config
  - throws: caught internally, returned in result
  - side-effects: emits events, logs errors
- `syncDeleteWithConfig(sourceId: string | number, config: SyncConfig): Promise<SyncResult>`  [lines 176-225] — Sync delete using specific config
  - throws: caught internally, returned in result
  - side-effects: emits events, logs errors
- `syncDelete(sourceId: string | number): Promise<SyncResult>`  [lines 233-279] — Executes sync for model deletion
  - throws: caught internally, returned in result
  - side-effects: emits events, logs errors
