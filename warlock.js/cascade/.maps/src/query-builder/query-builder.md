# query-builder
source: query-builder/query-builder.ts
description: Pure, driver-agnostic query builder that records fluent operations into an ordered operations[] array for later parsing by driver subclasses.
complexity: complex
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-opus-4-7
last-updated-by: claude-opus-4-7

## Imports
- `GroupByInput`, `HavingInput`, `JoinOptions`, `OrderDirection`, `RawExpression`, `WhereCallback`, `WhereObject`, `WhereOperator` from `../contracts/query-builder.contract`

## Exports
- `Op` — Type: single recorded query operation with a type discriminator and data payload  [lines 49-52]
- `JoinWithConstraint` — Type: constraint value accepted by `joinWith()` (string shorthand or callback)  [line 64]
- `QueryBuilder<T>` — Class: pure, driver-agnostic query builder recording operations in `operations[]`  [lines 93-1357]

## Classes / Functions / Types / Constants

### `Op` (type) [lines 49-52]
- Discriminated operation record: `{ readonly type: string; readonly data: Record<string, unknown> }`.

### `JoinWithConstraint` (type) [line 64]
- `string | ((q: QueryBuilder) => void)` — either comma-separated columns (`"id,name"`) or a callback receiving a sub-builder.

### `QueryBuilder<T = unknown>` [lines 93-1357]
- Pure, driver-agnostic fluent query builder. All methods push typed entries into `operations[]`. Safe to instantiate directly inside callbacks (nested where groups, `joinWith` constraints, `whereExists`/`whereHas` subqueries). Does NOT hold `table`/alias/driver state — parsers obtain those from the executor.

#### Public fields
- `operations: Op[]` [line 99] — flat, ordered list of recorded operations; public for parser access.
- `pendingGlobalScopes?: Map<string, any>` [line 117] — global scope definitions injected by `Model.query()`.
- `availableLocalScopes?: Map<string, (...args: any[]) => void>` [line 119] — local scope callbacks injected by `Model.query()`.
- `disabledGlobalScopes: Set<string>` [line 121] — names of global scopes intentionally disabled.
- `scopesApplied: boolean` [line 123] — true once the driver subclass has applied pending scopes.
- `eagerLoadRelations: Map<string, boolean | ((query: any) => void)>` [line 130] — relations to eager-load via separate queries.
- `countRelations: string[]` [line 132] — relation names to count alongside results.
- `relationDefinitions?: Record<string, any>` [line 134] — relation definition map injected from the owning Model.
- `modelClass?: any` [line 136] — the Model class reference, required for relation resolution.

#### `getOps(...types: string[]): Op[]` [lines 164-175]
- Returns all recorded operations of specified types in original insertion order. Single-type path is fast; multi-type path merges and sorts by original index.

#### `rebuildIndex(): void` [lines 183-194]
- Rebuilds `opIndex` from scratch. Call after any direct mutation of `this.operations[]` (scope injection, joinWith consumption, clone post-processing).

#### `clone(): this` [lines 219-232]
- Shallow-clones this builder — copies operations, opIndex, and all shared state (scopes, eager loads, count relations, model class). Subclasses must call `super.clone()` and copy their own fields.

#### `withoutGlobalScope(...scopeNames: string[]): this` [lines 239-242]
- Disables one or more named global scopes for this query.

#### `withoutGlobalScopes(): this` [lines 245-248]
- Disables ALL pending global scopes for this query.

#### `scope(scopeName: string, ...args: unknown[]): this` [lines 254-262]
- Applies a registered local scope by name. Throws if no local scopes are available or the named scope is not found.

#### `where(...): this` (4 overloads) [lines 277-296]
- `where(field: string, value: unknown): this`
- `where(field: string, operator: WhereOperator, value: unknown): this`
- `where(conditions: WhereObject): this`
- `where(callback: WhereCallback<T>): this`
- Adds a WHERE clause (AND). Records `where` op; nested callback form records `{ nested: sub.operations }`; object form records one op per key.

#### `orWhere(...): this` (4 overloads) [lines 304-323]
- Same overload shapes as `where`. Records `orWhere` op; nested/object/value/operator branches mirror `where`.

#### `whereRaw(expression: RawExpression, bindings?: unknown[]): this` [lines 332-335]
- Raw WHERE expression in the target dialect (AND). Records `whereRaw` op.

#### `orWhereRaw(expression: RawExpression, bindings?: unknown[]): this` [lines 338-341]
- Raw OR WHERE expression. Records `orWhereRaw` op.

