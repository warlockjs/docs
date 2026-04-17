# query-builder.contract
source: contracts/query-builder.contract.ts
description: Driver-agnostic query builder contract defining fluent query API, predicates, joins, relations, aggregates, pagination, and driver parsing shape
complexity: complex
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-opus-4-7
last-updated-by: claude-opus-4-7

## Imports
- `GlobalScopeDefinition`, `LocalScopeCallback` (type) from `../model/model`

## Exports
- `OrderDirection` — Ordering direction union ("asc" | "desc")  [lines 1-4]
- `JoinOptions` — Options describing a relationship join  [lines 6-30]
- `PaginationResult<T>` — Pagination result returned by paginate helpers  [lines 32-43]
- `CursorPaginationResult<T>` — Cursor pagination result  [lines 45-56]
- `ChunkCallback<T>` — Chunk callback signature  [lines 58-64]
- `CursorPaginationOptions` — Cursor pagination options  [lines 66-74]
- `PaginationOptions` — Standard pagination options  [lines 76-82]
- `WhereOperator` — Supported comparison operators union  [lines 84-105]
- `WhereObject` — Object-based predicate definition  [lines 107-111]
- `WhereCallback<T>` — Callback-based predicate definition  [lines 113-116]
- `GroupByInput` — Group-by payload union supporting strings, arrays, objects  [lines 118-125]
- `HavingInput` — Having clause payload union  [lines 127-133]
- `RawExpression` — Raw expression payload for projection/order/group extensions  [lines 135-138]
- `DriverQuery` — Driver-agnostic representation of a parsed query  [lines 140-166]
- `QueryBuilderContract<T = unknown>` — Main contract that all query builders must implement  [lines 168-1887]

## Classes / Functions / Types / Constants

### `OrderDirection` [lines 1-4]
- Union type for ordering direction
- Variants: `"asc"` | `"desc"`

### `JoinOptions` [lines 6-30]
- Options describing a relationship join
- Members:
  - `table: string` — Target table or collection
  - `localField?: string` — Local field used in the join condition
  - `operator?: string` — Operator used in the join condition (defaults to equality)
  - `foreignField?: string` — Foreign field used in the join condition
  - `type?: "inner" | "left" | "right" | "full" | "cross"` — Join type
  - `alias?: string` — Optional alias for the joined relation
  - `options?: Record<string, unknown>` — Driver-specific options (e.g. Mongo pipeline)
  - `select?: string[]` — Projection overrides for the joined relation
  - `conditions?: Record<string, unknown>` — Extra join conditions expressed as key/value pairs
  - `pipeline?: unknown[]` — Driver specific pipeline/clauses for advanced joins

### `PaginationResult<T>` [lines 32-43]
- Pagination result returned by paginate helpers
- Members:
  - `data: T[]`
  - `pagination: { total: number; page: number; limit: number; pages: number }`

### `CursorPaginationResult<T>` [lines 45-56]
- Cursor pagination result
- Members:
  - `data: T[]`
  - `pagination: { hasMore: boolean; hasPrev?: boolean; nextCursor?: unknown; prevCursor?: unknown }`

### `ChunkCallback<T>` [lines 58-64]
- Chunk callback signature
- Signature: `(rows: T[], chunkIndex: number) => Promise<boolean | void> | boolean | void`

### `CursorPaginationOptions` [lines 66-74]
- Cursor pagination options
- Members:
  - `cursor?: unknown`
  - `direction?: "next" | "prev"`
  - `limit: number`
  - `column?: string`

### `PaginationOptions` [lines 76-82]
- Standard pagination options
- Members:
  - `page?: number`
  - `limit?: number`

### `WhereOperator` [lines 84-105]
- Supported comparison operators union
- Variants: `"="` | `"!="` | `">"` | `">="` | `"<"` | `"<="` | `"in"` | `"notIn"` | `"between"` | `"notBetween"` | `"like"` | `"notLike"` | `"startsWith"` | `"notStartsWith"` | `"endsWith"` | `"notEndsWith"` | `"exists"` | `string`

### `WhereObject` [lines 107-111]
- Object-based predicate definition
- Alias: `Record<string, unknown>`

### `WhereCallback<T>` [lines 113-116]
- Callback-based predicate definition
- Signature: `(builder: QueryBuilderContract<T>) => unknown`

