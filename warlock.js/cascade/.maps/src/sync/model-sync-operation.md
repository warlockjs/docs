# model-sync-operation
source: sync/model-sync-operation.ts
description: Class managing a single sync relationship between source and target models via event subscriptions
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- `events`, `EventSubscription` from `@mongez/events`
- `ChildModel`, `Model` from `../model/model`
- `getModelDeletedEvent`, `getModelUpdatedEvent` from `./model-events`
- `DEFAULT_MAX_SYNC_DEPTH` from `./sync-context`
- `SyncManager` from `./sync-manager`
- `ModelSyncConfig`, `ModelSyncOperationContract` from `./types`

## Exports
- `ModelSyncOperation` — Class implementing `ModelSyncOperationContract` that manages event-driven sync between a source and target model  [lines 34-355]

## Classes / Functions / Types / Constants

### `ModelSyncOperation` [lines 34-355]
- Implements `ModelSyncOperationContract`. Subscribes to the source model's `updated` and `deleted` events in the constructor and delegates sync execution to `SyncManager`. Provides a fluent configuration API and lifecycle management methods. Private fields: `config: ModelSyncConfig`, `subscriptions: EventSubscription[]`, `isSubscribed: boolean`.

#### `constructor(sourceModelClass: ChildModel<Model>, targetModelClass: ChildModel<Model>, targetField: string, isMany: boolean)` [lines 58-78]
- Initializes `config` with defaults (`embedKey: "embedData"`, `identifierField: "id"`, `maxSyncDepth: DEFAULT_MAX_SYNC_DEPTH`, `watchFields: []`, `unsetOnDelete: false`, `removeOnDelete: false`) then immediately calls `subscribe()` to register event listeners.

#### `embed(method: string | string[]): this` [lines 95-98]
- Sets `config.embedKey` to the given method name or array of field names; returns `this` for chaining.

#### `identifyBy(field: string): this` [lines 112-115]
- Sets `config.identifierField` to the given field name (default `"id"`) for array element matching in `syncMany`; returns `this` for chaining.

#### `maxDepth(depth: number): this` [lines 128-131]
- Sets `config.maxSyncDepth` to the given depth value controlling chain depth; returns `this` for chaining.

#### `watchFields(fields: string[]): this` [lines 145-148]
- Sets `config.watchFields` to restrict sync triggers to specific changed fields; empty array means all fields trigger sync; returns `this` for chaining.

#### `unsetOnDelete(): this` [lines 160-163]
- Sets `config.unsetOnDelete = true` so the target field is unset when source is deleted; returns `this` for chaining.

#### `removeOnDelete(): this` [lines 175-178]
- Sets `config.removeOnDelete = true` so matching target documents are removed when source is deleted; returns `this` for chaining.

#### `unsubscribe(): void` [lines 212-219]
- Iterates `subscriptions` and calls `unsubscribe()` on each `EventSubscription`, clears the array, and resets `isSubscribed = false`.

#### `$cleanup(): void` [lines 224-226]
- Public alias for `unsubscribe()`; called by the framework during module cleanup / HMR.

#### `getConfig(): Readonly<ModelSyncConfig>` [lines 352-354]
- Returns a shallow spread copy of `config` typed as `Readonly<ModelSyncConfig>`; intended for debugging and testing.
