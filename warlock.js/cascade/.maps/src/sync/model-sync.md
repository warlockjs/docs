# model-sync
source: sync/model-sync.ts
description: Facade that registers and manages model sync operations with scoped HMR cleanup.
complexity: medium
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `ChildModel`, `Model` from `../model/model`
- `ModelSyncOperation` from `./model-sync-operation`
- `ModelSyncContract`, `ModelSyncOperationContract` from `./types`

## Exports
- `modelSync` — global `ModelSyncFacade` singleton instance  [line 204]

## Classes / Functions / Types / Constants

### `class ModelSyncFacade` implements `ModelSyncContract`  [lines 30-188]
Tracks sync operations globally and per registration scope.

#### `sync(source, target, field)`
returns: `ModelSyncOperationContract` — creates single-field sync  [lines 68-76]
side-effects: pushes new `ModelSyncOperation` to operations list

#### `syncMany(source, target, field)`
returns: `ModelSyncOperationContract` — creates array-field sync  [lines 95-103]
side-effects: pushes new `ModelSyncOperation` to operations list

#### `register(callback)`
returns: `() => void` — scoped cleanup function for HMR  [lines 125-150]
side-effects: executes callback, tracks scoped operations, returns unsubscriber

#### `clear()`
side-effects: unsubscribes and removes all registered operations  [lines 156-161]

#### `get count()`
returns: `number` — active operation count  [lines 167-169]

### `modelSync`
type: `ModelSyncFacade` — exported singleton  [line 204]