### `GroupByInput` [lines 118-125]
- Group-by payload union
- Variants: `string` | `string[]` | `Record<string, unknown>` | `Array<Record<string, unknown>>`

### `HavingInput` [lines 127-133]
- Having clause payload union
- Variants: `Record<string, unknown>` | `[field: string, value: unknown]` | `[field: string, operator: WhereOperator, value: unknown]`

### `RawExpression` [lines 135-138]
- Raw expression payload
- Variants: `string` | `Record<string, unknown>` | `unknown`

### `DriverQuery` [lines 140-166]
- Driver-agnostic representation of a parsed query
- Members:
  - `query?: string` — Text-based query string: SQL, CQL, Cypher, etc.
  - `bindings?: unknown[]` — Positional or named parameter bindings for the text query
  - `pipeline?: unknown[]` — Document pipeline: MongoDB aggregation stages, Elasticsearch DSL body
  - `native?: unknown` — Full escape hatch for drivers that don't fit any shape above

### `QueryBuilderContract<T = unknown>` [lines 168-1887]
- Contract that all query builders must implement for building queries in a database-agnostic way
- Generic: `T` — the type of records returned by the query

#### Properties
- `table: string` [line 179] — Table name
- `pendingGlobalScopes?: Map<string, GlobalScopeDefinition>` [line 215] — Pending global scopes to be applied before execution
- `availableLocalScopes?: Map<string, LocalScopeCallback>` [line 221] — Available local scopes that can be manually applied
- `disabledGlobalScopes?: Set<string>` [line 226] — Set of global scope names that have been disabled
- `scopesApplied?: boolean` [line 231] — Flag indicating whether scopes have been applied
- `eagerLoadRelations?: Map<string, boolean | ((query: QueryBuilderContract) => void)>` [line 243] — Relations to eagerly load
- `countRelations?: string[]` [line 248] — Array of relation names to count
- `joinRelations?: Map<string, { alias: string; type: "belongsTo" | "hasOne" | "hasMany"; model?: any; localKey?: string; foreignKey?: string; ownerKey?: string; parentPath?: string | null; relationName?: string; parentModel?: any; select?: string[] }>` [lines 254-268] — Relations to load via JOIN
- `relationDefinitions?: Record<string, any>` [line 274] — Relation definitions from the model class
- `modelClass?: any` [line 279] — Model class reference for resolving related models

#### Lifecycle / Hooks
##### `hydrate(callback: (data: any, index: number) => any): this` [line 184]
- Add hydrate callback to transform records after fetching

##### `onFetching(callback: (query: this) => void | Promise<void>): () => void` [line 191]
- Register callback invoked before query execution. Returns unsubscribe function

##### `onHydrating(callback: (records: any[], context: any) => void | Promise<void>): () => void` [line 198]
- Register callback invoked after records fetched but before hydration. Returns unsubscribe function

##### `onFetched(callback: (records: any[], context: any) => void | Promise<void>): () => void` [line 205]
- Register callback invoked after records fetched and hydrated. Returns unsubscribe function

#### Relations / Scopes
##### `joinWith(...relations: string[]): this` [line 306]
- Load relations using database JOINs in a single query (LEFT JOIN / $lookup)

##### `withoutGlobalScope(...scopeNames: string[]): this` [line 323]
- Disable one or more global scopes for this query

##### `withoutGlobalScopes(): this` [line 336]
- Disable all global scopes for this query

##### `scope(scopeName: string, ...args: any[]): this` [line 354]
- Apply a local scope to this query. Throws if scope not found

#### Where Clauses
##### `where(field: string, value: unknown): this` [line 376]
##### `where(field: string, operator: WhereOperator, value: unknown): this` [line 377]
##### `where(conditions: WhereObject): this` [line 378]
##### `where(callback: WhereCallback<T>): this` [line 379]
- Add a where clause; overloaded for simple equality, operator, object, or callback

##### `whereRaw(expression: RawExpression, bindings?: unknown[]): this` [line 388]
- Add a raw where clause expressed in the native query language

##### `orWhereRaw(expression: RawExpression, bindings?: unknown[]): this` [line 396]
- Add a raw OR where clause in the native query language

##### `whereColumn(first: string, operator: WhereOperator, second: string): this` [line 404]
- Compare two columns/fields directly

##### `orWhereColumn(first: string, operator: WhereOperator, second: string): this` [line 412]
- Compare two columns/fields using OR logic

