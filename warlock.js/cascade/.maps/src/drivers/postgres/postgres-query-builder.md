# postgres-query-builder
source: drivers/postgres/postgres-query-builder.ts
description: PostgreSQL-specific query builder with execution, hydration, scope management, and relation JOIN pipeline.
complexity: complex
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-opus-4-7
last-updated-by: claude-opus-4-7

## Imports
- `GenericObject` from `@mongez/reinforcements`
- `ChunkCallback`, `CursorPaginationOptions`, `CursorPaginationResult`, `DriverQuery`, `PaginationOptions`, `PaginationResult`, `QueryBuilderContract` from `../../contracts/query-builder.contract`
- `DataSource` from `../../data-source/data-source`
- `dataSourceRegistry` from `../../data-source/data-source-registry`
- `GlobalScopeDefinition` from `../../model/model`
- `getModelFromRegistry`, `resolveModelClass` from `../../model/register-model`
- `QueryBuilder`, `Op` from `../../query-builder/query-builder`
- `PostgresDriver` from `./postgres-driver`
- `PostgresQueryParser`, `PostgresParserOperation` from `./postgres-query-parser`

## Exports
- `PostgresQueryBuilder` — PostgreSQL query builder extending base QueryBuilder with SQL execution and relation hydration.  [lines 79-1159]

## Classes / Functions / Types / Constants

### `PostgresQueryBuilder<T = unknown>` [lines 79-1159]
- Extends `QueryBuilder<T>` and implements `QueryBuilderContract<T>`.
- Collects query operations (via base class) and delegates SQL generation to `PostgresQueryParser`.
- Owns execution, hydration, relation loading, and scope application.
- Public fields: `dataSource: DataSource` (readonly), `hydrateCallback?: (data: unknown, index: number) => unknown`, `joinRelations: Map<string, JoinRelationConfig>`, `table: string` (readonly constructor param).

#### `constructor(table: string, dataSource?: DataSource)` [lines 116-122]
- Constructs the builder with a target table; resolves data source from registry default when omitted.

#### `clone(): this` [lines 136-155]
- Returns a deep copy of the builder including base-class state, scopes, relation definitions, and PG-specific state (hydrateCallback, joinRelations).

#### `raw(callback: (operations: Op[]) => void): this` [lines 168-171]
- Native-query escape hatch exposing the internal `operations[]` array for direct manipulation.

#### `distinctValues(fields?: string | string[]): this` [lines 181-190]
- Override of base method. Records the DISTINCT flag and auto-selects the given field(s) because PostgreSQL `DISTINCT ON (col)` requires the column in SELECT.

#### `similarTo(column: string, embedding: number[], alias = "score"): this` [lines 211-238]
- Nearest-neighbour vector similarity search via pgvector cosine distance. Adds `table.*`, the similarity score as a raw select, and an ORDER BY raw expression so the IVFFlat/HNSW index is used.

#### `hydrate(callback: (data: unknown, index: number) => unknown): this` [lines 241-244]
- Sets the hydration callback transforming each result row.

#### `onFetching(callback: (query: this) => void | Promise<void>): () => void` [lines 247-252]
- Registers a callback invoked before query execution; returns an unregister function.

#### `onHydrating(callback: (records: unknown[], context: unknown) => void | Promise<void>): () => void` [lines 255-262]
- Registers a callback invoked after fetch but before hydration; returns an unregister function.

#### `onFetched(callback: (records: unknown[], context: unknown) => void | Promise<void>): () => void` [lines 265-272]
- Registers a callback invoked after fetch and hydration; returns an unregister function.

#### `whereArrayContains(field: string, value: unknown, key?: string): this` [lines 310-324]
- Adds a `whereRaw` op checking whether a PG array/jsonb field contains the value (or an object with key).

#### `whereArrayNotContains(field: string, value: unknown, key?: string): this` [lines 327-341]
- Adds a `whereRaw` op for the negated containment check.

#### `whereArrayHasOrEmpty(field: string, value: unknown, key?: string): this` [lines 344-358]
- Adds a `whereRaw` op matching rows whose array field contains the value or is empty/null.

#### `whereArrayNotHaveOrEmpty(field: string, value: unknown, key?: string): this` [lines 361-375]
- Adds a `whereRaw` op matching rows whose array field does not contain the value or is empty/null.

#### `joinWith(...args: unknown[]): this` [lines 395-507]
- Override. Loads relations via SQL JOINs (single query) with optional per-relation constraints. Supports string, array, and object forms, including `"rel:col1,col2"` shorthand and nested dot paths. Populates `joinRelations` Map with resolved definitions.

#### `get<TResult = T>(): Promise<TResult[]>` [lines 524-567]
- Executes the query: applies scopes, processes joinWith ops, applies join relations, runs fetching/hydrating/fetched callbacks, parses SQL, runs it via the driver, extracts and attaches joined relation data. Clears operations at the end.

#### `first<TResult = T>(): Promise<TResult | null>` [lines 570-573]
- Returns the first result or null.

#### `last<TResult = T>(): Promise<TResult | null>` [lines 576-579]
- Returns the last result ordered by `id desc` or null.