#### `whereColumn(first: string, operator: WhereOperator, second: string): this` [lines 351-354]
- Compare two columns directly (AND). Records `whereColumn` op.

#### `orWhereColumn(first: string, operator: WhereOperator, second: string): this` [lines 357-360]
- Compare two columns directly (OR). Records `orWhereColumn` op.

#### `whereColumns(comparisons: Array<[left, operator, right]>): this` [lines 363-370]
- Compare multiple column pairs in one call. Delegates to `whereColumn` per tuple.

#### `whereBetweenColumns(field: string, lowerColumn: string, upperColumn: string): this` [lines 377-380]
- Field value must fall between two other column values. Records `whereBetween` op with `useColumns: true` so SQL parser quotes values as identifiers.

#### `whereIn(field: string, values: unknown[]): this` [lines 387-390]
- WHERE field IN values. Records `whereIn` op.

#### `whereNotIn(field: string, values: unknown[]): this` [lines 393-396]
- WHERE field NOT IN values. Records `whereNotIn` op.

#### `whereNull(field: string): this` [lines 399-402]
- WHERE field IS NULL. Records `whereNull` op.

#### `whereNotNull(field: string): this` [lines 405-408]
- WHERE field IS NOT NULL. Records `whereNotNull` op.

#### `whereBetween(field: string, range: [unknown, unknown]): this` [lines 411-414]
- WHERE field BETWEEN low AND high. Records `whereBetween` op.

#### `whereNotBetween(field: string, range: [unknown, unknown]): this` [lines 417-420]
- WHERE field NOT BETWEEN low AND high. Records `whereNotBetween` op.

#### `whereLike(field: string, pattern: RegExp | string): this` [lines 430-434]
- LIKE pattern match (AND). RegExp is converted via `.source`. Records `whereLike` op.

#### `whereNotLike(field: string, pattern: RegExp | string): this` [lines 437-441]
- NOT LIKE pattern match. Records `whereNotLike` op.

#### `whereStartsWith(field: string, value: string | number): this` [lines 444-446]
- Starts with a prefix. Delegates to `whereLike` with `${value}%`.

#### `whereNotStartsWith(field: string, value: string | number): this` [lines 449-451]
- Does NOT start with a prefix. Delegates to `whereNotLike` with `${value}%`.

#### `whereEndsWith(field: string, value: string | number): this` [lines 454-456]
- Ends with a suffix. Delegates to `whereLike` with `%${value}`.

#### `whereNotEndsWith(field: string, value: string | number): this` [lines 459-461]
- Does NOT end with a suffix. Delegates to `whereNotLike` with `%${value}`.

#### `whereDate(field: string, value: Date | string): this` [lines 471-474]
- Match on date portion only (time ignored). Records `whereDate` op.

#### `whereDateEquals(field: string, value: Date | string): this` [lines 477-479]
- Alias for `whereDate`.

#### `whereDateBefore(field: string, value: Date | string): this` [lines 482-485]
- Field date is before value. Records `whereDateBefore` op.

#### `whereDateAfter(field: string, value: Date | string): this` [lines 488-491]
- Field date is after value. Records `whereDateAfter` op.

#### `whereDateBetween(field: string, range: [Date|string, Date|string]): this` [lines 494-497]
- Field date is within a range. Records `whereDateBetween` op.

#### `whereDateNotBetween(field: string, range: [Date|string, Date|string]): this` [lines 500-503]
- Field date is NOT within a range. Records `whereNotBetween` op (reuses the general whereNotBetween type).

#### `whereTime(field: string, value: string): this` [lines 510-516]
- Match on the time portion of a datetime field. Emits `whereRaw` with `TIME(${field}) = ?` expression.

#### `whereDay(field: string, value: number): this` [lines 523-529]
- Day-of-month from a date field (1–31). Emits `whereRaw` with `EXTRACT(DAY FROM ${field}) = ?`.

#### `whereMonth(field: string, value: number): this` [lines 532-538]
- Month extracted from a date field (1–12). Emits `whereRaw` with `EXTRACT(MONTH FROM ${field}) = ?`.

#### `whereYear(field: string, value: number): this` [lines 541-547]
- Year extracted from a date field. Emits `whereRaw` with `EXTRACT(YEAR FROM ${field}) = ?`.

#### `whereJsonContains(path: string, value: unknown): this` [lines 557-560]
- JSON/array path contains the given value. Records `whereJsonContains` op.

