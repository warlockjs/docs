# Sync
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> This folder implements the cascade sync system — the engine that propagates field updates and deletions from a source model to all embedded copies in target models, with depth limiting and cycle detection.

## What lives here
- `model-events.ts` — type-safe event name helpers for model updated/deleted events
- `model-sync-operation.ts` — manages a single source-to-target model sync relationship via event subscriptions
- `model-sync.ts` — facade (`modelSync` singleton) that registers and manages sync operations with scoped HMR cleanup
- `sync-context.ts` — static utilities for sync context creation, depth validation, and cycle detection
- `sync-manager.ts` — orchestrates multi-level sync operations across models with depth limiting and batch execution
- `types.ts` — core TypeScript types and contracts for the entire cascade sync system

## Public API
- `modelSync` — global `ModelSyncFacade` singleton; entry point for all sync registrations
- `modelSync.sync(source, target, field): ModelSyncOperationContract` — creates single-field embedded sync
- `modelSync.syncMany(source, target, field): ModelSyncOperationContract` — creates array-field embedded sync
- `modelSync.register(callback): () => void` — scoped registration with HMR cleanup function returned
- `modelSync.clear(): void` — unsubscribes and removes all registered operations
- `ModelSyncOperation.embed(method): this` — sets embed key for data extraction
- `ModelSyncOperation.watchFields(fields): this` — limits sync trigger to specific changed fields
- `ModelSyncOperation.unsetOnDelete(): this` — flags target field to unset on source delete
- `ModelSyncOperation.removeOnDelete(): this` — flags target document removal on source delete
- `ModelSyncOperation.identifyBy(field): this` — sets identifier field for array element matching
- `ModelSyncOperation.maxDepth(depth): this` — sets maximum chained sync depth
- `ModelSyncOperation.unsubscribe(): void` — removes all event subscriptions for this operation
- `SyncManager.syncUpdate(sourceId, updatedData, changedFields): Promise<SyncResult>` — executes sync for a model update
- `SyncManager.syncDelete(sourceId): Promise<SyncResult>` — executes sync for a model deletion
- `SyncContextManager.validate(depth, chain, targetModel, maxDepth, preventCircular)` — depth and cycle check
- `SyncContextManager.hasCycle(chain, targetModel): boolean` — true if target already in sync chain
- `SyncContextManager.canSyncDeeper(currentDepth, maxDepth): boolean` — true if depth is below max
- `getModelUpdatedEvent(modelClass): string` — returns event name e.g. `"model.Category.updated"`
- `getModelDeletedEvent(modelClass): string` — returns event name e.g. `"model.Category.deleted"`
- `getModelEvent(modelName, eventType): string` — returns event name from model name and type
- `MODEL_EVENT_PREFIX` — string prefix `"model"` for all sync events
- `ModelSyncEventType` — const object `{ UPDATED: "updated", DELETED: "deleted" }`
- `DEFAULT_MAX_SYNC_DEPTH` — default max depth constant `3`

## How it fits together
`modelSync` (facade) is the user-facing entry point; each call to `sync` or `syncMany` creates a `ModelSyncOperation` that immediately subscribes to source model events using `getModelUpdatedEvent`/`getModelDeletedEvent`. When an event fires, `ModelSyncOperation` delegates execution to `SyncManager`, which collects `SyncInstruction` objects and applies them to the database driver in depth order. `SyncContextManager` is consulted at every level to validate depth and detect circular chains before any database write is attempted.

## Working examples
```typescript
import { modelSync } from "@warlock.js/cascade";

// Register sync operations with automatic HMR cleanup
export const cleanup = modelSync.register(() => {
  // Single embedded field: keep Product.category in sync with Category
  modelSync.sync(Category, Product, "category")
    .embed("embedMinimal")
    .watchFields(["name", "slug"])
    .unsetOnDelete();

  // Array embedded field: keep Post.tags[i] in sync with Tag
  modelSync.syncMany(Tag, Post, "tags")
    .identifyBy("id")
    .embed("embedData")
    .maxDepth(2);
});

// Inspect active operation count (useful in tests)
console.log(modelSync.count); // number of active sync operations

// Teardown all operations (e.g. in test afterEach)
modelSync.clear();

// Build event names directly
import { getModelUpdatedEvent, getModelDeletedEvent, getModelEvent } from "@warlock.js/cascade";
const updatedEvent = getModelUpdatedEvent(Category); // "model.Category.updated"
const deletedEvent = getModelDeletedEvent(Category); // "model.Category.deleted"
const customEvent = getModelEvent("Product", "updated"); // "model.Product.updated"
```

## DO NOT
- Do NOT call `new ModelSyncOperation(...)` directly — always use `modelSync.sync()` or `modelSync.syncMany()` so the operation is tracked for cleanup.
- Do NOT omit `modelSync.register()` when defining sync relationships in application code — bare `sync`/`syncMany` calls outside `register()` will not be cleaned up during HMR and will accumulate duplicate subscriptions.
- Do NOT call `modelSync.syncMany()` without chaining `.identifyBy(field)` — without an identifier field, array element matching will fall back to the default `"id"` which may not match your schema.
- Do NOT set `maxDepth` above `DEFAULT_MAX_SYNC_DEPTH` (3) without explicitly validating your sync chains — deeper chains increase the risk of circular sync and cascading database writes.
- Do NOT bypass `SyncContextManager.validate()` when implementing custom sync runners — skipping depth and cycle checks can result in infinite recursive sync loops at runtime.
