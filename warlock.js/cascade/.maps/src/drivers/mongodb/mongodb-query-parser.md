# mongodb-query-parser
source: drivers/mongodb/mongodb-query-parser.ts
description: Parses query builder operations into a MongoDB aggregation pipeline, merging compatible stages and post-processing $group output.
complexity: complex
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-opus-4-7
last-updated-by: claude-opus-4-7

## Imports
- `colors` from `@mongez/copper`
- `Collection` (type) from `mongodb`
- `GroupByInput`, `RawExpression`, `WhereOperator` (types) from `../../contracts`
- `isAggregateExpression`, `AggregateExpression` (type) from `../../expressions/aggregate-expressions`
- `MongoQueryBuilder` (type) from `./mongodb-query-builder`
- `Operation`, `PipelineStage` (types) from `./types`

## Exports
- `MongoQueryParserOptions` — Options type for configuring the MongoDB query parser.  [lines 14-21]
- `MongoQueryParser` — Class that parses query builder operations into a MongoDB aggregation pipeline.  [lines 31-1658]

## Classes / Functions / Types / Constants

### `MongoQueryParserOptions` [lines 14-21]
- Type alias with fields: `collection: Collection`, `operations: Operation[]`, `createSubBuilder: () => MongoQueryBuilder`.

### `MongoQueryParser` [lines 31-1658]
- Converts abstract builder operations into a MongoDB aggregation pipeline. Intelligently merges mergeable operations (multiple where clauses, selects, sorts, groups) into single pipeline stages. Tracks group field names for post-processing `_id` renaming and supports pretty-printing the resulting pipeline. All other methods on the class are private implementation details.

#### `constructor(options: MongoQueryParserOptions)` [lines 58-62]
- Stores collection, operations list, and sub-builder factory for later use during parsing.

#### `parse(): any[]` [lines 84-137]
- Walks operations, buffering mergeable ones per stage and flushing them via `buildStage`. Tracks group stage indexes for auto `_id` renaming. Returns the finished pipeline after `postProcessGroupStages` rewrites `_id` to actual group field names and drops the raw `_id`.

#### `toPrettyString(): string` [lines 236-259]
- Runs `parse()` and formats the resulting pipeline as a colored, human-readable multi-stage string for debugging. Returns `"MongoDB Aggregation Pipeline: (empty)"` when the pipeline is empty.
