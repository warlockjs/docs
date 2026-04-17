# events
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> Defines model lifecycle event types, listener signatures, and a lightweight async emitter class powering all Cascade model hooks.

## What lives here
- `model-events.ts` — lifecycle event names, listener type, async `ModelEvents` emitter class, and `globalModelEvents` singleton

## Public API
- `OnDeletedEventContext` — deleted event payload with strategy, key, count, and optional trash record
- `ModelEventName` — union of 16 lifecycle event name string literals
- `ModelEventListener<TModel, TContext>(model: TModel, context: TContext): void | Promise<void>` — async listener callback signature
- `ModelEvents<TModel>` — async lifecycle event emitter with per-event listener sets
- `ModelEvents#on(event: ModelEventName, listener): () => void` — register listener, returns unsubscribe fn
- `ModelEvents#once(event: ModelEventName, listener): () => void` — register auto-removing one-shot listener
- `ModelEvents#off(event: ModelEventName, listener): void` — deregister a specific listener
- `ModelEvents#emit(event: ModelEventName, model, context): Promise<void>` — invoke all listeners sequentially
- `ModelEvents#emitFetching(query: QueryBuilderContract, context?): Promise<void>` — emit "fetching" with query
- `ModelEvents#clear(): void` — remove all registered listeners
- `ModelEvents#onSaving(listener)` — shorthand for "saving" event
- `ModelEvents#onSaved(listener)` — shorthand for "saved" event
- `ModelEvents#onCreating(listener)` — shorthand for "creating" event
- `ModelEvents#onCreated(listener)` — shorthand for "created" event
- `ModelEvents#onUpdating(listener)` — shorthand for "updating" event
- `ModelEvents#onUpdated(listener)` — shorthand for "updated" event
- `ModelEvents#onDeleting(listener)` — shorthand for "deleting" event
- `ModelEvents#onDeleted(listener)` — shorthand for "deleted" event
- `ModelEvents#onValidating(listener)` — shorthand for "validating" event
- `ModelEvents#onValidated(listener)` — shorthand for "validated" event
- `ModelEvents#onFetching(listener)` — shorthand for "fetching" event
- `ModelEvents#onHydrating(listener)` — shorthand for "hydrating" event
- `ModelEvents#onFetched(listener)` — shorthand for "fetched" event
- `ModelEvents#onRestoring(listener)` — shorthand for "restoring" event
- `ModelEvents#onRestored(listener)` — shorthand for "restored" event
- `globalModelEvents: ModelEvents<Model>` — singleton emitter for all model instances

## How it fits together
`ModelEvents` is instantiated per model class and also once as the module-level `globalModelEvents` singleton. Model internals call `emit` at each lifecycle stage; consumer code registers listeners via `on`, `once`, or the typed shorthand helpers. The `globalModelEvents` singleton lets cross-cutting concerns (auditing, request enrichment) subscribe to every model type from a single registration point. `ModelEventListener` is the shared callback contract consumed by both per-model and global emitters.

## Working examples
```typescript
import {
  ModelEvents,
  ModelEventListener,
  ModelEventName,
  OnDeletedEventContext,
  globalModelEvents,
} from "./model-events";
import type { Model } from "../model/model";

// Per-model emitter
const events = new ModelEvents<Model>();

// Register a persistent listener
const unsubscribe = events.onSaving((model, ctx) => {
  console.log("saving", ctx);
});

// One-shot listener
events.once("created", async (model, ctx) => {
  console.log("created once", model);
});

// Typed shorthand for deleted context
events.onDeleted<OnDeletedEventContext>((model, ctx) => {
  console.log("deleted count:", ctx.deletedCount);
});

// Global listener for all models
globalModelEvents.on("saved", (model) => {
  console.log("any model saved:", model);
});

// Emit manually
await events.emit("saving", {} as Model, { isInsert: true, mode: "insert" });

// Unsubscribe
unsubscribe();

// Clear all
events.clear();
```

## DO NOT
- Do NOT access `listeners` directly to add or remove handlers — use `on`/`off`/`once` so empty sets are cleaned up correctly.
- Do NOT throw inside a listener without catching — `emit` awaits each listener sequentially and an uncaught throw will abort remaining listeners in the set.
- Do NOT register listeners on `globalModelEvents` without a corresponding `off` or `clear` call in teardown — the singleton persists for the process lifetime and leaks if not cleaned up.
- Do NOT invent event name strings outside `ModelEventName` — unrecognized names are never emitted by the model internals and listeners will silently never fire.
