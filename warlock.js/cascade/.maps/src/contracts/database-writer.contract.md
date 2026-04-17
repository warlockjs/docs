# database-writer.contract
source: contracts/database-writer.contract.ts
description: Defines WriterContract and supporting types for the full model save pipeline.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `UpdateOperations` from `./database-driver.contract`

## Exports
- `WriterContract` — save orchestration interface  [lines 24-56]
- `WriterOptions` — options controlling save behaviour  [lines 61-92]
- `WriterResult` — result returned after save completes  [lines 97-121]
- `BuildUpdateOperationsResult` — internal alias for UpdateOperations  [line 128]

## Types / Interfaces

### `WriterContract` [lines 24-56]
Orchestrates validation, ID generation, events, and driver insert/update.
- `save(options?: WriterOptions): Promise<WriterResult>` [line 55]
  — throws: ValidationError on invalid data, Error on driver failure; side-effects: emits validating/saving/created/updated/saved events

### `WriterOptions` [lines 61-92]
- `skipValidation?: boolean` = false
- `skipEvents?: boolean` = false
- `skipSync?: boolean` = false
- `replace?: boolean` — replace full document instead of patching = false

### `WriterResult` [lines 97-121]
- `success: boolean`
- `document: Record<string, unknown>` — saved document with all generated fields
- `isNew: boolean` — true if insert, false if update
- `modifiedCount?: number` — undefined for inserts
