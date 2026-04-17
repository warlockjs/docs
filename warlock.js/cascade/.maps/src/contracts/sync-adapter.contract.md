# sync-adapter.contract
source: contracts/sync-adapter.contract.ts
description: Defines SyncAdapterContract and SyncInstruction for driver-level bulk denormalization sync execution.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
_(none)_

## Exports
- `SyncInstruction` — descriptor for a single sync update operation  [lines 5-41]
- `SyncAdapterContract` — interface for executing sync batches  [lines 47-71]

## Types / Interfaces

### `SyncInstruction` [lines 5-41]
- `targetTable: string`
- `targetModel: string`
- `filter: Record<string, unknown>`
- `update: Record<string, unknown>`
- `depth: number` — depth in the sync chain
- `chain: string[]` — model names leading to this instruction
- `sourceModel: string`
- `sourceId: string | number`
- `isArrayUpdate?: boolean` — requires positional operator
- `arrayField?: string`
- `identifierField?: string`
- `identifierValue?: string | number`

### `SyncAdapterContract` [lines 47-71]
Driver-specific adapter that executes sync update instructions.
- `executeBatch(instructions: SyncInstruction[]): Promise<number>` [line 54]
  — side-effects: writes updates to target collections; returns affected count
- `executeOne(instruction: SyncInstruction): Promise<number>` [line 62]
  — side-effects: writes single update; returns affected count
- `executeArrayUpdate(instruction: SyncInstruction): Promise<number>` [line 70]
  — side-effects: writes positional array update; returns affected count
