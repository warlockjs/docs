# index
source: sync/index.ts
description: Barrel export for sync system components and event helpers
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
None (barrel file)

## Exports
- `modelSync` from `./model-sync` [line 8]
- `ModelSyncOperation` from `./model-sync-operation` [line 9]
- `MODEL_EVENT_PREFIX` from `./model-events` [line 13]
- `ModelSyncEventType` from `./model-events` [line 14]
- `getModelDeletedEvent` from `./model-events` [line 15]
- `getModelEvent` from `./model-events` [line 16]
- `getModelUpdatedEvent` from `./model-events` [line 17]
- `DEFAULT_MAX_SYNC_DEPTH` from `./sync-context` [line 21]
- `SyncContextManager` from `./sync-context` [line 21]
- `SyncManager` from `./sync-manager` [line 22]
- Types: `EmbedKey, ModelSyncConfig, ModelSyncContract, ModelSyncOperationContract, SyncConfig, SyncContext, SyncEventPayload, SyncInstruction, SyncInstructionOptions, SyncResult` [lines 25-36]

## Summary
Comprehensive barrel exporting the main sync API (modelSync, ModelSyncOperation), event helpers, internal managers (SyncContextManager, SyncManager), and all sync-related type definitions.
