# model-events
source: events/model-events.ts
description: Defines model lifecycle event types, listener signature, and a lightweight async emitter class powering Cascade model hooks.
complexity: medium
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `QueryBuilderContract` from `../contracts`
- `Model` from `../model/model`
- `DeleteStrategy` from `../types`

## Exports
- `OnDeletedEventContext` — deleted event payload type  [lines 21-24]
- `ModelEventName` — union of all lifecycle event name strings  [lines 48-64]
- `ModelEventListener` — async listener callback signature  [lines 67-70]
- `ModelEvents` — generic async lifecycle event emitter class  [lines 79-386]
- `globalModelEvents` — singleton emitter for all model instances  [line 392]

## Classes / Functions / Types / Constants

### `ModelEventName`
Union of 16 lifecycle event name string literals.  [lines 48-64]

### `ModelEventListener<TModel, TContext>`
Callback type: receives model and context, returns void/Promise.  [lines 67-70]

### `ModelEvents<TModel>`
Lightweight async emitter for model lifecycle hooks.  [lines 79-386]
- `listeners` — public Map of event name to listener Set  [line 80]
- `on(event, listener)` — register listener; returns unsubscribe fn  [lines 86-93]
  side-effects: mutates `listeners` Map
- `once(event, listener)` — register auto-removing one-shot listener  [lines 98-110]
  side-effects: mutates `listeners` Map
- `off(event, listener)` — deregister a listener; cleans empty sets  [lines 115-127]
  side-effects: mutates `listeners` Map
- `emit(event, model, context)` — invoke all listeners sequentially  [lines 132-144]
  side-effects: calls registered listener functions
- `emitFetching(query, context?)` — emit "fetching" with query as model  [lines 149-154]
  side-effects: calls registered listener functions
- `clear()` — remove all registered listeners  [lines 159-161]
  side-effects: clears `listeners` Map
- `onSaving(listener)` — shorthand subscribe to "saving" event  [lines 172-176]
- `onSaved(listener)` — shorthand subscribe to "saved" event  [lines 186-188]
- `onCreating(listener)` — shorthand subscribe to "creating" event  [lines 198-201]
- `onCreated(listener)` — shorthand subscribe to "created" event  [lines 212-214]
- `onUpdating(listener)` — shorthand subscribe to "updating" event  [lines 224-227]
- `onUpdated(listener)` — shorthand subscribe to "updated" event  [lines 238-240]
- `onDeleting(listener)` — shorthand subscribe to "deleting" event  [lines 250-254]
- `onDeleted(listener)` — shorthand subscribe to "deleted" event  [lines 264-268]
- `onValidating(listener)` — shorthand subscribe to "validating" event  [lines 278-282]
- `onValidated(listener)` — shorthand subscribe to "validated" event  [lines 292-296]
- `onFetching(listener)` — shorthand subscribe to "fetching" event  [lines 307-311]
- `onHydrating(listener)` — shorthand subscribe to "hydrating" event  [lines 322-326]
- `onFetched(listener)` — shorthand subscribe to "fetched" event  [lines 337-341]
- `onRestoring(listener)` — shorthand subscribe to "restoring" event  [lines 351-355]
- `onRestored(listener)` — shorthand subscribe to "restored" event  [lines 365-369]

### `globalModelEvents`
Module-level `ModelEvents<Model>` singleton for cross-model concerns.  [line 392]
side-effects: module-scoped singleton instantiated at import time
