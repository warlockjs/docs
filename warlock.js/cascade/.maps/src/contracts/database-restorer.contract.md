# database-restorer.contract
source: contracts/database-restorer.contract.ts
description: Defines RestorerContract and supporting types for the full model restoration pipeline.
complexity: medium
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `Model` from `../model/model`

## Exports
- `RestorerContract` — restoration orchestration interface  [lines 23-77]
- `RestorerOptions` — options controlling restore behaviour  [lines 82-110]
- `RestorerResult` — result returned after restore completes  [lines 115-156]

## Types / Interfaces

### `RestorerContract` [lines 23-77]
Orchestrates strategy detection, ID conflict resolution, events, and driver execution.
- `restore(id: string | number, options?: RestorerOptions): Promise<RestorerResult>` [lines 53-56]
  — throws: if strategy is "permanent", record not found, or ID conflict with "fail"; side-effects: emits restoring/restored events
- `restoreAll(options?: RestorerOptions): Promise<RestorerResult>` [line 76]
  — throws: on ID conflict with "fail"; side-effects: emits events for each record

### `RestorerOptions` [lines 82-110]
- `strategy?: "trash" | "soft"` — overrides model/datasource default = undefined
- `onIdConflict?: "fail" | "assignNew"` — behaviour on primary key collision = "assignNew"
- `skipEvents?: boolean` = false

### `RestorerResult` [lines 115-156]
- `success: boolean`
- `restoredCount: number`
- `strategy: "trash" | "soft"`
- `restoredRecord?: Model` — populated for single restore
- `restoredRecords?: Model[]` — populated for restoreAll
- `conflicts?: Array<{ id: string | number; reason: string }>` — ID conflicts during restoreAll
