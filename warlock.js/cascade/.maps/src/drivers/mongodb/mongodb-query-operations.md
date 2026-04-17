# mongodb-query-operations
source: drivers/mongodb/mongodb-query-operations.ts
description: Helper class for constructing MongoDB aggregation pipeline operation objects used by the query parser.
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- `Operation` from `./types`
- `PipelineStage` from `./types`

## Exports
- `MongoQueryOperations` — Class that builds and accumulates `Operation` entries into a shared array representing the aggregation pipeline.  [lines 38-289]

## Classes / Functions / Types / Constants

### `MongoQueryOperations` [lines 38-289]
- Internal helper used by the MongoDB query builder to append typed `Operation` objects to a shared mutable array. Each method maps to a specific MongoDB aggregation stage. The class holds a reference to the array so mutations are reflected in the caller.

#### `constructor(operations: Operation[]): MongoQueryOperations` [lines 55-55]
- Accepts a reference to the operations array that will be mutated by all subsequent method calls.

#### `setOperations(operations: Operation[]): void` [lines 57-59]
- Replaces the internal operations array reference with a new one. Allows reusing the helper instance across different pipeline contexts.

#### `addMatchOperation(type: string, data: Record<string, unknown>, mergeable = true): void` [lines 84-91]
- Pushes a `{ stage: "$match", mergeable, type, data }` entry. Used for WHERE-style filters (e.g., `"where"`, `"whereIn"`, `"having"`). `mergeable` defaults to `true`; pass `false` for post-group having clauses.

#### `addProjectOperation(type: string, data: Record<string, unknown>, mergeable = true): void` [lines 118-129]
- Pushes a `{ stage: "$project", mergeable, type, data }` entry. Used for field selection/exclusion and computed fields (e.g., `"select"`, `"deselect"`, `"selectRaw"`).

#### `addSortOperation(type: string, data: Record<string, unknown>, mergeable = true): void` [lines 156-163]
- Pushes a `{ stage: "$sort", mergeable, type, data }` entry. Used for ordering (e.g., `"orderBy"`, `"orderByRaw"`, `"orderByRandom"`). Random ordering should pass `mergeable = false`.

#### `addGroupOperation(type: string, data: Record<string, unknown>, mergeable = false): void` [lines 190-201]
- Pushes a `{ stage: "$group", mergeable, type, data }` entry. Used for GROUP BY and DISTINCT operations. Defaults `mergeable` to `false` because group stages are aggregation boundaries.

#### `addLookupOperation(type: string, data: Record<string, unknown>): void` [lines 234-241]
- Pushes a `{ stage: "$lookup", mergeable: false, type, data }` entry. Always non-mergeable. Used for JOIN-style operations. No `mergeable` parameter — hardcoded to `false`.

#### `addOperation(stage: PipelineStage, type: string, data: Record<string, unknown>, mergeable = false): void` [lines 276-288]
- Generic escape hatch that pushes any `PipelineStage` (e.g., `"$limit"`, `"$skip"`, `"$unwind"`, `"$setWindowFields"`). Defaults `mergeable` to `false`.
