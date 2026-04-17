# mongodb-query-parser
source: drivers/mongodb/mongodb-query-parser.ts
description: Parses abstract query builder operations into a MongoDB aggregation pipeline.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `colors` from `@mongez/copper`
- `Collection` from `mongodb`
- `GroupByInput`, `RawExpression`, `WhereOperator` from `../../contracts`
- `isAggregateExpression`, `AggregateExpression` from `../../expressions/aggregate-expressions`
- `MongoQueryBuilder` from `./mongodb-query-builder`
- `Operation`, `PipelineStage` from `./types`

## Exports
- `MongoQueryParserOptions` — parser configuration type  [lines 14-21]
- `MongoQueryParser` — pipeline parser class  [lines 31-1658]

## Types
- `MongoQueryParserOptions`  [lines 14-21] — Parser configuration options shape

## Classes
### MongoQueryParser  [lines 31-1658] — Builds aggregation pipeline from operations

fields:
- `readonly collection: Collection` (private)  [line 35]
- `readonly operations: Operation[]` (private)  [line 40]
- `readonly createSubBuilder: () => MongoQueryBuilder` (private)  [line 45]
- `readonly groupFieldNames: Map<number, string | string[]>` (private)  [line 51]

methods:
- `constructor(options: MongoQueryParserOptions)`  [lines 58-62] — Initializes parser state
- `parse(): any[]`  [lines 84-137] — Builds full aggregation pipeline
  - side-effects: populates groupFieldNames map
- `toPrettyString(): string`  [lines 236-259] — Formats pipeline as debug string
  - side-effects: calls parse()
  - throws: `Error` — when invalid date in pipeline
