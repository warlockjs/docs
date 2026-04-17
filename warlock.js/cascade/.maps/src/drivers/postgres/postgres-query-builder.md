# postgres-query-builder
source: drivers/postgres/postgres-query-builder.ts
description: PostgreSQL query builder with execution, hydration, and relation loading.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `GenericObject` from `@mongez/reinforcements`
- `ChunkCallback, CursorPaginationOptions, CursorPaginationResult, DriverQuery, PaginationOptions, PaginationResult, QueryBuilderContract` from `../../contracts/query-builder.contract`
- `DataSource` from `../../data-source/data-source`
- `dataSourceRegistry` from `../../data-source/data-source-registry`
- `GlobalScopeDefinition` from `../../model/model`
- `getModelFromRegistry, resolveModelClass` from `../../model/register-model`
- `QueryBuilder, Op` from `../../query-builder/query-builder`
- `PostgresDriver` from `./postgres-driver`
- `PostgresQueryParser, PostgresParserOperation` from `./postgres-query-parser`

## Exports
- `PostgresQueryBuilder` — PG query builder class  [lines 79-1159]

## Classes
### PostgresQueryBuilder<T>  [lines 79-1159] — PG-specific query execution and hydration
extends: QueryBuilder<T>
implements: QueryBuilderContract<T>

fields:
- `readonly dataSource: DataSource`  [line 88]
- `hydrateCallback?: (data: unknown, index: number) => unknown`  [line 91]
- `joinRelations: Map<string, JoinRelationConfig>`  [line 106]
- `readonly table: string` (constructor param)  [line 117]

methods:
- `constructor(table: string, dataSource?: DataSource)`  [lines 116-122] — Initialise with table and data source
  - side-effects: reads dataSourceRegistry when dataSource omitted
- `clone(): this`  [lines 136-155] — Deep-copy builder state
- `raw(callback: (operations: Op[]) => void): this`  [lines 168-171] — Direct operations array access
- `override distinctValues(fields?: string | string[]): this`  [lines 181-190] — DISTINCT with auto-select
- `similarTo(column: string, embedding: number[], alias?: string): this`  [lines 211-238] — pgvector cosine similarity ordering
- `hydrate(callback: (data: unknown, index: number) => unknown): this`  [lines 241-244] — Set row hydration callback
- `onFetching(callback: (query: this) => void | Promise<void>): () => void`  [lines 247-252] — Register pre-fetch callback
- `onHydrating(callback): () => void`  [lines 255-262] — Register pre-hydration callback
- `onFetched(callback): () => void`  [lines 265-272] — Register post-fetch callback
- `whereArrayContains(field: string, value: unknown, key?: string): this`  [lines 310-324] — Array/JSONB contains predicate
- `whereArrayNotContains(field: string, value: unknown, key?: string): this`  [lines 327-341] — Array/JSONB not-contains predicate
- `whereArrayHasOrEmpty(field: string, value: unknown, key?: string): this`  [lines 344-358] — Array contains or empty
- `whereArrayNotHaveOrEmpty(field: string, value: unknown, key?: string): this`  [lines 361-375] — Array not-contains or empty
- `override joinWith(...args: unknown[]): this`  [lines 395-507] — Register join relations with constraints
  - throws: `Error` — when relation/model not found
- `async get<TResult=T>(): Promise<TResult[]>`  [lines 524-567] — Execute query and return rows
  - throws: re-throws driver query errors
  - side-effects: clears operations, runs callbacks, queries DB
- `async first<TResult=T>(): Promise<TResult | null>`  [lines 570-573] — Fetch first row or null
- `async last<TResult=T>(): Promise<TResult | null>`  [lines 576-579] — Fetch last row by id desc
- `async random<TResult=T>(limit?: number): Promise<TResult[]>`  [lines 582-586] — Order by RANDOM()
- `async firstOrFail<TResult=T>(): Promise<TResult>`  [lines 589-593] — First row or throw
  - throws: `Error` — "No records found"
- `async firstOr<TResult=T>(callback): Promise<TResult>`  [lines 596-599] — First or callback fallback
- `async firstOrNull<TResult=T>(): Promise<TResult | null>`  [lines 602-604] — First or null alias
- `async firstOrNew<TResult=T>(defaults: GenericObject): Promise<TResult>`  [lines 607-610] — First or defaults fallback
- `async find<TResult=T>(id: number | string): Promise<TResult | null>`  [lines 613-615] — Lookup by id
- `async count(): Promise<number>`  [lines 618-629] — Row count with where filters
- `async sum(field: string): Promise<number>`  [lines 632-636] — SUM aggregate
- `async avg(field: string): Promise<number>`  [lines 639-643] — AVG aggregate
- `async min(field: string): Promise<number>`  [lines 646-650] — MIN aggregate
- `async max(field: string): Promise<number>`  [lines 653-657] — MAX aggregate
- `async distinct<TResult>(field: string): Promise<TResult[]>`  [lines 660-664] — Distinct field values
- `async pluck(field: string): Promise<unknown[]>`  [lines 667-670] — Single-column value list
- `async value<TResult>(field: string): Promise<TResult | null>`  [lines 673-676] — Single scalar value
- `async exists(): Promise<boolean>`  [lines 679-682] — Check row existence
- `async notExists(): Promise<boolean>`  [lines 685-687] — Inverse of exists
- `async countDistinct(field: string): Promise<number>`  [lines 690-695] — COUNT DISTINCT aggregate
- `async latest(column?: string): Promise<T[]>`  [lines 700-702] — Latest records ordered desc
- `async increment(field: string, amount?: number): Promise<number>`  [lines 707-720] — Increment, return new value
  - side-effects: UPDATE on DB
- `async decrement(field: string, amount?: number): Promise<number>`  [lines 723-725] — Decrement, return new value
- `async incrementMany(field: string, amount?: number): Promise<number>`  [lines 728-737] — Bulk increment rows
  - side-effects: UPDATE on DB
- `async decrementMany(field: string, amount?: number): Promise<number>`  [lines 740-742] — Bulk decrement rows
- `async chunk(size: number, callback: ChunkCallback<T>): Promise<void>`  [lines 752-769] — Process rows in chunks
- `async paginate(options?: PaginationOptions): Promise<PaginationResult<T>>`  [lines 772-791] — Offset pagination
- `cursor(after?: unknown, before?: unknown): this`  [lines 801-804] — Record cursor hint
- `async cursorPaginate(options?: CursorPaginationOptions): Promise<CursorPaginationResult<T>>`  [lines 807-853] — Cursor-based pagination
- `async delete(): Promise<number>`  [lines 858-864] — Delete filtered rows
  - side-effects: DELETE on DB
- `async deleteOne(): Promise<number>`  [lines 867-869] — Delete single row
- `async update(fields: Record<string, unknown>): Promise<number>`  [lines 872-876] — Update filtered rows
  - side-effects: UPDATE on DB
- `async unset(...fields: string[]): Promise<number>`  [lines 879-885] — Remove fields from rows
  - side-effects: UPDATE on DB
- `parse(): DriverQuery`  [lines 890-897] — Compile SQL without execution
- `pretty(): string`  [lines 900-903] — Formatted SQL with bindings
- `async explain(): Promise<unknown>`  [lines 906-913] — EXPLAIN ANALYZE plan
- `extend<R>(extension: string, ..._args: unknown[]): R`  [lines 918-920] — Not supported escape hatch
  - throws: `Error` — always throws unsupported
- `async pluckOne<TResult>(field: string): Promise<TResult[]>`  [lines 923-926] — Scalar values alias for pluck
