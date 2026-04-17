# Query Builder
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> Driver-agnostic fluent query builder that records all operations as an ordered list for later consumption by a database-specific parser.

## What lives here
- `query-builder.ts` — defines `QueryBuilder`, `Op`, and `JoinWithConstraint`; the single source of all fluent query-building logic

## Public API
- `Op` — recorded operation shape `{ readonly type, readonly data }`
- `JoinWithConstraint` — union type `string | ((q: QueryBuilder) => void)` for joinWith args
- `QueryBuilder<T>` — main fluent builder class; accumulates ops
- `QueryBuilder.clone(): this` — shallow clone with full state copy
- `QueryBuilder.getOps(...types: string[]): Op[]` — retrieve ops by type in order
- `QueryBuilder.rebuildIndex(): void` — rebuild internal opIndex after mutation
- `QueryBuilder.where(...): this` — add AND where clause (overloaded)
- `QueryBuilder.orWhere(...): this` — add OR where clause (overloaded)
- `QueryBuilder.select(...): this` — specify columns (overloaded)
- `QueryBuilder.join(...): this` — INNER JOIN (overloaded)
- `QueryBuilder.leftJoin(...): this` — LEFT JOIN
- `QueryBuilder.rightJoin(...): this` — RIGHT JOIN
- `QueryBuilder.innerJoin(...): this` — explicit INNER JOIN
- `QueryBuilder.fullJoin(...): this` — FULL JOIN
- `QueryBuilder.crossJoin(table): this` — CROSS JOIN
- `QueryBuilder.joinRaw(expression, bindings?): this` — raw JOIN expression
- `QueryBuilder.joinWith(...args): this` — eager-load relations via JOIN
- `QueryBuilder.with(...args): this` — eager-load via separate queries
- `QueryBuilder.withCount(...relations): this` — count eager relations
- `QueryBuilder.has(relation, operator?, count?): this` — relation existence constraint
- `QueryBuilder.whereHas(relation, callback): this` — constrained relation existence
- `QueryBuilder.orWhereHas(relation, callback): this` — OR constrained relation existence
- `QueryBuilder.doesntHave(relation): this` — relation absence constraint
- `QueryBuilder.whereDoesntHave(relation, callback): this` — constrained relation absence
- `QueryBuilder.orderBy(...): this` — order by column (overloaded)
- `QueryBuilder.orderByDesc(field): this` — descending order
- `QueryBuilder.orderByRaw(expression, bindings?): this` — raw ORDER BY
- `QueryBuilder.orderByRandom(limit?): this` — random order with optional limit
- `QueryBuilder.oldest(column?): this` — order ascending by column
- `QueryBuilder.limit(value): this` — max rows to return
- `QueryBuilder.skip(value): this` — rows to skip
- `QueryBuilder.offset(value): this` — alias for skip
- `QueryBuilder.take(value): this` — alias for limit
- `QueryBuilder.groupBy(input): this` — GROUP BY clause
- `QueryBuilder.groupByRaw(expression, bindings?): this` — raw GROUP BY
- `QueryBuilder.having(...): this` — post-group filter (overloaded)
- `QueryBuilder.havingRaw(expression, bindings?): this` — raw HAVING expression
- `QueryBuilder.whereRaw(expression, bindings?): this` — raw AND where expression
- `QueryBuilder.orWhereRaw(expression, bindings?): this` — raw OR where expression
- `QueryBuilder.whereColumn(first, operator, second): this` — AND column comparison
- `QueryBuilder.orWhereColumn(first, operator, second): this` — OR column comparison
- `QueryBuilder.whereColumns(comparisons): this` — multiple column comparisons
- `QueryBuilder.whereBetweenColumns(field, lowerColumn, upperColumn): this` — between two columns
- `QueryBuilder.whereIn(field, values): this` — field value in list
- `QueryBuilder.whereNotIn(field, values): this` — field value not in list
- `QueryBuilder.whereNull(field): this` — field is NULL
- `QueryBuilder.whereNotNull(field): this` — field is not NULL
- `QueryBuilder.whereBetween(field, range): this` — field within range
- `QueryBuilder.whereNotBetween(field, range): this` — field outside range
- `QueryBuilder.whereLike(field, pattern): this` — LIKE pattern match
- `QueryBuilder.whereNotLike(field, pattern): this` — NOT LIKE pattern match
- `QueryBuilder.whereStartsWith(field, value): this` — starts with prefix
- `QueryBuilder.whereNotStartsWith(field, value): this` — does not start with prefix
- `QueryBuilder.whereEndsWith(field, value): this` — ends with suffix
- `QueryBuilder.whereNotEndsWith(field, value): this` — does not end with suffix
- `QueryBuilder.whereDate(field, value): this` — date part condition
- `QueryBuilder.whereDateEquals(field, value): this` — date equals
- `QueryBuilder.whereDateBefore(field, value): this` — date before value
- `QueryBuilder.whereDateAfter(field, value): this` — date after value
- `QueryBuilder.whereDateBetween(field, range): this` — date within range
- `QueryBuilder.whereDateNotBetween(field, range): this` — date outside range
- `QueryBuilder.whereTime(field, value): this` — time part condition
- `QueryBuilder.whereDay(field, value): this` — day-of-month condition
- `QueryBuilder.whereMonth(field, value): this` — month condition
- `QueryBuilder.whereYear(field, value): this` — year condition
- `QueryBuilder.whereJsonContains(path, value): this` — JSON path contains value
- `QueryBuilder.whereJsonDoesntContain(path, value): this` — JSON path does not contain value
- `QueryBuilder.whereJsonContainsKey(path): this` — JSON path key exists
- `QueryBuilder.whereJsonLength(path, operator, value): this` — JSON array length condition
- `QueryBuilder.whereJsonIsArray(path): this` — JSON value is array
- `QueryBuilder.whereJsonIsObject(path): this` — JSON value is object
- `QueryBuilder.whereArrayLength(field, operator, value): this` — array field length condition
- `QueryBuilder.whereId(value): this` — shorthand primary key match
- `QueryBuilder.whereIds(values): this` — shorthand primary key IN list
- `QueryBuilder.whereUuid(value): this` — match by UUID field
- `QueryBuilder.whereUlid(value): this` — match by ULID field
- `QueryBuilder.whereFullText(fields, query): this` — full-text AND search
- `QueryBuilder.orWhereFullText(fields, query): this` — full-text OR search
- `QueryBuilder.whereSearch(field, query): this` — single-field search
- `QueryBuilder.textSearch(query, filters?): this` — multi-field text search
- `QueryBuilder.whereExists(...): this` — subquery exists or not-null
- `QueryBuilder.whereNotExists(...): this` — subquery not-exists or is-null
- `QueryBuilder.whereSize(field, ...): this` — array size constraint (overloaded)
- `QueryBuilder.whereNot(callback): this` — AND negated group
- `QueryBuilder.orWhereNot(callback): this` — OR negated group
- `QueryBuilder.selectAs(field, alias): this` — column with alias
- `QueryBuilder.selectRaw(expression, bindings?): this` — raw SELECT expression
- `QueryBuilder.selectRawMany(definitions): this` — multiple raw SELECT expressions
- `QueryBuilder.selectSub(expression, alias): this` — subquery as column
- `QueryBuilder.addSelectSub(expression, alias): this` — append subquery column
- `QueryBuilder.selectAggregate(field, aggregate, alias): this` — aggregate function column
- `QueryBuilder.selectExists(field, alias): this` — EXISTS subquery column
- `QueryBuilder.selectCount(field, alias): this` — COUNT aggregate column
- `QueryBuilder.selectCase(cases, otherwise, alias): this` — CASE expression column
- `QueryBuilder.selectWhen(condition, thenValue, elseValue, alias): this` — inline WHEN/THEN column
- `QueryBuilder.selectDriverProjection(_callback): this` — no-op base, driver-overridable
- `QueryBuilder.selectJson(path, alias?): this` — JSON path as column
- `QueryBuilder.selectJsonRaw(_path, expression, alias): this` — raw JSON expression column
- `QueryBuilder.deselectJson(path): this` — remove JSON path column
- `QueryBuilder.selectConcat(fields, alias): this` — concatenated column
- `QueryBuilder.selectCoalesce(fields, alias): this` — COALESCE column
- `QueryBuilder.selectWindow(spec): this` — window function column
- `QueryBuilder.deselect(fields): this` — exclude specific columns
- `QueryBuilder.clearSelect(): this` — remove all select operations
- `QueryBuilder.selectAll(): this` — select all columns (*)
- `QueryBuilder.selectDefault(): this` — restore default selection
- `QueryBuilder.addSelect(fields): this` — append additional columns
- `QueryBuilder.distinctValues(fields?): this` — DISTINCT on columns
- `QueryBuilder.withoutGlobalScope(...scopeNames): this` — disable named global scopes
- `QueryBuilder.withoutGlobalScopes(): this` — disable all pending global scopes
- `QueryBuilder.scope(scopeName, ...args): this` — apply registered local scope
- `QueryBuilder.tap(callback): this` — inspect/modify builder inline
- `QueryBuilder.when(condition, callback, otherwise?): this` — conditional builder modification