##### `whereColumns(comparisons: Array<[left: string, operator: WhereOperator, right: string]>): this` [line 423]
- Compare multiple column pairs at once

##### `whereBetweenColumns(field: string, lowerColumn: string, upperColumn: string): this` [line 431]
- Ensure a value falls between two other column values

##### `whereDate(field: string, value: Date | string): this` [line 439]
- Constrain a field to a specific date (time portion ignored)

##### `whereDateEquals(field: string, value: Date | string): this` [line 444]
- Require field to match a given date exactly

##### `whereDateBefore(field: string, value: Date | string): this` [line 449]
- Require field to be before the given date

##### `whereDateAfter(field: string, value: Date | string): this` [line 454]
- Require field to be after the given date

##### `whereTime(field: string, value: string): this` [line 462]
- Constrain a field to match a specific time

##### `whereDay(field: string, value: number): this` [line 467]
- Constrain the day-of-month extracted from a date field

##### `whereMonth(field: string, value: number): this` [line 472]
- Constrain the month extracted from a date field

##### `whereYear(field: string, value: number): this` [line 477]
- Constrain the year extracted from a date field

##### `whereJsonContains(path: string, value: unknown): this` [line 482]
- Ensure a JSON/array path contains the given value

##### `whereJsonDoesntContain(path: string, value: unknown): this` [line 487]
- Ensure a JSON/array path does not contain the given value

##### `whereJsonContainsKey(path: string): this` [line 492]
- Ensure a JSON/array path exists

##### `whereJsonLength(path: string, operator: WhereOperator, value: number): this` [line 500]
- Constrain the length of a JSON/array path

##### `whereJsonIsArray(path: string): this` [line 505]
- Ensure a JSON path resolves to an array

##### `whereJsonIsObject(path: string): this` [line 510]
- Ensure a JSON path resolves to an object

##### `whereArrayLength(field: string, operator: WhereOperator, value: number): this` [line 518]
- Constrain the length of an array field

##### `whereId(value: string | number): this` [line 523]
- Shortcut for filtering by the primary key

##### `whereIds(values: Array<string | number>): this` [line 528]
- Shortcut for filtering by multiple primary keys

##### `whereUuid(value: string): this` [line 533]
- Shortcut for UUID-based identifiers

##### `whereUlid(value: string): this` [line 538]
- Shortcut for ULID-based identifiers

##### `whereFullText(fields: string | string[], query: string): this` [line 543]
- Perform a full-text search across the specified fields

##### `orWhereFullText(fields: string | string[], query: string): this` [line 548]
- Apply a full-text OR clause

##### `whereSearch(field: string, query: string): this` [line 553]
- Convenience alias for simple text searches

##### `whereNot(callback: WhereCallback<T>): this` [line 558]
- Negate a nested callback block

##### `orWhereNot(callback: WhereCallback<T>): this` [line 563]
- Negate a nested callback block with OR logic

##### `whereExists(callback: WhereCallback<T>): this` [line 572]
##### `whereExists(field: string): this` [line 712]
- Apply a nested existence check (callback overload) or MongoDB-specific field existence check

##### `whereNotExists(callback: WhereCallback<T>): this` [line 581]
##### `whereNotExists(field: string): this` [line 720]
- Apply a nested non-existence check (callback overload) or MongoDB-specific field non-existence check

##### `orWhere(field: string, value: unknown): this` [line 589]
##### `orWhere(field: string, operator: WhereOperator, value: unknown): this` [line 590]
##### `orWhere(conditions: WhereObject): this` [line 591]
##### `orWhere(callback: WhereCallback<T>): this` [line 592]
- Add an OR where clause to the query (overloaded)

##### `whereIn(field: string, values: unknown[]): this` [line 600]
- Add a where IN clause to the query

##### `whereNotIn(field: string, values: unknown[]): this` [line 608]
- Add a where NOT IN clause to the query

##### `whereNull(field: string): this` [line 616]
- Constrain the field to be NULL

##### `whereNotNull(field: string): this` [line 624]
- Constrain the field to be NOT NULL

##### `whereBetween(field: string, range: [unknown, unknown]): this` [line 632]
- Constrain the field to be between the given range (inclusive)

##### `whereNotBetween(field: string, range: [unknown, unknown]): this` [line 640]
- Constrain the field to be outside the given range

##### `whereLike(field: string, pattern: RegExp | string): this` [line 648]
- Apply pattern matching (case-insensitive) for the given field

