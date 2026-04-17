# mongodb-query-builder
source: drivers/mongodb/mongodb-query-builder.ts
description: MongoDB-specific query builder implementation that compiles fluent operations into aggregation pipelines
complexity: complex
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-opus-4-7
last-updated-by: claude-opus-4-7

## Imports
- `GenericObject, get` from `@mongez/reinforcements`
- type `AggregateOptions, ClientSession, Collection` from `mongodb`
- `databaseTransactionContext` from `../../context/database-transaction-context`
- type `CursorPaginationOptions, CursorPaginationResult, DriverQuery, GroupByInput, HavingInput, JoinOptions, OrderDirection, PaginationOptions, PaginationResult, QueryBuilderContract, RawExpression, WhereCallback, WhereObject, WhereOperator` from `../../contracts`
- type `DataSource` from `../../data-source/data-source`
- `dataSourceRegistry` from `../../data-source/data-source-registry`
- `QueryBuilder` from `../../query-builder/query-builder`
- type `MongoDbDriver` from `./mongodb-driver`
- `MongoQueryOperations` from `./mongodb-query-operations`
- `MongoQueryParser` from `./mongodb-query-parser`
- type `Operation` from `./types`

## Exports
- `MongoQueryBuilder<T>` — MongoDB query builder extending base `QueryBuilder` and implementing `QueryBuilderContract<T>`, compiling fluent methods into a MongoDB aggregation pipeline  [lines 32-2606]

## Classes / Functions / Types / Constants

### `MongoQueryBuilder<T = unknown>` [lines 32-2606]
- Extends `QueryBuilder<T>` and implements `QueryBuilderContract<T>`.
- Holds an ordered list of MongoDB `Operation[]` (shadowing the base `operations` field with a discriminator `stage`) converted later to an aggregation pipeline via `MongoQueryParser`.
- Collaborates with `MongoQueryOperations` (lazy helper for emitting pipeline ops) and `MongoQueryParser` (pipeline assembler).
- Inherits scope state (`scopesApplied`, `pendingGlobalScopes`, `availableLocalScopes`, `disabledGlobalScopes`) from the base `QueryBuilder`.

#### Public fields
- `override operations: Operation[] = []` — pipeline operation list (shadowed for Mongo `stage` discriminator). [line 43]
- `readonly dataSource: DataSource` — data source instance used to resolve the driver/collection. [line 48]
- `hydrateCallback?: (data: any, index: number) => any` — optional record hydration callback. [line 55]
- `eagerLoadRelations: Map<string, boolean | ((query: QueryBuilderContract) => void)>` — relations flagged for eager loading via `with()`. [lines 2410-2411]
- `countRelations: string[]` — relations queued for `withCount()` counting. [line 2416]
- `joinRelations: Map<string, { alias: string; type: "belongsTo" | "hasOne" | "hasMany" }>` — relations to load via `$lookup`. [lines 2421-2422]
- declared `relationDefinitions?: Record<string, any>` — model-defined relation map. [line 2427]
- declared `modelClass?: any` — back-reference to the owning model class. [line 2432]

#### `constructor(table: string, dataSource?: DataSource)` [lines 68-75]
- Stores collection/table name; resolves `dataSource` from registry default when omitted.

#### `get operationsHelper(): MongoQueryOperations` [lines 81-86] (protected getter)
- Lazily creates and returns the `MongoQueryOperations` helper bound to `this.operations`.

#### `get collection(): Collection` [lines 91-95]
- Returns the native MongoDB `Collection` from the driver's database by `this.table`.

#### `hydrate(callback: (data: any, index: number) => any): this` [lines 100-103]
- Registers a hydration callback applied to each row after execution.

#### `onFetching(callback: (query: this) => void | Promise<void>): () => void` [lines 109-114]
- Registers a pre-execution callback; returns an unsubscribe function.