#### `whereJsonDoesntContain(path: string, value: unknown): this` [lines 563-566]
- JSON/array path does NOT contain the value. Records `whereJsonDoesntContain` op.

#### `whereJsonContainsKey(path: string): this` [lines 572-575]
- JSON path key exists. Emits `whereRaw` with `${path} IS NOT NULL`.

#### `whereJsonLength(path: string, operator: WhereOperator, value: number): this` [lines 581-587]
- Constrain length of a JSON array at a path. Emits `whereRaw` with `jsonb_array_length(${path}) ${operator} ?`.

#### `whereJsonIsArray(path: string): this` [lines 590-596]
- JSON path must resolve to an array. Emits `whereRaw` with `jsonb_typeof(${path}) = 'array'`.

#### `whereJsonIsObject(path: string): this` [lines 599-605]
- JSON path must resolve to an object. Emits `whereRaw` with `jsonb_typeof(${path}) = 'object'`.

#### `whereArrayLength(field: string, operator: WhereOperator, value: number): this` [lines 611-617]
- Constrain number of elements in an array field. Emits `whereRaw` with `array_length(${field}, 1) ${operator} ?`.

#### `whereId(value: string | number): this` [lines 624-626]
- WHERE id = value. Delegates to `where("id", value)`.

#### `whereIds(values: Array<string | number>): this` [lines 629-631]
- WHERE id IN values. Delegates to `whereIn("id", values)`.

#### `whereUuid(value: string): this` [lines 634-636]
- WHERE uuid = value. Delegates to `where("uuid", value)`.

#### `whereUlid(value: string): this` [lines 639-641]
- WHERE ulid = value. Delegates to `where("ulid", value)`.

#### `whereFullText(fields: string | string[], query: string): this` [lines 647-653]
- Full-text search across one or more fields. Records `whereFullText` op.

#### `orWhereFullText(fields: string | string[], query: string): this` [lines 656-658]
- Full-text search (OR). Currently delegates to `whereFullText` (same op type, not a distinct OR-variant).

#### `whereSearch(field: string, query: string): this` [lines 661-663]
- Alias for `whereFullText` with a single field.

#### `textSearch(query: string, filters?: WhereObject): this` [lines 669-674]
- MongoDB-style shorthand: applies only optional equality filters via `where()`; the `query` parameter is accepted but not recorded here (driver subclasses override to emit text-search op).

#### `whereExists(...): this` (2 overloads) [lines 687-698]
- `whereExists(field: string): this`
- `whereExists(callback: WhereCallback<T>): this`
- Callback form records `whereExists` op with `{ subquery: sub.operations }`; string form records `whereNotNull` on the field.

#### `whereNotExists(...): this` (2 overloads) [lines 703-714]
- `whereNotExists(field: string): this`
- `whereNotExists(callback: WhereCallback<T>): this`
- Callback form records `whereNotExists` op with subquery; string form records `whereNull` on the field.

#### `whereSize(field, ...): this` (2 overloads) [lines 723-729]
- `whereSize(field: string, size: number): this`
- `whereSize(field: string, operator: WhereOperator, size: number): this`
- Delegates to `whereArrayLength`.

#### `whereNot(callback: WhereCallback<T>): this` [lines 735-740]
- AND NOT wrapper — negate a nested group. Records `whereNot` op with `{ nested: sub.operations }`.

#### `orWhereNot(callback: WhereCallback<T>): this` [lines 743-748]
- OR NOT wrapper. Records `orWhereNot` op with nested operations.

#### `join(...): this` (2 overloads) [lines 765-774]
- `join(table: string, localField: string, foreignField: string): this`
- `join(options: JoinOptions): this`
- Records `join` op (INNER JOIN).

#### `leftJoin(...): this` (2 overloads) [lines 777-786]
- Same overload shapes as `join`. Records `leftJoin` op.

#### `rightJoin(...): this` (2 overloads) [lines 789-802]
- Same overload shapes as `join`. Records `rightJoin` op.

#### `innerJoin(...): this` (2 overloads) [lines 805-818]
- Same overload shapes as `join`. Records `innerJoin` op (alias for join).

#### `fullJoin(...): this` (2 overloads) [lines 821-830]
- Same overload shapes as `join`. Records `fullJoin` op (FULL OUTER JOIN).

#### `crossJoin(table: string): this` [lines 833-836]
- CROSS JOIN. Records `crossJoin` op.