##### `whereNotLike(field: string, pattern: string): this` [line 656]
- Apply pattern exclusion (case-insensitive) for the given field

##### `whereStartsWith(field: string, value: string | number): this` [line 664]
- Constrain the field to start with the given value

##### `whereNotStartsWith(field: string, value: string | number): this` [line 672]
- Constrain the field to not start with the given value

##### `whereEndsWith(field: string, value: string | number): this` [line 680]
- Constrain the field to end with the given value

##### `whereNotEndsWith(field: string, value: string | number): this` [line 688]
- Constrain the field to not end with the given value

##### `whereDateBetween(field: string, range: [Date, Date]): this` [line 696]
- Constrain the date field to be between the given range

##### `whereDateNotBetween(field: string, range: [Date, Date]): this` [line 704]
- Constrain the date field to not be between the given range

##### `whereSize(field: string, size: number): this` [line 732]
##### `whereSize(field: string, operator: ">" | ">=" | "=" | "<" | "<=", size: number): this` [line 733]
- Constrain an array/collection field by size (overloaded)

##### `textSearch(query: string, filters?: WhereObject): this` [line 741]
- Perform a full-text search (driver-specific implementation)

##### `whereArrayContains(field: string, value: unknown, key?: string): this` [line 754]
- Constrain an array field to contain the given value

##### `whereArrayNotContains(field: string, value: unknown, key?: string): this` [line 762]
- Constrain an array field to not contain the given value

##### `whereArrayHasOrEmpty(field: string, value: unknown, key?: string): this` [line 770]
- Constrain an array field to contain the value OR be empty

##### `whereArrayNotHaveOrEmpty(field: string, value: unknown, key?: string): this` [line 778]
- Constrain an array field to not contain the value OR be empty

#### Select / Projection
##### `select(fields: string[]): this` [line 790]
##### `select(fields: Record<string, 0 | 1 | boolean>): this` [line 791]
##### `select(...fields: Array<string | string[]>): this` [line 792]
##### `select(...args: Array<string | string[]>): this` [line 793]
- Specify the columns/fields to be selected (overloaded)

##### `selectAs(field: string, alias: string): this` [line 801]
- Select a field with an alias

##### `selectRaw(expression: RawExpression, bindings?: unknown[]): this` [line 809]
- Add a raw selection/projection expression

##### `selectRawMany(definitions: Array<{ alias: string; expression: RawExpression; bindings?: unknown[] }>): this` [lines 820-826]
- Add multiple raw selections at once

##### `selectSub(expression: RawExpression, alias: string): this` [line 834]
- Inject a sub-select expression under the given alias

##### `addSelectSub(expression: RawExpression, alias: string): this` [line 839]
- Add a sub-select expression without clearing previous selects

##### `selectAggregate(field: string, aggregate: "sum" | "avg" | "min" | "max" | "count" | "first" | "last", alias: string): this` [lines 847-851]
- Add a simple aggregate expression to the projection

##### `selectExists(field: string, alias: string): this` [line 859]
- Project whether the given field exists

##### `selectCount(field: string, alias: string): this` [line 867]
- Project the number of items in an array field

##### `selectCase(cases: Array<{ when: RawExpression; then: RawExpression | unknown }>, otherwise: RawExpression | unknown, alias: string): this` [lines 882-886]
- Build CASE / switch-like conditions in the projection

##### `selectWhen(condition: RawExpression, thenValue: RawExpression | unknown, elseValue: RawExpression | unknown, alias: string): this` [lines 894-899]
- Convenience helper for single condition CASE statements

##### `selectDriverProjection(callback: (projection: Record<string, unknown>) => void): this` [line 909]
- Allow direct access to the driver projection object for advanced cases

##### `selectJson(path: string, alias?: string): this` [line 917]
- Project a nested JSON path under a new alias

##### `selectJsonRaw(path: string, expression: RawExpression, alias: string): this` [line 925]
- Apply a raw expression to a JSON path

##### `deselectJson(path: string): this` [line 930]
- Exclude a nested JSON path from the projection

##### `selectConcat(fields: Array<string | RawExpression>, alias: string): this` [line 938]
- Compute concatenated string fields

##### `selectCoalesce(fields: Array<string | RawExpression>, alias: string): this` [line 946]
- Coalesce a list of values, returning the first non-null entry

##### `selectWindow(spec: RawExpression): this` [line 958]
- Attach window function output to the projection

