# sync-manager
source: sync/sync-manager.ts
description: Manages multi-level sync operations across models with depth limiting, batching, and event emission.
complexity: complex
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-opus-4-7
last-updated-by: claude-opus-4-7

## Imports
- `DriverContract` from `../contracts/database-driver.contract`
- `ChildModel, Model` from `../model/model`
- `DEFAULT_MAX_SYNC_DEPTH, SyncContextManager` from `./sync-context`
- `CollectInstructionsPayload, SyncConfig, SyncEventPayload, SyncInstruction, SyncInstructionOptions, SyncResult` from `./types`

## Exports
- `SyncManager` — Manages sync operations across models with multi-level support.  [lines 22-866]

## Classes / Functions / Types / Constants

### `SyncManager` [lines 22-866]
- Orchestrates cascading sync operations for model updates and deletes across related models.
- Holds a source `ChildModel<Model>` and a `DriverContract` and coordinates instruction collection, batched execution, error handling, and event emission.

#### `constructor(sourceModel: ChildModel<Model>, driver: DriverContract)` [lines 32-35]
- Creates a new sync manager bound to the given source model class and database driver.

#### `syncUpdate(sourceId: string | number, updatedData: Record<string, unknown> | Model, changedFields: string[]): Promise<SyncResult>` [lines 45-101]
- Executes sync operations for a model update. Reads sync configs from the source model; if none, returns an empty result. Otherwise builds initial options (depth 1, `DEFAULT_MAX_SYNC_DEPTH`, prevent-circular on), collects instructions, and executes them. Catches all errors and returns a single-error `SyncResult`.

#### `syncUpdateWithConfig(sourceId: string | number, updatedData: Record<string, unknown> | Model, changedFields: string[], config: SyncConfig): Promise<SyncResult>` [lines 113-166]
- Executes a sync update using a specific provided `SyncConfig` (used by `ModelSyncOperation` for event-based sync). Applies the config's `maxSyncDepth` and `preventCircularSync` flags. Catches and wraps failures.

#### `syncDeleteWithConfig(sourceId: string | number, config: SyncConfig): Promise<SyncResult>` [lines 176-225]
- Executes sync delete operations with a specific config. Returns an empty result when `config.unsetOnDelete` is falsy; otherwise collects delete instructions and executes them. Catches and wraps failures.

#### `syncDelete(sourceId: string | number): Promise<SyncResult>` [lines 233-279]
- Executes sync operations for a model deletion using all source-model sync configs with default depth and prevent-circular settings. Catches and wraps failures in a single-error `SyncResult`.

## Private methods (referenced for completeness)

- `collectInstructions(payload: CollectInstructionsPayload): Promise<SyncInstruction[]>` [lines 287-338] — Recursively collects sync instructions, filtering by watched fields and validating depth/circular state; emits a `syncing` event per instruction and recurses via `collectNextLevelInstructions`.
- `collectDeleteInstructions(sourceId: string | number, syncConfigs: SyncConfig[], options: SyncInstructionOptions): Promise<SyncInstruction[]>` [lines 348-379] — Builds delete instructions per config (skipping configs without `unsetOnDelete`) and emits `syncing` events.
- `collectNextLevelInstructions(parentInstruction, embedData, changedFields, parentConfig, parentOptions): Promise<SyncInstruction[]>` [lines 391-422] — Walks to the next sync level using the target model's own sync configs, extending the chain and tightening `maxDepth`.
- `buildUpdateInstruction(sourceId, config, embedData, options): SyncInstruction` [lines 433-463] — Constructs an update instruction, adding array-update metadata (`isArrayUpdate`, `arrayField`, `identifierField`, `identifierValue`) when `config.isMany`.
- `buildDeleteInstruction(sourceId, config, options): SyncInstruction` [lines 473-492] — Constructs a delete instruction with `{ $unset: { [targetField]: 1 } }` update.
- `buildFilter(sourceId, config): Record<string, unknown>` [lines 501-509] — Builds dotted-path filter `"<targetField>.<identifierField>": sourceId` (same shape for many and single).
- `buildUpdate(embedData, config): Record<string, unknown>` [lines 518-529] — Builds `$set` payload: positional `targetField.$` for arrays, direct `targetField` for singletons.
- `executeInstructions(instructions): Promise<SyncResult>` [lines 538-578] — Groups by depth then by table; attempts batch execution per group and falls back to individual execution on batch failure. Tracks `depthReached` and sets `success` from `failed === 0`.
- `executeBatch(instructions, result): Promise<void>` [lines 586-604] — Runs instructions via `driver.updateMany`, creates sync contexts, increments `succeeded`, and emits `synced` events; re-throws errors for fallback.
- `executeIndividual(instructions, result): Promise<void>` [lines 613-659] — Fallback path: per-instruction `updateMany` with per-error capture (formatted message, preserved stack) and detailed `console.error` logging.
- `formatSyncError(instruction, error): string` [lines 668-679] — Formats a multi-part error message including depth, chain, source and target identifiers.
- `groupByDepth(instructions): Map<number, SyncInstruction[]>` [lines 687-700] — Groups by `depth` and returns a map sorted ascending by depth.
- `groupByTable(instructions): Map<string, SyncInstruction[]>` [lines 708-720] — Groups instructions by `targetTable`.
- `shouldSync(config, changedFields): boolean` [lines 729-735] — Returns true when `watchFields` is empty, else whether any watched field is in `changedFields`.
- `getEmbedData(data, config): Promise<Record<string, unknown>>` [lines 744-767] — Extracts embed payload from a `Model` (supports array `embedKey` via `only(...)`, property lookup, `embedData` fallback, or raw `data`); passes plain data through unchanged.
- `getSyncConfigs(): SyncConfig[]` [lines 774-784] — Reads `syncWith` from the source model and calls `.build()` on builder-like entries.
- `getSyncConfigsForModel(modelClass: ChildModel<Model>): SyncConfig[]` [lines 792-802] — Same as above but for an arbitrary model class (used for next-level traversal).
- `emitSyncingEvent(instruction): Promise<void>` [lines 809-825] — Emits a `syncing` event on the source model (via `emitSyncEvent` if present) with `affectedCount: 0`.
- `emitSyncedEvent(context): Promise<void>` [lines 832-848] — Emits a `synced` event on the source model using fields from the sync context (including `affectedCount`).
- `createEmptyResult(): SyncResult` [lines 855-865] — Returns a zeroed, successful sync result.
