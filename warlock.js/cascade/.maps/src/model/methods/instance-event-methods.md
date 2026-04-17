# instance-event-methods
source: model/methods/instance-event-methods.ts
description: Instance-level model event emission and listening
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `globalModelEvents, ModelEventListener, ModelEventName` from `../../events/model-events`
- `Model` from `../model`

## Exports
- `emitModelEvent` — Emit event on instance, class, and global emitters [lines 8-17]
- `onModelEvent` — Listen for event on instance [lines 19-25]
- `onceModelEvent` — Listen for event once on instance [lines 27-33]
- `offModelEvent` — Remove event listener from instance [lines 35-41]

## Classes / Functions / Types / Constants

### `emitModelEvent<TContext = unknown>(model: Model, event: ModelEventName, context?: TContext): Promise<void>` [lines 8-17]
- Emits event on instance, class, and global event emitters with optional context

### `onModelEvent<TContext = unknown>(model: Model, event: ModelEventName, listener: ModelEventListener<any, TContext>): () => void` [lines 19-25]
- Registers event listener on instance; returns unsubscribe function

### `onceModelEvent<TContext = unknown>(model: Model, event: ModelEventName, listener: ModelEventListener<any, TContext>): () => void` [lines 27-33]
- Registers one-time event listener on instance; returns unsubscribe function

### `offModelEvent<TContext = unknown>(model: Model, event: ModelEventName, listener: ModelEventListener<any, TContext>): void` [lines 35-41]
- Removes event listener from instance