#### `joinRaw(expression: RawExpression, bindings?: unknown[]): this` [lines 839-842]
- Raw JOIN expression. Driver responsible for handling. Records `joinRaw` op.

#### `joinWith(...args: unknown[]): this` [lines 869-899]
- Eager-load named relations via a single JOIN / $lookup. Constraints are eagerly resolved at call time: callbacks invoked immediately (producing `subOps`), column shorthands parsed into `columns[]`. Accepts strings, arrays of strings, or object form with string column shorthand or callback constraints. Records `joinWith` op with `{ resolved }` map.

#### `with(...args: (string | Record<string, boolean | ((q: any) => void)> | ((q: any) => void))[]): this` [lines 913-935]
- Eager-load relations via separate queries (N+1 avoided by batching). Supports string+callback pairs, string alone, or object map. Populates `eagerLoadRelations`.

#### `withCount(...relations: string[]): this` [lines 938-941]
- Count related models alongside results. Appends to `countRelations`.

#### `has(relation: string, operator?: WhereOperator, count?: number): this` [lines 948-951]
- Filter to rows that have at least one related record. Records `has` op with defaults `operator = ">="`, `count = 1`.

#### `whereHas(relation: string, callback: (q: any) => void): this` [lines 957-962]
- Filter to rows with related records matching a sub-query (AND). Records `whereHas` op with `{ relation, subquery }`.

#### `orWhereHas(relation: string, callback: (q: any) => void): this` [lines 965-970]
- Same as `whereHas` but OR-joined. Records `orWhereHas` op.

#### `doesntHave(relation: string): this` [lines 973-976]
- Filter to rows with NO related records. Records `doesntHave` op.

#### `whereDoesntHave(relation: string, callback: (q: any) => void): this` [lines 979-984]
- Filter to rows with NO related records matching conditions. Records `whereDoesntHave` op.

#### `select(...): this` (3 overloads) [lines 998-1010]
- `select(fields: string[]): this`
- `select(fields: Record<string, 0 | 1 | boolean>): this`
- `select(...fields: Array<string | string[]>): this`
- Records `select` op. Array, object (MongoDB-style projection), and variadic/flat forms supported.

#### `selectAs(field: string, alias: string): this` [lines 1013-1016]
- Select a field under an alias. Records `select` op with `{ fields: { [field]: alias } }`.

#### `selectRaw(expression: RawExpression, bindings?: unknown[]): this` [lines 1022-1025]
- Raw SELECT expression. Records `selectRaw` op.

#### `selectRawMany(definitions: Array<{ alias: string; expression: RawExpression; bindings?: unknown[] }>): this` [lines 1028-1035]
- Multiple raw SELECT expressions in one call. Delegates to `selectRaw` per definition.

#### `selectSub(expression: RawExpression, alias: string): this` [lines 1038-1041]
- Subquery as a named projected field. Records `selectRaw` op with `{ expression: { [alias]: expression } }`.

#### `addSelectSub(expression: RawExpression, alias: string): this` [lines 1044-1046]
- Alias for `selectSub`.

#### `selectAggregate(field: string, aggregate: "sum"|"avg"|"min"|"max"|"count"|"first"|"last", alias: string): this` [lines 1052-1058]
- Aggregate function as a projected field. Delegates to `selectRaw` with `${aggregate.toUpperCase()}(${field})`.

#### `selectExists(field: string, alias: string): this` [lines 1061-1063]
- Existence check as a projected boolean field. Delegates to `selectRaw` with `${field} IS NOT NULL`.

#### `selectCount(field: string, alias: string): this` [lines 1066-1068]
- COUNT as a projected field. Delegates to `selectAggregate(field, "count", alias)`.

#### `selectCase(cases: Array<{ when: RawExpression; then: RawExpression | unknown }>, otherwise: RawExpression | unknown, alias: string): this` [lines 1074-1081]
- CASE / switch expression. Builds `CASE WHEN ... THEN ... ELSE ... END` via `selectRaw`.

#### `selectWhen(condition: RawExpression, thenValue: RawExpression | unknown, elseValue: RawExpression | unknown, alias: string): this` [lines 1084-1093]
- IF/ELSE conditional field. Builds a single-branch CASE expression via `selectRaw`.

#### `selectDriverProjection(_callback: (projection: Record<string, unknown>) => void): this` [lines 1099-1101]
- Driver-native projection manipulation. No-op in base — override in driver subclasses.

#### `selectJson(path: string, alias?: string): this` [lines 1104-1110]
- JSON path extraction as a projected field. Splits path on `->` and emits `column->>'jsonPath'`. Calls `selectAs` when aliased, else `selectRaw`.

