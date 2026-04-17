# mongodb-query-operations
source: drivers/mongodb/mongodb-query-operations.ts
description: Helper class for appending MongoDB aggregation pipeline operations to a shared list.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `Operation` from `./types`
- `PipelineStage` from `./types`

## Exports
- `MongoQueryOperations` — pipeline operation builder class  [lines 38-289]

## Classes
### MongoQueryOperations  [lines 38-289] — Accumulates pipeline operation descriptors

fields:
- `operations: Operation[]` (private)  [line 55]

methods:
- `constructor(operations: Operation[])`  [line 55] — Stores operations array reference
  - side-effects: retains array reference
- `setOperations(operations: Operation[]): void`  [lines 57-59] — Replaces operations array reference
  - side-effects: mutates internal reference
- `addMatchOperation(type: string, data: Record<string, unknown>, mergeable?: boolean): void`  [lines 84-91] — Pushes a $match stage operation
  - side-effects: appends to operations array
- `addProjectOperation(type: string, data: Record<string, unknown>, mergeable?: boolean): void`  [lines 118-129] — Pushes a $project stage operation
  - side-effects: appends to operations array
- `addSortOperation(type: string, data: Record<string, unknown>, mergeable?: boolean): void`  [lines 156-163] — Pushes a $sort stage operation
  - side-effects: appends to operations array
- `addGroupOperation(type: string, data: Record<string, unknown>, mergeable?: boolean): void`  [lines 190-201] — Pushes a $group stage operation
  - side-effects: appends to operations array
- `addLookupOperation(type: string, data: Record<string, unknown>): void`  [lines 234-241] — Pushes a $lookup stage operation
  - side-effects: appends to operations array
- `addOperation(stage: PipelineStage, type: string, data: Record<string, unknown>, mergeable?: boolean): void`  [lines 276-288] — Pushes a generic stage operation
  - side-effects: appends to operations array