##### `deselect(fields: string[]): this` [line 966]
- Exclude the given fields from the projection

##### `clearSelect(): this` [line 971]
- Reset the projection to its default state

##### `selectAll(): this` [line 976]
- Alias for clearSelect() — keeps all fields

##### `selectDefault(): this` [line 981]
- Restore the default projection (all columns)

##### `distinctValues(fields?: string | string[]): this` [line 990]
- Mark the query as distinct values for the given fields

##### `addSelect(fields: string[]): this` [line 998]
- Add additional select fields to the existing projection

#### Joins
##### `join(table: string, localField: string, foreignField: string): this` [line 1032]
##### `join(options: JoinOptions): this` [line 1033]
##### `join(options: JoinOptions): this` [line 1573]
- Add a join clause (INNER by default); overloaded; duplicate JoinOptions overload at line 1573

##### `leftJoin(table: string, localField: string, foreignField: string): this` [line 1055]
##### `leftJoin(options: JoinOptions): this` [line 1056]
- Add a LEFT JOIN clause

##### `rightJoin(table: string, localField: string, foreignField: string): this` [line 1078]
##### `rightJoin(options: JoinOptions): this` [line 1079]
- Add a RIGHT JOIN clause

##### `innerJoin(table: string, localField: string, foreignField: string): this` [line 1101]
##### `innerJoin(options: JoinOptions): this` [line 1102]
- Add an INNER JOIN clause

##### `fullJoin(table: string, localField: string, foreignField: string): this` [line 1123]
##### `fullJoin(options: JoinOptions): this` [line 1124]
- Add a FULL OUTER JOIN clause

##### `crossJoin(table: string): this` [line 1144]
- Add a CROSS JOIN clause (Cartesian product)

##### `joinRaw(expression: RawExpression, bindings?: unknown[]): this` [line 1174]
- Add a raw JOIN clause using native query syntax

#### Relations / Eager Loading
##### `with(relation: string): this` [line 1202]
##### `with(...relations: string[]): this` [line 1210]
##### `with(relation: string, constraint: (query: QueryBuilderContract) => void): this` [line 1233]
##### `with(relations: Record<string, boolean | ((query: QueryBuilderContract) => void)>): this` [line 1256]
- Eagerly load one or more relations (overloaded)

##### `withCount(relation: string): this` [line 1272]
##### `withCount(...relations: string[]): this` [line 1287]
- Add count of related models as virtual field(s)

##### `has(relation: string): this` [line 1301]
##### `has(relation: string, operator: string, count: number): this` [line 1320]
- Filter results to only those that have related models (optionally comparing count)

##### `whereHas(relation: string, callback: (query: QueryBuilderContract) => void): this` [line 1346]
- Filter results that have related models matching conditions

##### `doesntHave(relation: string): this` [line 1360]
- Filter results that don't have any related models

##### `whereDoesntHave(relation: string, callback: (query: QueryBuilderContract) => void): this` [line 1379]
- Filter results that don't have related models matching conditions

#### Ordering
##### `orderBy(field: string, direction?: OrderDirection): this` [line 1392]
##### `orderBy(fields: Record<string, OrderDirection>): this` [line 1393]
- Order results by field(s) (overloaded)

##### `orderByDesc(field: string): this` [line 1401]
- Order results descending by specified field

##### `orderByRaw(expression: RawExpression, bindings?: unknown[]): this` [line 1409]
- Order results using a raw expression

##### `orderByRandom(limit: number): this` [line 1417]
- Order results randomly

##### `latest(column?: string): Promise<T[]>` [line 1427]
- Order by the latest records using a timestamp column (defaults to 'createdAt'); NOTE: returns Promise<T[]> unlike sibling `oldest` which returns `this`

##### `oldest(column?: string): this` [line 1436]
- Order by the oldest records using a timestamp column (ascending)

#### Limiting / Pagination
##### `limit(value: number): this` [line 1448]
- Limit the number of results

##### `skip(value: number): this` [line 1456]
- Skip the specified number of results (alias for offset)

##### `offset(value: number): this` [line 1464]
- Skip the specified number of results

##### `take(value: number): this` [line 1472]
- Alias for limit() — take the first N results

##### `cursor(after?: unknown, before?: unknown): this` [line 1480]
- Apply cursor pagination hints