## How it fits together
`QueryBuilder` is a pure operation recorder with no database dependency; it imports only contract types (`GroupByInput`, `HavingInput`, `JoinOptions`, `OrderDirection`, `RawExpression`, `WhereCallback`, `WhereObject`, `WhereOperator`) from `../contracts/query-builder.contract`. Database drivers (SQL, MongoDB, etc.) extend or wrap `QueryBuilder`, read its `operations: Op[]` array via `getOps()`, and translate the recorded ops into driver-specific queries. The builder itself never executes anything — execution is entirely the responsibility of the consuming driver layer.

## Working examples
```typescript
import { QueryBuilder } from "./query-builder";

// Basic select with conditions
const qb = new QueryBuilder()
  .select("id", "name", "email")
  .where("status", "=", "active")
  .whereNotNull("email")
  .orderBy("name", "asc")
  .limit(20)
  .skip(0);

// Retrieve recorded ops for a driver to consume
const whereOps = qb.getOps("where");
const selectOps = qb.getOps("select");

// Conditional query building
const query = new QueryBuilder()
  .select("id", "title")
  .when(true, q => q.where("published", "=", true))
  .orderByDesc("created_at")
  .limit(10);

// Cloning and scopes
const base = new QueryBuilder().where("tenant_id", "=", 42);
const extended = base.clone().whereNull("deleted_at").orderBy("id");

// JSON field conditions
const jsonQuery = new QueryBuilder()
  .whereJsonContains("meta->tags", "featured")
  .whereJsonLength("meta->images", ">", 0)
  .selectJson("meta->title", "meta_title");

// Eager loading and relation constraints
const relQuery = new QueryBuilder()
  .with("posts", "comments")
  .withCount("likes")
  .whereHas("posts", q => q.where("published", "=", true));

// Tap for inline inspection
new QueryBuilder()
  .select("id")
  .where("active", "=", 1)
  .tap(q => {
    const ops = q.getOps("where");
    console.log("where ops so far:", ops.length);
  })
  .limit(5);
```

## DO NOT
- Do NOT execute queries directly from `QueryBuilder` — it records ops only; pass them to a driver layer via `getOps()` for actual execution.
- Do NOT mutate `operations` directly — always use `addOperation` (internal) or provided builder methods; direct mutation breaks `opIndex` and requires `rebuildIndex()`.
- Do NOT call `scope()` before registering local scopes on `availableLocalScopes` — it throws an `Error` when no local scopes exist or the named scope is not found.
- Do NOT assume `selectDriverProjection()` does anything in the base class — it is a no-op placeholder meant to be overridden by driver-specific subclasses.
- Do NOT share a single `QueryBuilder` instance across concurrent requests — use `clone()` to create independent copies from a base template.
