# aggregate-expressions
source: expressions/aggregate-expressions.ts
description: Provides database-agnostic aggregate expression types and builder helpers that drivers translate to native SQL or MongoDB syntax.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
_(none)_

## Exports
- `AggregateExpression` — abstract aggregate expression object type  [lines 33-38]
- `AggregateFunction` — union of supported aggregate function names  [lines 43-52]
- `isAggregateExpression` — type-guard for AggregateExpression values  [lines 57-64]
- `$agg` — object of aggregate expression factory methods  [lines 72-260]

## Classes / Functions / Types / Constants

### `AggregateExpression`
Object shape holding `__agg` function name and `__field` target.  [lines 33-38]

### `AggregateFunction`
Union of 8 aggregate function name strings.  [lines 43-52]

### `isAggregateExpression(value)`
Type-guard: returns true if value is an AggregateExpression.  [lines 57-64]

### `$agg`
Namespace object with factory methods returning AggregateExpression.  [lines 72-260]
- `$agg.count()` — count expression; no field  [lines 89-91]
- `$agg.sum(field)` — sum expression for given field  [lines 110-112]
- `$agg.avg(field)` — average expression for given field  [lines 131-133]
- `$agg.min(field)` — minimum expression for given field  [lines 152-154]
- `$agg.max(field)` — maximum expression for given field  [lines 173-175]
- `$agg.distinct(field)` — distinct expression for given field  [lines 194-196]
- `$agg.floor(field)` — floor expression for given field  [lines 215-217]
- `$agg.first(field)` — first-value expression for given field  [lines 236-238]
- `$agg.last(field)` — last-value expression for given field  [lines 257-259]