#### Grouping / Aggregation
##### `groupBy(fields: GroupByInput): this` [line 1493]
##### `groupBy(fields: GroupByInput, aggregates: Record<string, RawExpression>): this` [line 1530]
- Group results by fields; optionally with aggregate operations (overloaded)

##### `groupByRaw(expression: RawExpression, bindings?: unknown[]): this` [line 1538]
- Apply raw grouping expressions

##### `having(field: string, value: unknown): this` [line 1546]
##### `having(field: string, operator: WhereOperator, value: unknown): this` [line 1547]
##### `having(condition: HavingInput): this` [line 1548]
- Apply having clause to aggregated results (overloaded)

##### `havingRaw(expression: RawExpression, bindings?: unknown[]): this` [line 1556]
- Apply raw having clause

#### Utility / Extensions
##### `raw(builder: (native: unknown) => unknown): this` [line 1588]
- Add driver-specific raw modifications to the query

##### `extend<R>(extension: string, ...args: unknown[]): R` [line 1596]
- Extend the query builder with driver-specific extensions

##### `clone(): this` [line 1605]
- Clone the current query builder instance

##### `tap(callback: (builder: this) => void): this` [line 1614]
- Tap into the query builder for debugging or side effects

##### `when<V>(condition: V | boolean | (() => boolean), callback: (builder: this, value: V) => void, otherwise?: (builder: this) => void): this` [lines 1622-1626]
- Conditionally apply a callback to the query

#### Execution Methods
##### `get<Output = T>(): Promise<Output[]>` [line 1638]
- Execute the query and return all matching records

##### `first<Output = T>(): Promise<Output | null>` [line 1646]
- Execute the query and return the first matching record

##### `firstOrFail<Output = T>(): Promise<Output>` [line 1655]
- Execute the query and return the first matching record or throw

##### `last<Output = T>(field?: string): Promise<Output | null>` [line 1663]
- Configure query to retrieve the last record

##### `count(): Promise<number>` [line 1671]
- Count the records matching the query

##### `sum(field: string): Promise<number>` [line 1679]
- Aggregate sum for the given field

##### `avg(field: string): Promise<number>` [line 1687]
- Aggregate average for the given field

##### `min(field: string): Promise<number>` [line 1695]
- Aggregate minimum for the given field

##### `max(field: string): Promise<number>` [line 1703]
- Aggregate maximum for the given field

##### `distinct<T = unknown>(field: string): Promise<T[]>` [line 1713]
- Retrieve distinct values for a field

##### `pluck(field: string): Promise<unknown[]>` [line 1721]
- Retrieve a list of values for the given field

##### `value<T = unknown>(field: string): Promise<T | null>` [line 1729]
- Retrieve a single scalar value for the given field from the first record

##### `exists(): Promise<boolean>` [line 1737]
- Determine if any record matches the current query

##### `notExists(): Promise<boolean>` [line 1745]
- Determine if no records match the current query

##### `countDistinct(field: string): Promise<number>` [line 1753]
- Count distinct values for the given field

##### `increment(field: string, amount?: number): Promise<number>` [line 1762]
- Increment a field's value by the given amount (single record)

##### `decrement(field: string, amount?: number): Promise<number>` [line 1771]
- Decrement a field's value by the given amount (single record)

##### `incrementMany(field: string, amount?: number): Promise<number>` [line 1779]
- Increment a field's value for all matching documents

##### `decrementMany(field: string, amount?: number): Promise<number>` [line 1787]
- Decrement a field's value for all matching documents

#### Chunking / Pagination
##### `chunk(size: number, callback: ChunkCallback<T>): Promise<void>` [line 1803]
- Iterate through results in chunks, executing callback for each chunk

##### `paginate(options: PaginationOptions): Promise<PaginationResult<T>>` [line 1812]
- Paginate results with standard page/limit pagination

##### `cursorPaginate(options: CursorPaginationOptions): Promise<CursorPaginationResult<T>>` [line 1821]
- Paginate using cursor-based strategy

#### Inspection / Debugging
##### `parse(): DriverQuery` [line 1841]
- Return the driver-native query representation without executing it

##### `pretty(): string` [line 1847]
- Returns a formatted string representation of the query pipeline / SQL string

##### `explain(): Promise<unknown>` [line 1855]
- Ask the underlying driver to explain the query execution plan

##### `similarTo(column: string, embedding: number[], alias?: string): this` [line 1886]
- Nearest-neighbour vector similarity search; adds score projection and index-friendly order-by
