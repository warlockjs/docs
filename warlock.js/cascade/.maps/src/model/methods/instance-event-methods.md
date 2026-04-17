# instance-event-methods
source: model/methods/instance-event-methods.ts
description: Helpers to emit and subscribe to instance-level model lifecycle events.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `globalModelEvents`, `ModelEventListener`, `ModelEventName` from `../../events/model-events`
- `Model` from `../model`

## Exports
- `emitModelEvent` — emit event on instance, class, and global buses  [lines 8-17]
- `onModelEvent` — subscribe a listener to instance event  [lines 19-25]
- `onceModelEvent` — subscribe one-time listener to instance event  [lines 27-33]
- `offModelEvent` — unsubscribe listener from instance event  [lines 35-41]

## Classes / Functions / Types / Constants
### `emitModelEvent<TContext>(model, event, context?)` [lines 8-17]
- async
- throws: propagates errors from event handlers
- side-effects: emits on `model.events`, constructor events, `globalModelEvents`

### `onModelEvent<TContext>(model, event, listener)` [lines 19-25]
- Returns unsubscribe function
- side-effects: registers listener on `model.events`

### `onceModelEvent<TContext>(model, event, listener)` [lines 27-33]
- Returns unsubscribe function
- side-effects: registers one-time listener on `model.events`

### `offModelEvent<TContext>(model, event, listener)` [lines 35-41]
- side-effects: removes listener from `model.events`
