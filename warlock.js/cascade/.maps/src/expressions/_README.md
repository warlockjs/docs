# expressions
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> Provides database-agnostic aggregate expression types and builder helpers that drivers translate to native SQL or MongoDB syntax.

## What lives here
- `aggregate-expressions.ts` — `AggregateExpression` type, `AggregateFunction` union, `isAggregateExpression` guard, and the `$agg` factory namespace
- `index.ts` — re-exports everything from `aggregate-expressions.ts`

## Public API
- `AggregateExpression` — `{ __agg: AggregateFunction; __field: string | null }` object shape
- `AggregateFunction` — union of 9 aggregate function name strings: `"count" | "sum" | "avg" | "min" | "max" | "first" | "last" | "distinct" | "floor"`
- `isAggregateExpression(value: unknown): value is AggregateExpression` — type-guard for AggregateExpression values
- `$agg.count(): AggregateExpression` — count expression; no field required
- `$agg.sum(field: string): AggregateExpression` — sum expression for given field
- `$agg.avg(field: string): AggregateExpression` — average expression for given field
- `$agg.min(field: string): AggregateExpression` — minimum expression for given field
- `$agg.max(field: string): AggregateExpression` — maximum expression for given field
- `$agg.distinct(field: string): AggregateExpression` — distinct expression for given field
- `$agg.floor(field: string): AggregateExpression` — floor expression for given field
- `$agg.first(field: string): AggregateExpression` — first-value expression for given field
- `$agg.last(field: string): AggregateExpression` — last-value expression for given field

## How it fits together
This folder has no internal dependencies — `aggregate-expressions.ts` imports nothing. The `$agg` factories produce plain `AggregateExpression` objects that are passed into query builder methods such as `groupBy`. Database drivers downstream receive these objects and translate `__agg` and `__field` into their native aggregate syntax (e.g. `{ $sum: "$field" }` for MongoDB or `SUM(field)` for SQL). `isAggregateExpression` is used by drivers and the query builder to detect whether a value is an aggregate expression at runtime before translation.

## Working examples
```typescript
import {
  $agg,
  AggregateExpression,
  AggregateFunction,
  isAggregateExpression,
} from "./aggregate-expressions";

// Build expressions
const countExpr: AggregateExpression = $agg.count();
const totalExpr: AggregateExpression = $agg.sum("duration");
const avgExpr: AggregateExpression = $agg.avg("rating");
const minExpr: AggregateExpression = $agg.min("price");
const maxExpr: AggregateExpression = $agg.max("price");
const distinctExpr: AggregateExpression = $agg.distinct("category");
const floorExpr: AggregateExpression = $agg.floor("score");
const firstExpr: AggregateExpression = $agg.first("name");
const lastExpr: AggregateExpression = $agg.last("name");

// Type guard usage in a driver adapter
function translateExpression(value: unknown): string {
  if (isAggregateExpression(value)) {
    const fn: AggregateFunction = value.__agg;
    const field = value.__field ?? "*";
    return `${fn.toUpperCase()}(${field})`;
  }
  return String(value);
}

// Use in a groupBy query (illustrative)
const aggregations: Record<string, AggregateExpression> = {
  count: $agg.count(),
  total: $agg.sum("duration"),
  avg: $agg.avg("rating"),
};
```

## DO NOT
- Do NOT construct `AggregateExpression` objects manually with raw `{ __agg, __field }` literals — use the `$agg` factory methods to ensure valid `AggregateFunction` values.
- Do NOT use `__agg` or `__field` properties directly in application logic — they are internal driver-translation fields; treat `AggregateExpression` as opaque outside drivers.
- Do NOT pass an `AggregateExpression` where a plain field name string is expected — use `isAggregateExpression` to distinguish at runtime before routing to the correct translation path.
- Do NOT extend `AggregateFunction` by widening the union locally — adding unsupported strings will produce expressions no driver knows how to translate, causing silent failures or runtime errors.
