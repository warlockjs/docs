# sync-context
source: sync/sync-context.ts
description: Sync context management with validation and cycle detection
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `SyncContext, SyncInstruction` from `./types`

## Exports
- `DEFAULT_MAX_SYNC_DEPTH` — Default maximum sync depth constant [lines 13-13]
- `SyncContextManager` — Class for sync context management [lines 18-124]

## Constants

### `DEFAULT_MAX_SYNC_DEPTH` [lines 13-13]
- Value: 3
- Prevents infinite sync chains

## Classes

### `SyncContextManager` [lines 18-124]

#### `static createContext(instruction: SyncInstruction, affectedCount: number): SyncContext` [lines 26-41]
- Creates new sync context from sync instruction
- Includes source model, source ID, current depth
- Copies sync chain and filter/update objects
- Records affected document count and timestamp

#### `static validate(depth: number, chain: string[], targetModel: string, maxDepth: number, preventCircular: boolean): { valid: boolean; error?: string }` [lines 53-77]
- Validates sync operation based on depth and cycles
- Checks if depth exceeds maximum
- Optionally detects circular references
- Returns validation result with error message if invalid

#### `static hasCycle(chain: string[], targetModel: string): boolean` [lines 86-88]
- Checks if adding target model creates cycle
- Returns true if model already exists in chain

#### `static extendChain(chain: string[], modelName: string): string[]` [lines 97-99]
- Creates new sync chain by appending model name
- Returns new array without mutating original

#### `static formatChain(chain: string[]): string` [lines 107-109]
- Formats sync chain for display
- Format: "Model1 → Model2 → Model3"

#### `static canSyncDeeper(currentDepth: number, maxDepth: number): boolean` [lines 118-123]
- Checks if current depth allows further syncing
- Returns true if currentDepth < maxDepth