#### `onHydrating(callback: (records: any[], context: any) => void | Promise<void>): () => void` [lines 120-125]
- Registers a callback fired between fetch and hydrate; returns unsubscribe.

#### `onFetched(callback: (records: any[], context: any) => void | Promise<void>): () => void` [lines 131-136]
- Registers a post-hydrate callback; returns unsubscribe.

#### `withoutGlobalScope(...scopeNames: string[]): this` [lines 141-144]
- Disables one or more named global scopes for this query.

#### `withoutGlobalScopes(): this` [lines 149-156]
- Disables every pending global scope for this query.

#### `scope(scopeName: string, ...args: any[]): this` [lines 161-174]
- Immediately applies a registered local scope, throwing if unknown.

#### `where(...): this` (overloaded) [lines 220-227]
- Signatures:
  - `where(field: string, value: unknown): this`
  - `where(field: string, operator: WhereOperator, value: unknown): this`
  - `where(conditions: WhereObject): this`
  - `where(callback: WhereCallback<T>): this`
- Adds an AND match clause via `addWhereClause("where", args)`.

#### `orWhere(...): this` (overloaded) [lines 235-242]
- Same overload set as `where` but OR-combined; delegates to `addWhereClause("orWhere", args)`.

#### `whereRaw(expression: RawExpression, bindings?: unknown[]): this` [lines 249-251]
- Adds a raw AND clause via `addRawWhere("whereRaw", ...)`.

#### `orWhereRaw(expression: RawExpression, bindings?: unknown[]): this` [lines 258-260]
- Adds a raw OR clause via `addRawWhere("orWhereRaw", ...)`.

#### `whereColumn(first: string, operator: WhereOperator, second: string): this` [lines 272-279]
- Emits a `whereColumn` match comparing two fields.

#### `orWhereColumn(first: string, operator: WhereOperator, second: string): this` [lines 287-294]
- OR-variant of `whereColumn`.

#### `whereColumns(comparisons: Array<[left: string, operator: WhereOperator, right: string]>): this` [lines 300-307]
- Batch-adds multiple `whereColumn` clauses in sequence.

#### `whereBetweenColumns(field: string, lowerColumn: string, upperColumn: string): this` [lines 315-322]
- Filter where `field` lies between two other fields' values.

#### `whereDate(field: string, value: Date | string): this` [lines 333-336]
- Match date portion (ignoring time).

#### `whereDateEquals(field: string, value: Date | string): this` [lines 343-349]
- Alias for `whereDate` (explicit equality).

#### `whereDateBefore(field: string, value: Date | string): this` [lines 356-362]
- Filter where date field is before cutoff.

#### `whereDateAfter(field: string, value: Date | string): this` [lines 369-372]
- Filter where date field is after cutoff.

#### `whereTime(field: string, value: string): this` [lines 379-382]
- Match `HH:MM:SS` time portion of a datetime.

#### `whereDay(field: string, value: number): this` [lines 389-392]
- Filter by day-of-month (1-31).

#### `whereMonth(field: string, value: number): this` [lines 399-402]
- Filter by month (1-12).

#### `whereYear(field: string, value: number): this` [lines 409-412]
- Filter by year.

#### `whereJsonContains(path: string, value: unknown): this` [lines 423-429]
- Match JSON path containing value.

#### `whereJsonDoesntContain(path: string, value: unknown): this` [lines 436-442]
- Match JSON path NOT containing value.

#### `whereJsonContainsKey(path: string): this` [lines 448-451]
- Match JSON object containing a specific key.

#### `whereJsonLength(path: string, operator: WhereOperator, value: number): this` [lines 459-466]
- Match JSON array/string length against operator.

#### `whereJsonIsArray(path: string): this` [lines 472-475]
- Match when JSON path is an array.

#### `whereJsonIsObject(path: string): this` [lines 481-484]
- Match when JSON path is an object.

#### `whereArrayLength(field: string, operator: WhereOperator, value: number): this` [lines 492-499]
- Compare array field length.

