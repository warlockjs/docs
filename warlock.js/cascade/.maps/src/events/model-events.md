# model-events
source: events/model-events.ts
description: Lightweight async event emitter powering model lifecycle hooks (saving, created, deleted, fetched, etc.) with a global cross-model emitter instance.
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- `QueryBuilderContract` from `../contracts`
- `Model` (type) from `../model/model`
- `DeleteStrategy` from `../types`

## Exports
- `OnDeletedEventContext` — Context object emitted with the "deleted" event, extends `OnDeletingEventContext` with `deletedCount` and optional `trashRecord`.  [lines 21-24]
- `ModelEventName` — Union type of all 16 supported lifecycle event name strings.  [lines 48-64]
- `ModelEventListener` — Generic async listener signature `(model, context) => void | Promise<void>`.  [lines 67-70]
- `ModelEvents` — Generic class: lightweight async event emitter for model lifecycle hooks.  [lines 79-386]
- `globalModelEvents` — Singleton `ModelEvents<Model>` instance for cross-cutting, cross-model subscriptions.  [line 392]

## Classes / Functions / Types / Constants

### `OnDeletedEventContext` [lines 21-24]
- Exported type alias extending `OnDeletingEventContext` (`strategy`, `primaryKeyValue`, `primaryKey`) with `deletedCount: number` and optional `trashRecord?: Record<string, unknown>`.

### `ModelEventName` [lines 48-64]
- Union of 16 string literals: `"initializing" | "fetching" | "hydrating" | "fetched" | "validating" | "validated" | "saving" | "saved" | "creating" | "created" | "updating" | "updated" | "deleting" | "deleted" | "restoring" | "restored"`.

### `ModelEventListener<TModel, TContext>` [lines 67-70]
- Function type `(model: TModel, context: TContext) => void | Promise<void>`. Used for all listener registrations.

### `ModelEvents<TModel>` [lines 79-386]
- Generic class. Stores listeners in `public readonly listeners: Map<ModelEventName, Set<ModelEventListener<TModel>>>`. No external dependencies.

#### `on<TContext = unknown>(event: ModelEventName, listener: ModelEventListener<TModel, TContext>): () => void` [lines 86-93]
- Adds `listener` to the set for `event`. Returns an unsubscribe function that calls `off`.

#### `once<TContext = unknown>(event: ModelEventName, listener: ModelEventListener<TModel, TContext>): () => void` [lines 98-110]
- Wraps `listener` in a one-shot wrapper that calls `off` on itself after the first invocation, then delegates to `on`.

#### `off<TContext = unknown>(event: ModelEventName, listener: ModelEventListener<TModel, TContext>): void` [lines 115-127]
- Removes `listener` from the set for `event`. Deletes the set entirely when it becomes empty.

#### `emit<TContext = unknown>(event: ModelEventName, model: TModel, context: TContext): Promise<void>` [lines 132-144]
- Iterates all listeners for `event` sequentially (awaits each), using a snapshot array to avoid mutation issues during iteration.

#### `emitFetching<TContext = unknown>(query: QueryBuilderContract, context?: TContext): Promise<void>` [lines 149-154]
- Convenience wrapper: emits the `"fetching"` event, passing `query` as the model argument and optional `context`.

#### `clear(): void` [lines 159-161]
- Removes all registered listeners across all events by calling `this.listeners.clear()`.

#### `onSaving<TContext = OnSavingEventContext>(listener: ModelEventListener<TModel, TContext>): () => void` [lines 172-176]
- Registers a listener for `"saving"` (before persist, before validation). Default context typed as `OnSavingEventContext`. Returns unsubscribe function.

#### `onSaved<TContext = unknown>(listener: ModelEventListener<TModel, TContext>)` [lines 186-188]
- Registers a listener for `"saved"` (after successful persist). Returns unsubscribe function.

#### `onCreating<TContext = unknown>(listener: ModelEventListener<TModel, TContext>): () => void` [lines 198-202]
- Registers a listener for `"creating"` (before insert). Returns unsubscribe function.

#### `onCreated<TContext = unknown>(listener: ModelEventListener<TModel, TContext>): () => void` [lines 212-214]
- Registers a listener for `"created"` (after successful insert). Returns unsubscribe function.

#### `onUpdating<TContext = unknown>(listener: ModelEventListener<TModel, TContext>): () => void` [lines 224-228]
- Registers a listener for `"updating"` (before update). Returns unsubscribe function.

#### `onUpdated<TContext = unknown>(listener: ModelEventListener<TModel, TContext>): () => void` [lines 238-240]
- Registers a listener for `"updated"` (after successful update). Returns unsubscribe function.

#### `onDeleting<TContext = OnDeletingEventContext>(listener: ModelEventListener<TModel, TContext>): () => void` [lines 250-254]
- Registers a listener for `"deleting"` (before delete). Default context typed as `OnDeletingEventContext`. Returns unsubscribe function.

#### `onDeleted<TContext = OnDeletedEventContext>(listener: ModelEventListener<TModel, TContext>): () => void` [lines 264-268]
- Registers a listener for `"deleted"` (after successful delete). Default context typed as `OnDeletedEventContext`. Returns unsubscribe function.

#### `onValidating<TContext = OnValidatingEventContext>(listener: ModelEventListener<TModel, TContext>): () => void` [lines 278-282]
- Registers a listener for `"validating"` (before validation). Default context typed as `OnValidatingEventContext`. Returns unsubscribe function.

#### `onValidated<TContext = unknown>(listener: ModelEventListener<TModel, TContext>): () => void` [lines 292-296]
- Registers a listener for `"validated"` (after validation completes). Returns unsubscribe function.

#### `onFetching<TContext = OnFetchingEventContext>(listener: ModelEventListener<TModel, TContext>): () => void` [lines 307-311]
- Registers a listener for `"fetching"` (before query execution; receives query builder for modification). Default context typed as `OnFetchingEventContext`. Returns unsubscribe function.

#### `onHydrating<TContext = OnHydratingEventContext>(listener: ModelEventListener<TModel, TContext>): () => void` [lines 322-326]
- Registers a listener for `"hydrating"` (after raw fetch, before hydration into model instances). Default context typed as `OnHydratingEventContext`. Returns unsubscribe function.

#### `onFetched<TContext = OnFetchedEventContext>(listener: ModelEventListener<TModel, TContext>): () => void` [lines 337-341]
- Registers a listener for `"fetched"` (after models are fetched and hydrated). Default context typed as `OnFetchedEventContext`. Returns unsubscribe function.

#### `onRestoring<TContext = unknown>(listener: ModelEventListener<TModel, TContext>): () => void` [lines 351-355]
- Registers a listener for `"restoring"` (before soft-delete restore). Returns unsubscribe function.

#### `onRestored<TContext = unknown>(listener: ModelEventListener<TModel, TContext>): () => void` [lines 365-369]
- Registers a listener for `"restored"` (after soft-delete restore completes). Returns unsubscribe function.

### `globalModelEvents` [line 392]
- Exported constant: `new ModelEvents<Model>()`. Single shared emitter for all model types; intended for auditing and request-scoped cross-cutting concerns. Instantiated at module import time.
