# static-event-methods
source: model/methods/static-event-methods.ts
description: Static class-level model event management with registry
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `ModelEvents, globalModelEvents, ModelEventListener, ModelEventName` from `../../events/model-events`
- `removeModelFromRegistery` from `../register-model`
- `ChildModel, Model` from `../model`

## Exports
- `getModelEvents` — Get or create ModelEvents registry for class [lines 16-25]
- `cleanupModelEvents` — Remove class from event registry and model registry [lines 27-30]
- `onStaticEvent` — Register class-level event listener [lines 32-38]
- `onceStaticEvent` — Register one-time class-level event listener [lines 40-46]
- `offStaticEvent` — Remove class-level event listener [lines 48-54]
- `getGlobalEvents` — Get global event emitter [lines 56-58]

## Classes / Functions / Types / Constants

### `getModelEvents<TModel extends Model>(ModelClass: any): ModelEvents<TModel>` [lines 16-25]
- Retrieves or creates isolated ModelEvents instance from WeakMap registry for model class

### `cleanupModelEvents(ModelClass: any): void` [lines 27-30]
- Deletes class from event registry and removes from model registry

### `onStaticEvent<TModel extends Model = Model, TContext = unknown>(ModelClass: ChildModel<TModel>, event: ModelEventName, listener: ModelEventListener<TModel, TContext>): () => void` [lines 32-38]
- Registers class-level event listener; returns unsubscribe function

### `onceStaticEvent<TModel extends Model = Model, TContext = unknown>(ModelClass: ChildModel<TModel>, event: ModelEventName, listener: ModelEventListener<TModel, TContext>): () => void` [lines 40-46]
- Registers one-time class-level event listener; returns unsubscribe function

### `offStaticEvent<TModel extends Model = Model, TContext = unknown>(ModelClass: ChildModel<TModel>, event: ModelEventName, listener: ModelEventListener<TModel, TContext>): void` [lines 48-54]
- Removes class-level event listener

### `getGlobalEvents(): ModelEvents<Model>` [lines 56-58]
- Returns global model event emitter