#### `whereId(value: string | number): this` [lines 509-511]
- Convenience for `where("id", value)`.

#### `whereIds(values: Array<string | number>): this` [lines 517-519]
- Convenience for `whereIn("id", values)`.

#### `whereUuid(value: string): this` [lines 525-527]
- Convenience for `where("uuid", value)`.

#### `whereUlid(value: string): this` [lines 533-535]
- Convenience for `where("ulid", value)`.

#### `whereFullText(fields: string | string[], query: string): this` [lines 542-549]
- Full-text search over specified field(s).

#### `orWhereFullText(fields: string | string[], query: string): this` [lines 556-563]
- OR-variant of `whereFullText`.

#### `whereSearch(field: string, query: string): this` [lines 570-572]
- Alias for `whereFullText` with a single field.

#### `whereNot(callback: WhereCallback<T>): this` [lines 578-581]
- Negate a callback-defined clause group (AND).

#### `orWhereNot(callback: WhereCallback<T>): this` [lines 587-590]
- Negate a callback-defined clause group (OR).

#### `whereIn(field: string, values: unknown[]): this` [lines 601-604]
- Match when field equals any of values.

#### `whereNotIn(field: string, values: unknown[]): this` [lines 611-614]
- Match when field is none of values.

#### `whereNull(field: string): this` [lines 620-623]
- Match where field is null/undefined.

#### `whereNotNull(field: string): this` [lines 629-632]
- Match where field is not null.

#### `whereBetween(field: string, range: [unknown, unknown]): this` [lines 639-642]
- Match inclusive range.

#### `whereNotBetween(field: string, range: [unknown, unknown]): this` [lines 649-655]
- Exclude inclusive range.

#### `whereLike(field: string, pattern: RegExp | string): this` [lines 666-669]
- Case-insensitive pattern match.

#### `whereNotLike(field: string, pattern: RegExp | string): this` [lines 676-679]
- Negated pattern match.

#### `whereStartsWith(field: string, value: string | number): this` [lines 686-692]
- Match field starting with prefix.

#### `whereNotStartsWith(field: string, value: string | number): this` [lines 699-705]
- Negated prefix match.

#### `whereEndsWith(field: string, value: string | number): this` [lines 712-715]
- Match field ending with suffix.

#### `whereNotEndsWith(field: string, value: string | number): this` [lines 722-728]
- Negated suffix match.

#### `whereDateBetween(field: string, range: [Date, Date]): this` [lines 735-741]
- Inclusive date range match.

#### `whereDateNotBetween(field: string, range: [Date, Date]): this` [lines 748-754]
- Excluded date range match.

#### `whereExists(...): this` (overloaded) [lines 765-777]
- Signatures:
  - `whereExists(field: string): this`
  - `whereExists(callback: WhereCallback<T>): this`
- Dispatches to `where:exists` (callback) or `whereExists` (field) ops.

#### `whereNotExists(...): this` (overloaded) [lines 784-798]
- Signatures:
  - `whereNotExists(field: string): this`
  - `whereNotExists(callback: WhereCallback<T>): this`
- Mirror of `whereExists` for absence.

#### `whereSize(field: string, ...): this` (overloaded) [lines 806-823]
- Signatures:
  - `whereSize(field: string, size: number): this`
  - `whereSize(field: string, operator: ">" | ">=" | "=" | "<" | "<=", size: number): this`
- Exact or operator-based array size match.

#### `textSearch(query: string, filters?: WhereObject): this` [lines 834-837]
- Full-text search with optional additional filters.

#### `whereArrayContains(field: string, value: unknown, key?: string): this` [lines 849-856]
- Match when array field contains value (optionally on nested key).

#### `whereArrayNotContains(field: string, value: unknown, key?: string): this` [lines 864-871]
- Inverse of `whereArrayContains`.

