# database-writer.contract
source: contracts/database-writer.contract.ts
description: Contract for persisting model data to database with validation and events
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `UpdateOperations` from `./database-driver.contract`

## Exports
- `WriterContract` — Interface for saving models [lines 24-55]
- `WriterOptions` — Configuration for save operation [lines 61-92]
- `WriterResult` — Result of save operation [lines 97-121]
- `BuildUpdateOperationsResult` — Type for update operations builder [lines 128-128]

## Types

### `WriterOptions` [lines 61-92]
- `skipValidation?: boolean` — Skip validation and casting (default: false)
- `skipEvents?: boolean` — Skip lifecycle event emission (default: false)
- `skipSync?: boolean` — Skip sync operations after save (default: false)
- `replace?: boolean` — Replace entire document vs update changes (default: false)

### `WriterResult` [lines 97-121]
- `success: boolean` — Whether save operation succeeded
- `document: Record<string, unknown>` — Saved document with database-generated fields
- `isNew: boolean` — Whether this was an insert operation
- `modifiedCount?: number` — Number of records modified (updates only)

## Interfaces

### `WriterContract` [lines 24-55]

#### `save(options?: WriterOptions): Promise<WriterResult>` [lines 55-55]
- Saves model instance to database (insert if new, update if existing)
- Performs validation, ID generation, event emission, and driver execution
- Returns result with success status and saved document
- Throws ValidationError or database errors
