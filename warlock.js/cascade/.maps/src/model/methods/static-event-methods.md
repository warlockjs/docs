# static-event-methods
source: model/methods/static-event-methods.ts
description: Registry and helpers for per-class and global model event subscriptions.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `ModelEvents`, `globalModelEvents`, `ModelEventListener`, `ModelEventName` from `../../events/model-events`
- `removeModelFromRegistery` from `../register-model`
- `ChildModel`, `Model` from `../model`

## Exports
- `getModelEvents` — returns or creates ModelEvents instance for class  [lines 17-25]
- `cleanupModelEvents` — removes events registry entry and unregisters model  [lines 27-30]
- `onStaticEvent` — subscribes listener to named model event  [lines 32-38]
- `onceStaticEvent` — subscribes one-time listener to named model event  [lines 40-46]
- `offStaticEvent` — unsubscribes listener from named model event  [lines 48-54]
- `getGlobalEvents` — returns shared global model events emitter  [lines 56-58]

## Classes / Functions / Types / Constants
### `modelEventsRegistry`  (module-private)
[line 14]
- `WeakMap` keying model constructors to their `ModelEvents` instances.

### `getModelEvents<TModel>`
[lines 17-25]
- side-effects: lazily creates and stores new `ModelEvents` in registry

### `cleanupModelEvents`
[lines 27-30]
- side-effects: deletes from `modelEventsRegistry`; calls `removeModelFromRegistery`

### `onStaticEvent<TModel, TContext>`
[lines 32-38]
- Returns unsubscribe function.

### `onceStaticEvent<TModel, TContext>`
[lines 40-46]
- Returns unsubscribe function.

### `offStaticEvent<TModel, TContext>`
[lines 48-54]

### `getGlobalEvents`
[lines 56-58]