#### `whereArrayHasOrEmpty(field: string, value: unknown, key?: string): this` [lines 879-886]
- Match when array contains value OR is empty.

#### `whereArrayNotHaveOrEmpty(field: string, value: unknown, key?: string): this` [lines 894-901]
- Match when array lacks value AND is non-empty.

#### `addWhereClause(prefix: "where" | "orWhere", args: any[]): void` [lines 908-932] (protected)
- Internal dispatcher parsing where/orWhere args into callback/object/field forms.

#### `addRawWhere(type: "whereRaw" | "orWhereRaw", expression: RawExpression, bindings?: unknown[]): this` [lines 940-947] (protected)
- Internal helper to emit raw where operations.

#### `normalizeSelectFields(args: any[]): { fields?: string[]; projection?: Record<string, unknown> }` [lines 954-980] (protected)
- Normalizes select-style varargs (single object/array/string or many strings).

#### `select(...): this` (overloaded) [lines 991-998]
- Signatures:
  - `select(fields: string[]): this`
  - `select(fields: Record<string, 0 | 1 | boolean | string>): this`
  - `select(...fields: string[]): this`
- Adds a `$project` operation from normalized arguments.

#### `selectAs(field: string, alias: string): this` [lines 1006-1008]
- Aliases a field via `select({ [field]: alias })`.

#### `selectRaw(expression: RawExpression, bindings?: unknown[]): this` [lines 1015-1021]
- Adds a computed projected field from a raw expression.

#### `selectRawMany(definitions: Array<{ alias: string; expression: RawExpression; bindings?: unknown[] }>): this` [lines 1027-1038]
- Batch-add `selectRaw` entries.

#### `selectSub(expression: RawExpression, alias: string): this` [lines 1045-1051]
- Adds subquery as projected field (replaces existing projection).

#### `addSelectSub(expression: RawExpression, alias: string): this` [lines 1058-1064]
- Appends a subquery field without replacing prior projection.

#### `selectAggregate(field: string, aggregate: "sum" | "avg" | "min" | "max" | "count" | "first" | "last", alias: string): this` [lines 1072-1083]
- Emits an aggregate as a projected alias.

#### `selectExists(field: string, alias: string): this` [lines 1090-1096]
- Projects a boolean for relation/field existence.

#### `selectCount(field: string, alias: string): this` [lines 1103-1106]
- Projects a count of a related field.

#### `selectCase(cases: Array<{ when: RawExpression; then: RawExpression | unknown }>, otherwise: RawExpression | unknown, alias: string): this` [lines 1114-1125]
- CASE-style conditional projection.

#### `selectWhen(condition: RawExpression, thenValue: RawExpression | unknown, elseValue: RawExpression | unknown, alias: string): this` [lines 1134-1147]
- Simple if/else projection.

#### `selectDriverProjection(callback: (projection: Record<string, unknown>) => void): this` [lines 1153-1158]
- Enables driver-level manipulation of the projection map.

#### `selectJson(path: string, alias?: string): this` [lines 1165-1168]
- Projects a JSON path.

#### `selectJsonRaw(path: string, expression: RawExpression, alias: string): this` [lines 1176-1183]
- Projects a JSON path via a raw expression.

#### `deselectJson(path: string): this` [lines 1189-1192]
- Excludes a JSON path from projection.

#### `selectConcat(fields: Array<string | RawExpression>, alias: string): this` [lines 1199-1205]
- Concatenates fields/expressions into one aliased field.

#### `selectCoalesce(fields: Array<string | RawExpression>, alias: string): this` [lines 1212-1218]
- Projects first non-null value across fields.

#### `selectWindow(spec: RawExpression): this` [lines 1224-1227]
- Emits a `$setWindowFields` stage via `selectWindow`.

#### `deselect(...): this` (overloaded) [lines 1233-1239]
- Signatures:
  - `deselect(fields: string[]): this`
  - `deselect(...fields: Array<string | string[]>): this`
- Removes fields from projection.