#### `random<TResult = T>(limit?: number): Promise<TResult[]>` [lines 582-586]
- Adds `ORDER BY RANDOM()` (and optional limit) then gets results.

#### `firstOrFail<TResult = T>(): Promise<TResult>` [lines 589-593]
- Returns first result or throws `Error("No records found")`.

#### `firstOr<TResult = T>(callback: () => TResult | Promise<TResult>): Promise<TResult>` [lines 596-599]
- Returns first result or awaits the callback fallback.

#### `firstOrNull<TResult = T>(): Promise<TResult | null>` [lines 602-604]
- Alias for `first()`.

#### `firstOrNew<TResult = T>(defaults: GenericObject): Promise<TResult>` [lines 607-610]
- Returns first result or the defaults cast to `TResult`.

#### `find<TResult = T>(id: number | string): Promise<TResult | null>` [lines 613-615]
- Shortcut for `where("id", id).first()`.

#### `count(): Promise<number>` [lines 618-629]
- Runs a COUNT(*) query preserving only where/join operations; parses `count` string to int.

#### `sum(field: string): Promise<number>` [lines 632-636]
- Executes `SUM(field) as sum` and returns the parsed float.

#### `avg(field: string): Promise<number>` [lines 639-643]
- Executes `AVG(field) as avg` and returns the parsed float.

#### `min(field: string): Promise<number>` [lines 646-650]
- Executes `MIN(field) as min` and returns the parsed float.

#### `max(field: string): Promise<number>` [lines 653-657]
- Executes `MAX(field) as max` and returns the parsed float.

#### `distinct<TResult = unknown>(field: string): Promise<TResult[]>` [lines 660-664]
- Marks field as DISTINCT, executes query, and returns the field values as an array.

#### `pluck(field: string): Promise<unknown[]>` [lines 667-670]
- Selects a single field and returns the array of its values.

#### `value<TResult = unknown>(field: string): Promise<TResult | null>` [lines 673-676]
- Returns the scalar value of one field from the first row, or null.

#### `exists(): Promise<boolean>` [lines 679-682]
- Returns true if `limit(1).count()` > 0.

#### `notExists(): Promise<boolean>` [lines 685-687]
- Returns the negation of `exists()`.

#### `countDistinct(field: string): Promise<number>` [lines 690-695]
- Executes `COUNT(DISTINCT field)` and returns the parsed int.

#### `latest(column = "createdAt"): Promise<T[]>` [lines 700-702]
- Orders by column desc then returns all matching rows.

#### `increment(field: string, amount = 1): Promise<number>` [lines 707-720]
- Runs UPDATE with `COALESCE(field,0)+amount` and RETURNING; returns the new value of the first row or 0.

#### `decrement(field: string, amount = 1): Promise<number>` [lines 723-725]
- Delegates to `increment` with negative amount.

#### `incrementMany(field: string, amount = 1): Promise<number>` [lines 728-737]
- UPDATE with COALESCE increment across all matches; returns the affected row count.

#### `decrementMany(field: string, amount = 1): Promise<number>` [lines 740-742]
- Delegates to `incrementMany` with negative amount.

#### `chunk(size: number, callback: ChunkCallback<T>): Promise<void>` [lines 752-769]
- Processes results in memory-efficient chunks; stops when callback returns `false` or no more rows remain.

#### `paginate(options?: PaginationOptions): Promise<PaginationResult<T>>` [lines 772-791]
- Page-based pagination. Returns `{ data, pagination: { total, page, limit, pages } }`.

#### `cursor(after?: unknown, before?: unknown): this` [lines 801-804]
- Records a `cursor` op to be consumed by `cursorPaginate()` when options omit cursor.

#### `cursorPaginate(options?: CursorPaginationOptions): Promise<CursorPaginationResult<T>>` [lines 807-853]
- Cursor-based pagination. Applies a where/orderBy based on direction, fetches `limit+1` rows to detect more, computes `nextCursor`, `prevCursor`, `hasMore`, `hasPrev`.

#### `delete(): Promise<number>` [lines 858-864]
- Executes DELETE using built filter SQL; returns rowCount.

#### `deleteOne(): Promise<number>` [lines 867-869]
- Limits to one and deletes.

#### `update(fields: Record<string, unknown>): Promise<number>` [lines 872-876]
- Delegates to `driver.updateMany` with `$set`; returns modifiedCount.

#### `unset(...fields: string[]): Promise<number>` [lines 879-885]
- Delegates to `driver.updateMany` with `$unset`; returns modifiedCount.

#### `parse(): DriverQuery` [lines 890-897]
- Applies pending scopes and returns `{ query, bindings }` without executing.

#### `pretty(): string` [lines 900-903]
- Returns formatted SQL with bindings appended as a `-- Bindings: ...` comment.

#### `explain(): Promise<unknown>` [lines 906-913]
- Runs `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` on the current query and returns the result rows.

#### `extend<R>(extension: string, ..._args: unknown[]): R` [lines 918-920]
- Throws — driver-specific extensions are not supported by this builder.

#### `pluckOne<TResult = unknown>(field: string): Promise<TResult[]>` [lines 923-926]
- Alias for `pluck` typed via generic; returns the array of field values.