#### `selectJsonRaw(_path: string, expression: RawExpression, alias: string): this` [lines 1113-1115]
- JSON extraction via raw expression. Delegates to `selectRaw` with `{ [alias]: expression }`.

#### `deselectJson(path: string): this` [lines 1118-1120]
- Exclude a JSON path from projection. Delegates to `deselect([path])`.

#### `selectConcat(fields: Array<string | RawExpression>, alias: string): this` [lines 1123-1125]
- String concatenation as a projected field via `||`. Delegates to `selectRaw`.

#### `selectCoalesce(fields: Array<string | RawExpression>, alias: string): this` [lines 1128-1130]
- COALESCE (first non-null) as a projected field. Delegates to `selectRaw`.

#### `selectWindow(spec: RawExpression): this` [lines 1133-1136]
- Window function expression. Records `selectRaw` op with `{ expression: spec }`.

#### `deselect(fields: string[]): this` [lines 1139-1142]
- Exclude specific columns from results. Records `deselect` op.

#### `clearSelect(): this` [lines 1148-1154]
- Remove all select operations (resets to wildcard). Filters out ops starting with `select` and `deselect`, then calls `rebuildIndex()`.

#### `selectAll(): this` [lines 1157-1159]
- Alias for `clearSelect`.

#### `selectDefault(): this` [lines 1162-1164]
- Alias for `clearSelect`.

#### `addSelect(fields: string[]): this` [lines 1167-1170]
- Append additional fields to existing selection. Records `select` op with `{ fields, add: true }`.

#### `distinctValues(fields?: string | string[]): this` [lines 1176-1180]
- Record a DISTINCT flag (fluent — does not execute). Records `distinct` op with field list. Subclasses expose a separate async `distinct(field)` execution method.

#### `orderBy(...): this` (2 overloads) [lines 1193-1207]
- `orderBy(field: string, direction?: OrderDirection): this`
- `orderBy(fields: Record<string, OrderDirection>): this`
- Records `orderBy` op(s). String form defaults direction to `"asc"`; object form iterates keys.

#### `orderByDesc(field: string): this` [lines 1210-1212]
- ORDER BY descending shorthand. Delegates to `orderBy(field, "desc")`.

#### `orderByRaw(expression: RawExpression, bindings?: unknown[]): this` [lines 1219-1222]
- Raw ORDER BY expression. Records `orderByRaw` op.

#### `orderByRandom(limit?: number): this` [lines 1228-1232]
- Random order. Records `orderByRaw` op with `"RANDOM()"`, optionally applies `limit`. Maps to MongoDB `$sample` in driver subclasses.

#### `oldest(column = "createdAt"): this` [lines 1235-1237]
- Order ascending by a date column (oldest first). Delegates to `orderBy(column, "asc")`.

#### `limit(value: number): this` [lines 1244-1247]
- Limit number of results. Records `limit` op.

#### `skip(value: number): this` [lines 1250-1253]
- Skip N results (OFFSET). Records `offset` op.

#### `offset(value: number): this` [lines 1256-1258]
- Alias for `skip`.

#### `take(value: number): this` [lines 1261-1263]
- Alias for `limit`.

#### `groupBy(input: GroupByInput): this` [lines 1274-1278]
- GROUP BY clause. Normalizes string/array input to a fields array and records `groupBy` op.

#### `groupByRaw(expression: RawExpression, bindings?: unknown[]): this` [lines 1281-1284]
- Raw GROUP BY expression. Records `groupBy` op with `{ expression, bindings }`.

#### `having(...): this` (3 overloads) [lines 1294-1317]
- `having(field: string, value: unknown): this`
- `having(field: string, operator: WhereOperator, value: unknown): this`
- `having(condition: HavingInput): this`
- Records `having` op(s). Supports tuple-array input, object input, and positional variants.

#### `havingRaw(expression: RawExpression, bindings?: unknown[]): this` [lines 1320-1323]
- Raw HAVING expression. Records `havingRaw` op.

#### `tap(callback: (builder: this) => void): this` [lines 1333-1336]
- Side-effect tap — executes callback synchronously and returns `this`.

#### `when<V>(condition: V | boolean, callback: (builder: this, value: V) => void, otherwise?: (builder: this) => void): this` [lines 1345-1356]
- Conditionally apply query modifications. If `condition` is truthy, invokes `callback`; else invokes optional `otherwise`.