#### `distinctValues(fields?: string | string[]): this` [lines 1245-1248]
- Emits a `$group` for distinct values on a field/set.

#### `addSelect(...): this` (overloaded) [lines 1254-1260]
- Signatures:
  - `addSelect(fields: string[]): this`
  - `addSelect(...fields: Array<string | string[]>): this`
- Adds to, rather than replacing, current projection.

#### `clearSelect(): this` [lines 1265-1268]
- Removes all `$project` operations from the pipeline.

#### `selectAll(): this` [lines 1273-1275]
- Alias for `clearSelect`.

#### `selectDefault(): this` [lines 1280-1282]
- Alias for `clearSelect`.

#### `orderBy(...): this` (overloaded) [lines 1303-1325]
- Signatures:
  - `orderBy(field: string, direction?: OrderDirection): this`
  - `orderBy(fields: Record<string, OrderDirection>): this`
- Adds one or more `$sort` operations.

#### `orderByDesc(field: string): this` [lines 1331-1333]
- Shortcut for descending `orderBy`.

#### `orderByRaw(expression: RawExpression, bindings?: unknown[]): this` [lines 1340-1346]
- Sorts by a raw expression.

#### `orderByRandom(limit: number = 1000): this` [lines 1351-1354]
- Randomizes result order via `$sample`-style operation.

#### `latest(column: string = "createdAt")` [lines 1360-1362]
- Orders descending by `column` and immediately calls `get()` — note: no explicit return type, actually returns `Promise<T[]>`, breaking the fluent chain.

#### `oldest(column: string = "createdAt"): this` [lines 1368-1370]
- Ascending order by column (does NOT execute).

#### `limit(value: number): this` [lines 1380-1383]
- Emits a `$limit` stage.

#### `skip(value: number): this` [lines 1389-1392]
- Emits a `$skip` stage.

#### `offset(value: number): this` [lines 1398-1400]
- Alias for `skip`.

#### `take(value: number): this` [lines 1406-1408]
- Alias for `limit`.

#### `cursor(after?: unknown, before?: unknown): this` [lines 1415-1418]
- Applies cursor-based filter (match operation) for pagination.

#### `groupBy(...): this` (overloaded) [lines 1444-1458]
- Signatures:
  - `groupBy(fields: GroupByInput): this`
  - `groupBy(fields: GroupByInput, aggregates: Record<string, RawExpression>): this`
- Emits `$group` (or grouped-with-aggregates) operations.

#### `groupByRaw(expression: RawExpression, bindings?: unknown[]): this` [lines 1465-1468]
- Raw `$group` expression.

#### `having(...): this` (overloaded) [lines 1477-1497]
- Signatures:
  - `having(field: string, value: unknown): this`
  - `having(field: string, operator: WhereOperator, value: unknown): this`
  - `having(condition: HavingInput): this`
- Post-group match filter.

#### `havingRaw(expression: RawExpression, bindings?: unknown[]): this` [lines 1504-1507]
- Raw having expression.

#### `join(...): this` (overloaded) [lines 1520-1544]
- Signatures:
  - `join(table: string, localField: string, foreignField: string): this`
  - `join(options: JoinOptions): this`
- Adds `$lookup` (defaults to left join).

#### `leftJoin(...): this` (overloaded) [lines 1554-1578]
- Signatures same as `join` but explicitly typed `left`.

#### `rightJoin(...): this` (overloaded) [lines 1591-1617]
- Signatures same as `join`; MongoDB emulates as left-join (flagged as `right`).

#### `innerJoin(...): this` (overloaded) [lines 1629-1653]
- Signatures same as `join`; combines `$lookup` + `$match` of non-empty array.

#### `fullJoin(...): this` (overloaded) [lines 1666-1690]
- Signatures same as `join`; emulated via left-join with `full` flag.

#### `crossJoin(table: string): this` [lines 1699-1709]
- Cartesian product join using dummy-field `$lookup` with `$match: {}` pipeline.

