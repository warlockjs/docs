# types

source: drivers/mongodb/types.ts
description: Type definitions for MongoDB pipeline stages, operations, and driver configuration
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `TransactionOptions` from `mongodb` (type)

## Exports
- `PipelineStage` — Union type for MongoDB aggregation pipeline stage names [lines 6-17]
- `Operation` — Type for representing query builder chain operations [lines 23-32]
- `MongoDriverOptions` — Type for MongoDB driver-specific cascade configuration [lines 40-59]

## Classes / Functions / Types / Constants

### `PipelineStage` [lines 6-17]
- Union type of MongoDB aggregation pipeline stage names: $match, $project, $sort, $group, $lookup, $limit, $skip, $unwind, $addFields, $setWindowFields, $vectorSearch

### `Operation` [lines 23-32]
- Object type representing a single operation in the query builder chain with properties: stage (PipelineStage), mergeable (boolean), type (string), data (any)

### `MongoDriverOptions` [lines 40-59]
- Configuration object for cascade-next MongoDB driver with optional properties:
  - `autoGenerateId?: boolean` — Enable auto-generation of numeric IDs (default: false)
  - `counterCollection?: string` — Counter collection name for auto-generated IDs (default: "counters")
  - `transactionOptions?: TransactionOptions` — Transaction options applied to all transactions unless overridden
