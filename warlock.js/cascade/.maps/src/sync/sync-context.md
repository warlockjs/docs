# sync-context
source: sync/sync-context.ts
description: Manages sync context creation, depth validation, and cycle detection utilities.
complexity: medium
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `SyncContext`, `SyncInstruction` from `./types`

## Exports
- `DEFAULT_MAX_SYNC_DEPTH` — default max depth constant value 3  [line 13]
- `SyncContextManager` — static utility class for sync context  [lines 18-124]

## Classes / Functions / Types / Constants

### `DEFAULT_MAX_SYNC_DEPTH`
type: `number` — constant `3`  [line 13]

### `class SyncContextManager`  [lines 18-124]
All-static helpers for context creation, validation, chain management.

#### `static createContext(instruction, affectedCount)`
returns: `SyncContext` — new context from instruction and count  [lines 26-41]

#### `static validate(depth, chain, targetModel, maxDepth, preventCircular)`
returns: `{ valid: boolean; error?: string }` — depth and cycle check  [lines 53-77]

#### `static hasCycle(chain, targetModel)`
returns: `boolean` — true if targetModel already in chain  [lines 86-88]

#### `static extendChain(chain, modelName)`
returns: `string[]` — new chain array with appended model name  [lines 97-99]

#### `static formatChain(chain)`
returns: `string` — chain joined with ` → ` separator  [lines 107-109]

#### `static canSyncDeeper(currentDepth, maxDepth)`
returns: `boolean` — true if depth below max  [lines 118-120]
