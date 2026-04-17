# sync-adapter.contract
source: contracts/sync-adapter.contract.ts
description: Contract for database-specific sync instruction execution
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Exports
- `SyncInstruction` — Type defining a sync operation [lines 5-41]
- `SyncAdapterContract` — Interface for executing sync operations [lines 47-71]

## Types

### `SyncInstruction` [lines 5-41]
- `targetTable: string` — Target table/collection name
- `targetModel: string` — Target model name
- `filter: Record<string, unknown>` — Filter to identify documents
- `update: Record<string, unknown>` — Update operations to apply
- `depth: number` — Current depth in sync chain
- `chain: string[]` — Model names in sync chain
- `sourceModel: string` — Source model name
- `sourceId: string | number` — Source model ID
- `isArrayUpdate?: boolean` — Whether this is an array update
- `arrayField?: string` — Array field path for positional updates
- `identifierField?: string` — Identifier field for array matching
- `identifierValue?: string | number` — Identifier value for array matching

## Interfaces

### `SyncAdapterContract` [lines 47-71]

#### `executeBatch(instructions: SyncInstruction[]): Promise<number>` [lines 54-54]
- Executes batch of sync instructions
- Returns number of documents affected

#### `executeOne(instruction: SyncInstruction): Promise<number>` [lines 62-62]
- Executes single sync instruction
- Returns number of documents affected

#### `executeArrayUpdate(instruction: SyncInstruction): Promise<number>` [lines 70-70]
- Executes array update with positional operators
- Returns number of documents affected
