# expressions

Provides database-agnostic aggregate expression types and the `$agg` factory namespace whose methods produce `AggregateExpression` objects. These objects are passed into query builder methods such as `groupBy` and are subsequently translated by each driver into native aggregate syntax (MongoDB `$sum`/`$avg` pipeline operators or SQL `SUM()`/`AVG()` functions).

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [aggregate-expressions.md](./aggregate-expressions.md) — AggregateExpression type, AggregateFunction union, isAggregateExpression guard, and $agg factory namespace
- [index.md](./index.md) — Barrel re-exporting all expression types and helpers
