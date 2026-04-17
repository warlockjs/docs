# types
source: sync/types.ts
description: Core TypeScript types and contracts for the Cascade sync system
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- `ChildModel`, `Model` from `../model/model`

## Exports
- `SyncContext` — Context information tracking source, target, chain, and results of a sync operation  [lines 13-40]
- `SyncResult` — Result of a sync operation with success status, counts, and error details  [lines 46-67]
- `SyncInstruction` — A single sync instruction containing all info needed to perform a sync update  [lines 73-109]
- `SyncConfig` — Configuration for a single sync relationship  [lines 114-141]
- `SyncInstructionOptions` — Options for building sync instructions (depth, chain, maxDepth, preventCircular)  [lines 146-158]
- `CollectInstructionsPayload` — Payload for collecting sync instructions  [lines 163-178]
- `EmbedKey` — Union type of standard embed property names  [lines 183-183]
- `SyncEventPayload` — Event payload for sync events  [lines 188-212]
- `ModelSyncConfig` — Configuration for a model sync operation holding all settings for source-to-target sync  [lines 223-253]
- `ModelSyncOperationContract` — Interface contract for a model sync operation instance with fluent configuration  [lines 268-322]
- `ModelSyncContract` — Interface contract for the modelSync facade  [lines 337-373]

## Classes / Functions / Types / Constants

### `SyncContext` [lines 13-40]
- Object type tracking the full context of a sync operation: `sourceModel` name, `sourceId`, `currentDepth`, `syncChain` array, `targetModel` name, `filter`, `update` payload, `affectedCount`, and `timestamp`.

### `SyncResult` [lines 46-67]
- Object type representing the outcome of a sync operation: `success` flag, `attempted`/`succeeded`/`failed` counts, `errors` array (each pairing a `SyncInstruction` with an `Error`), `depthReached`, and all `contexts` (`SyncContext[]`) created.

### `SyncInstruction` [lines 73-109]
- Object type for a single executable sync instruction: `targetTable`, `targetModel`, `filter`, `update`, `depth`, `chain`, `sourceModel`, `sourceId`; optional array-update fields `isArrayUpdate`, `arrayField`, `identifierField`, `identifierValue`.

### `SyncConfig` [lines 114-141]
- Object type for a sync relationship config: `targetField`, `isMany` flag, `embedKey` method name, `identifierField`, `maxSyncDepth`, `preventCircularSync`, `watchFields` array, `unsetOnDelete` flag, and `targetModelClass` reference (`ChildModel<Model>`).

### `SyncInstructionOptions` [lines 146-158]
- Object type for instruction-building options: `currentDepth`, `syncChain`, `maxDepth`, and `preventCircular`.

### `CollectInstructionsPayload` [lines 163-178]
- Object type carrying data needed to collect sync instructions: `sourceId`, `updatedData` (Model instance or plain `Record<string, unknown>`), `changedFields`, `syncConfigs` (`SyncConfig[]`), and `options` (`SyncInstructionOptions`).

### `EmbedKey` [lines 183-183]
- String union type alias: `"embedData" | "embedParent" | "embedMinimal"` representing the standard embed getter names available on a model.

### `SyncEventPayload` [lines 188-212]
- Object type for sync event data: `sourceModel`, `sourceId`, `targetModel`, `filter`, `update`, `affectedCount`, `depth`, and `chain`.

### `ModelSyncConfig` [lines 223-253]
- Object type for a model sync operation's full configuration: readonly `sourceModel`, `targetModel`, `targetField`, `isMany`; mutable `embedKey` (string or string array), `identifierField`, `maxSyncDepth`, `watchFields`, `unsetOnDelete`, `removeOnDelete`.

### `ModelSyncOperationContract` [lines 268-322]
- Interface defining the fluent API for a sync operation instance.

#### `embed(method: string | string[]): this` [lines 275-275]
- Sets the embed method name or array of field names to call on the source model when building embedded data.

#### `identifyBy(field: string): this` [lines 284-284]
- Sets the identifier field used for array element matching in `syncMany` scenarios; default is `"id"`.

#### `maxDepth(depth: number): this` [lines 292-292]
- Sets the maximum chain depth for cascading sync operations; default is `3`.

#### `watchFields(fields: string[]): this` [lines 301-301]
- Restricts sync triggers to fire only when one of the specified fields changes; empty array means watch all fields.

#### `unsetOnDelete(): this` [lines 308-308]
- Configures the operation to unset the target field when the source document is deleted.

#### `removeOnDelete(): this` [lines 315-315]
- Configures the operation to delete matching target documents when the source document is deleted.

#### `unsubscribe(): void` [lines 321-321]
- Removes all event subscriptions and cleans up the operation; called automatically when using `modelSync.register()`.

### `ModelSyncContract` [lines 337-373]
- Interface defining the modelSync facade API.

#### `sync(source: ChildModel<Model>, target: ChildModel<Model>, field: string): ModelSyncOperationContract` [lines 346-350]
- Creates a sync operation for a single embedded document field on the target model.

#### `syncMany(source: ChildModel<Model>, target: ChildModel<Model>, field: string): ModelSyncOperationContract` [lines 360-364]
- Creates a sync operation targeting an array of embedded documents on the target model.

#### `register(callback: () => void): () => void` [lines 372-372]
- Executes a callback that registers sync operations and returns a scoped cleanup function that unsubscribes all operations created within that callback.