#### `joinRaw(expression: RawExpression, _bindings?: unknown[]): this` [lines 1719-1724]
- Injects a raw join stage via `raw` match operation.

#### `raw(builder: (native: unknown) => unknown): this` [lines 1730-1733]
- Allows direct manipulation of the native query via builder callback.

#### `extend<R>(extension: string, ..._args: unknown[]): R` [lines 1741-1744]
- Hook for driver-specific extensions; throws unsupported for MongoDB.

#### `clone(): this` [lines 1750-1766]
- Deep-copies operations, callbacks, and scope state into a new builder.

#### `tap(callback: (builder: this) => void): this` [lines 1772-1775]
- Invokes callback with builder while keeping chain.

#### `when<V>(condition: V | boolean, callback: (builder: this, value: V) => void, otherwise?: (builder: this) => void): this` [lines 1786-1797]
- Conditionally applies `callback` or `otherwise` without breaking the chain.

#### `async get<Output = T>(): Promise<Output[]>` [lines 1807-1841]
- Runs the pipeline, firing `onFetching`/`onHydrating`/`onFetched` hooks and applying `hydrateCallback`.

#### `async getFirst<Output = T>(): Promise<Output | null>` [lines 1847-1849]
- Returns the first element of `get()` without appending a `$limit`.

#### `async first<Output = T>(): Promise<Output | null>` [lines 1855-1858]
- Applies `limit(1)` then returns first result (or null).

#### `async firstOrFail<Output = T>(): Promise<Output>` [lines 1864-1870]
- Like `first` but throws if no record.

#### `async find<Output = T>(id: number | string): Promise<Output | null>` [lines 1875-1877]
- `where("id", id).first()` convenience.

#### `last<Output = T>(field: string = "createdAt"): Promise<Output | null>` [lines 1882-1885]
- Orders descending by `field` and returns first.

#### `async count(): Promise<number>` [lines 1891-1898]
- Appends `$count` stage and reads the `total` field.

#### `async sum(field: string): Promise<number>` [lines 1905-1917]
- Groups by null with `$sum` aggregation; clears hydrate callback.

#### `async avg(field: string): Promise<number>` [lines 1924-1934]
- Groups by null with `$avg` aggregation.

#### `async min(field: string): Promise<number>` [lines 1941-1951]
- Groups by null with `$min` aggregation.

#### `async max(field: string): Promise<number>` [lines 1958-1968]
- Groups by null with `$max` aggregation.

#### `async distinct<T = unknown>(field: string, ignoreNull = true): Promise<T[]>` [lines 1975-1987]
- Groups by `field` (optionally filtering nulls) and returns distinct values.

#### `async countDistinct(field: string, ignoreNull = true): Promise<number>` [lines 1994-2000]
- Counts distinct values (optionally excluding nulls).

#### `async pluck<T = unknown>(field: string): Promise<T[]>` [lines 2007-2017]
- Aliases `field` to `value` and projects a flat array.

#### `async value<T = unknown>(field: string): Promise<T | null>` [lines 2024-2030]
- Gets the single field value from the first matching record.

#### `async exists(filter?: GenericObject): Promise<boolean>` [lines 2037-2044]
- `limit(1).count() > 0` existence check with optional `where` filter.

#### `async notExists(filter?: GenericObject): Promise<boolean>` [lines 2051-2053]
- Inverse of `exists`.

#### `async increment(field: string, amount: number = 1): Promise<number>` [lines 2061-2075]
- Increments field on first matching doc via `findOneAndUpdate`; returns new value.

#### `async decrement(field: string, amount: number = 1): Promise<number>` [lines 2083-2085]
- Calls `increment(field, -amount)`.

#### `async incrementMany(field: string, amount: number = 1): Promise<number>` [lines 2093-2101]
- Increments field across all matches via driver `updateMany`; returns modified count.

