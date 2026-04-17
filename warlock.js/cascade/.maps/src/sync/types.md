# types
source: sync/types.ts
description: Core TypeScript types and contracts for the entire cascade sync system.
complexity: medium
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `ChildModel`, `Model` from `../model/model`

## Exports
- `SyncContext` — operation context tracking source, target, chain  [lines 13-40]
- `SyncResult` — outcome of a sync with counts and errors  [lines 46-67]
- `SyncInstruction` — single executable sync update descriptor  [lines 73-109]
- `SyncConfig` — one sync relationship configuration  [lines 114-141]
- `SyncInstructionOptions` — depth, chain, and limit options  [lines 146-158]
- `CollectInstructionsPayload` — input for instruction collection  [lines 163-178]
- `EmbedKey` — union of standard embed property names  [line 183]
- `SyncEventPayload` — event data emitted during sync  [lines 188-212]
- `ModelSyncConfig` — all settings for one model sync operation  [lines 223-253]
- `ModelSyncOperationContract` — fluent API for sync operations  [lines 268-322]
- `ModelSyncContract` — facade contract for sync registration  [lines 337-373]

## Classes / Functions / Types / Constants

### `SyncContext` — type  [lines 13-40]
### `SyncResult` — type  [lines 46-67]
### `SyncInstruction` — type  [lines 73-109]
### `SyncConfig` — type  [lines 114-141]
### `SyncInstructionOptions` — type  [lines 146-158]
### `CollectInstructionsPayload` — type  [lines 163-178]
### `EmbedKey` — type alias `"embedData" | "embedParent" | "embedMinimal"`  [line 183]
### `SyncEventPayload` — type  [lines 188-212]
### `ModelSyncConfig` — type  [lines 223-253]
### `ModelSyncOperationContract` — interface  [lines 268-322]
### `ModelSyncContract` — interface  [lines 337-373]
