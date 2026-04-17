# aggregate-expressions
source: expressions/aggregate-expressions.ts
description: Database-agnostic aggregation expression helpers that each driver translates to its native syntax (MongoDB pipeline operators or SQL aggregate functions).
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- *(none)*

## Exports
- `AggregateExpression` — Object type describing an abstract aggregate expression with `__agg` and `__field` fields.  [lines 33-38]
- `AggregateFunction` — Union type of supported aggregate function names.  [lines 43-52]
- `isAggregateExpression` — Type-guard function that checks whether a value is an `AggregateExpression`.  [lines 57-64]
- `$agg` — Const object with factory methods for building database-agnostic aggregate expressions.  [lines 72-260]

## Classes / Functions / Types / Constants

### `AggregateExpression` [lines 33-38]
- Type alias for `{ __agg: AggregateFunction; __field: string | null }`. The `__agg` field names the aggregate function; `__field` is `null` for `count` and a field name string for all others.

### `AggregateFunction` [lines 43-52]
- Union string literal type: `"count" | "sum" | "avg" | "min" | "max" | "first" | "last" | "distinct" | "floor"`.

### `isAggregateExpression(value: unknown): value is AggregateExpression` [lines 57-64]
- Returns `true` when `value` is a non-null object containing a `__field` key and a string `__agg` property.

### `$agg` [lines 72-260]
- Const namespace object. All methods return a plain `AggregateExpression` literal.

#### `count(): AggregateExpression` [lines 89-91]
- Returns `{ __agg: "count", __field: null }`. Translates to `{ $sum: 1 }` in MongoDB and `COUNT(*)` in SQL.

#### `sum(field: string): AggregateExpression` [lines 110-112]
- Returns `{ __agg: "sum", __field: field }`. Translates to `{ $sum: "$field" }` in MongoDB and `SUM(field)` in SQL.

#### `avg(field: string): AggregateExpression` [lines 131-133]
- Returns `{ __agg: "avg", __field: field }`. Translates to `{ $avg: "$field" }` in MongoDB and `AVG(field)` in SQL.

#### `min(field: string): AggregateExpression` [lines 152-154]
- Returns `{ __agg: "min", __field: field }`. Translates to `{ $min: "$field" }` in MongoDB and `MIN(field)` in SQL.

#### `max(field: string): AggregateExpression` [lines 173-175]
- Returns `{ __agg: "max", __field: field }`. Translates to `{ $max: "$field" }` in MongoDB and `MAX(field)` in SQL.

#### `distinct(field: string): AggregateExpression` [lines 194-196]
- Returns `{ __agg: "distinct", __field: field }`. Translates to `{ $distinct: "$field" }` in MongoDB and `DISTINCT(field)` in SQL.

#### `floor(field: string): AggregateExpression` [lines 215-217]
- Returns `{ __agg: "floor", __field: field }`. Translates to `{ $floor: "$field" }` in MongoDB and `FLOOR(field)` in SQL.

#### `first(field: string): AggregateExpression` [lines 236-238]
- Returns `{ __agg: "first", __field: field }`. Translates to `{ $first: "$field" }` in MongoDB and `FIRST_VALUE(field) OVER (...)` in SQL.

#### `last(field: string): AggregateExpression` [lines 257-259]
- Returns `{ __agg: "last", __field: field }`. Translates to `{ $last: "$field" }` in MongoDB and `LAST_VALUE(field) OVER (...)` in SQL.