#### `async decrementMany(field: string, amount: number = 1): Promise<number>` [lines 2109-2111]
- Calls `incrementMany(field, -amount)`.

#### `async delete(): Promise<number>` [lines 2116-2119]
- Deletes all docs matching built filter via `driver.deleteMany`.

#### `async deleteOne(): Promise<number>` [lines 2124-2127]
- Deletes a single doc via `driver.delete`.

#### `async update(fields: Record<string, unknown>): Promise<number>` [lines 2132-2138]
- `updateMany` with `$set`; returns modified count.

#### `async unset(...fields: string[]): Promise<number>` [lines 2143-2155]
- `updateMany` with `$unset` for each listed field.

#### `async chunk(size: number, callback: (rows: T[], chunkIndex: number) => Promise<boolean | void> | boolean | void): Promise<void>` [lines 2167-2193]
- Streams results in fixed-size chunks; stops when callback returns `false`.

#### `async paginate(options?: PaginationOptions): Promise<PaginationResult<T>>` [lines 2200-2219]
- Traditional page/limit pagination (runs data & count in parallel).

#### `async cursorPaginate(options?: CursorPaginationOptions): Promise<CursorPaginationResult<T>>` [lines 2226-2296]
- Cursor-based pagination supporting `next`/`prev` directions with consistent ordering on `_id`.

#### `parse(): DriverQuery` [lines 2305-2307]
- Returns `{ pipeline: buildPipeline() }`.

#### `pretty()` [lines 2313-2315]
- Returns pretty-printed pipeline string via parser.

#### `async explain(): Promise<unknown>` [lines 2321-2328]
- Runs `collection.aggregate(pipeline, { explain: true })` (respecting transaction session).

#### `getParser(): MongoQueryParser` [lines 2337-2345] (protected)
- Applies pending scopes then constructs a `MongoQueryParser` with a sub-builder factory.

#### `buildPipeline()` [lines 2351-2355] (protected)
- Delegates to `parser.parse()` to produce the MongoDB aggregation pipeline.

#### `buildFilter(): Record<string, unknown>` [lines 2362-2379] (protected)
- Extracts first `$match` stage from the pipeline for direct update/delete ops.

#### `execute<T = any>(pipeline?: any[]): Promise<T[]>` [lines 2384-2401] (protected)
- Runs aggregation (using optional transaction session), clears `operations`, returns result array.

#### `joinWith(...relations: string[]): this` [lines 2443-2454]
- Marks relations to load via `$lookup` using `relationDefinitions` metadata.

#### `with(...args): this` [lines 2467-2494]
- Rest-arg signature accepting any of:
  - `string` (relation name)
  - `Record<string, boolean | ((query: QueryBuilderContract) => void)>`
  - `(query: QueryBuilderContract) => void` (only valid when paired after a string)
- Populates `eagerLoadRelations`.

#### `withCount(...relations: string[]): this` [lines 2500-2503]
- Appends relations to `countRelations` for per-row counts.

#### `has(relation: string, operator?: string, count?: number): this` [lines 2511-2515]
- Adds a `has` match operation (TODO — not yet fully wired).

#### `whereHas(relation: string, callback: (query: QueryBuilderContract) => void): this` [lines 2522-2526]
- Adds a `whereHas` match operation (TODO — not yet fully wired).

#### `doesntHave(relation: string): this` [lines 2532-2536]
- Adds a `doesntHave` match operation (TODO — not yet fully wired).

#### `whereDoesntHave(relation: string, callback: (query: QueryBuilderContract) => void): this` [lines 2543-2547]
- Adds a `whereDoesntHave` match operation (TODO — not yet fully wired).

#### `similarTo(column: string, embedding: number[], alias = "score"): this` [lines 2577-2605]
- Atlas vector search: emits `$vectorSearch` (with `numCandidates = limit*10`) and `$addFields` stages exposing `$meta: "vectorSearchScore"` as `alias`.
