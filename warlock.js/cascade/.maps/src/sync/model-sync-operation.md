# model-sync-operation
source: sync/model-sync-operation.ts
description: Manages a single source-to-target model sync relationship via event subscriptions.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `events`, `EventSubscription` from `@mongez/events`
- `ChildModel`, `Model` from `../model/model`
- `getModelDeletedEvent`, `getModelUpdatedEvent` from `./model-events`
- `DEFAULT_MAX_SYNC_DEPTH` from `./sync-context`
- `SyncManager` from `./sync-manager`
- `ModelSyncConfig`, `ModelSyncOperationContract` from `./types`

## Exports
- `ModelSyncOperation` — class managing one model sync operation  [lines 34-355]

## Classes / Functions / Types / Constants

### `class ModelSyncOperation` implements `ModelSyncOperationContract`  [lines 34-355]
Subscribes to source model events; triggers update or delete sync.
side-effects: subscribes to model updated/deleted events on construct

#### `constructor(sourceModelClass, targetModelClass, targetField, isMany)`
side-effects: calls `subscribe()`, registers event listeners  [lines 58-78]

#### `embed(method)`
returns: `this` — sets embed key for data extraction  [lines 95-98]

#### `identifyBy(field)`
returns: `this` — sets identifier field for array matching  [lines 112-115]

#### `maxDepth(depth)`
returns: `this` — sets maximum chained sync depth  [lines 128-131]

#### `watchFields(fields)`
returns: `this` — limits sync trigger to specific fields  [lines 145-148]

#### `unsetOnDelete()`
returns: `this` — flags target field unset on source delete  [lines 160-163]

#### `removeOnDelete()`
returns: `this` — flags target document removal on source delete  [lines 175-178]

#### `unsubscribe()`
side-effects: unsubscribes all event subscriptions, clears list  [lines 212-219]

#### `$cleanup()`
side-effects: delegates to `unsubscribe()`  [lines 224-226]

#### `getConfig()`
returns: `Readonly<ModelSyncConfig>` — shallow copy of config  [lines 352-354]
