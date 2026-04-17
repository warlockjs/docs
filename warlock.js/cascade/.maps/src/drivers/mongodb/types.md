# types
source: drivers/mongodb/types.ts
description: MongoDB driver-specific type definitions for pipeline stages, operations, and driver options.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `TransactionOptions` from `mongodb`

## Exports
- `PipelineStage` — union of MongoDB aggregation stage name strings  [lines 6-17]
- `Operation` — single query builder chain operation with stage and data  [lines 23-32]
- `MongoDriverOptions` — cascade-next MongoDB driver configuration options  [lines 40-59]

## Classes / Functions / Types / Constants

### type `PipelineStage`  [lines 6-17]
Union of supported MongoDB aggregation stage name literals.

### type `Operation`  [lines 23-32]
- `stage: PipelineStage` — aggregation stage this operation belongs to
- `mergeable: boolean` — whether operation merges with same-stage ops
- `type: string` — operation type for processing logic
- `data: any` — operation payload data

### type `MongoDriverOptions`  [lines 40-59]
- `autoGenerateId?: boolean` — enable numeric auto-increment ID generation
- `counterCollection?: string` — collection name for ID counters
- `transactionOptions?: TransactionOptions` — default transaction options
