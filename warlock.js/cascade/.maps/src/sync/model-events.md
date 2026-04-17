# model-events
source: sync/model-events.ts
description: Provides type-safe event name helpers for model sync updated and deleted events.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `ChildModel`, `Model` from `../model/model`

## Exports
- `MODEL_EVENT_PREFIX` — string prefix for all model sync events  [line 15]
- `ModelSyncEventType` — const object of sync event type values  [line 20-23]
- `ModelSyncEventTypeName` — union type of event type values  [line 25]
- `getModelUpdatedEvent` — returns model updated event name string  [line 39]
- `getModelDeletedEvent` — returns model deleted event name string  [line 55]
- `getModelEvent` — returns event name from model name and type  [line 72]

## Classes / Functions / Types / Constants

### `MODEL_EVENT_PREFIX`
type: `string` — constant  [line 15]

### `ModelSyncEventType`
type: const object — `{ UPDATED: "updated", DELETED: "deleted" }`  [lines 20-23]

### `ModelSyncEventTypeName`
type alias — union of `ModelSyncEventType` values  [line 25]

### `getModelUpdatedEvent(modelClass)`
returns: `string`  [lines 39-41]

### `getModelDeletedEvent(modelClass)`
returns: `string`  [lines 55-57]

### `getModelEvent(modelName, eventType)`
returns: `string`  [lines 72-74]
