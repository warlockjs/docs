# query-builder.contract
source: contracts/query-builder.contract.ts
description: Defines QueryBuilderContract and all supporting types for the fluent, database-agnostic query builder API.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `GlobalScopeDefinition`, `LocalScopeCallback` from `../model/model`

## Exports
- `OrderDirection` — "asc" | "desc"  [line 4]
- `JoinOptions` — join clause descriptor  [lines 9-30]
- `PaginationResult<T>` — page/limit pagination output  [lines 35-43]
- `CursorPaginationResult<T>` — cursor pagination output  [lines 48-56]
- `ChunkCallback<T>` — chunk iteration callback  [lines 61-64]
- `CursorPaginationOptions` — cursor pagination input  [lines 69-74]
- `PaginationOptions` — standard pagination input  [lines 79-82]
- `WhereOperator` — supported comparison operator union  [lines 87-105]
- `WhereObject` — object-based predicate  [line 111]
- `WhereCallback<T>` — callback-based predicate  [line 116]
- `GroupByInput` — groupBy field payload  [lines 121-125]
- `HavingInput` — having clause payload  [lines 130-133]
- `RawExpression` — native expression placeholder  [line 138]
- `DriverQuery` — parsed query representation  [lines 157-166]
- `QueryBuilderContract<T>` — full fluent query builder interface  [lines 175-1887]

## Types / Interfaces

### `QueryBuilderContract<T>` [lines 175-1887]
Fluent, chainable, database-agnostic query builder interface.

**Fields**
- `table: string` [line 179]
- `pendingGlobalScopes?: Map<string, GlobalScopeDefinition>` [line 215]
- `availableLocalScopes?: Map<string, LocalScopeCallback>` [line 221]
- `disabledGlobalScopes?: Set<string>` [line 226]
- `scopesApplied?: boolean` [line 231]
- `eagerLoadRelations?: Map<string, boolean | ((query) => void)>` [line 243]
- `countRelations?: string[]` [line 248]
- `joinRelations?: Map<string, { alias; type; model?; ... }>` [lines 254-268]
- `relationDefinitions?: Record<string, any>` [line 274]
- `modelClass?: any` [line 279]

**Lifecycle hooks**
- `hydrate(callback): this` [line 184]
- `onFetching(callback): () => void` [line 191]
- `onHydrating(callback): () => void` [line 198]
- `onFetched(callback): () => void` [line 205]

**Scopes**
- `joinWith(...relations): this` [line 306]
- `withoutGlobalScope(...scopeNames): this` [line 323]
- `withoutGlobalScopes(): this` [line 336]
- `scope(scopeName, ...args): this` [line 354] — throws: if scope not found

**Where clauses**
- `where(field, value): this` / `where(field, op, value): this` / `where(obj): this` / `where(cb): this` [lines 376-379]
- `whereRaw(expression, bindings?): this` [line 388]
- `orWhereRaw(expression, bindings?): this` [line 396]
- `whereColumn(first, op, second): this` [line 404]
- `orWhereColumn(first, op, second): this` [line 412]
- `whereColumns(comparisons): this` [line 423]
- `whereBetweenColumns(field, lower, upper): this` [line 431]
- `whereDate(field, value): this` [line 439]
- `whereDateEquals(field, value): this` [line 444]
- `whereDateBefore(field, value): this` [line 449]
- `whereDateAfter(field, value): this` [line 454]
- `whereTime(field, value): this` [line 462]
- `whereDay(field, value): this` [line 467]
- `whereMonth(field, value): this` [line 472]
- `whereYear(field, value): this` [line 477]
- `whereJsonContains(path, value): this` [line 482]
- `whereJsonDoesntContain(path, value): this` [line 487]
- `whereJsonContainsKey(path): this` [line 492]
- `whereJsonLength(path, op, value): this` [line 500]
- `whereJsonIsArray(path): this` [line 505]
- `whereJsonIsObject(path): this` [line 510]
- `whereArrayLength(field, op, value): this` [line 518]
- `whereId(value): this` [line 523]
- `whereIds(values): this` [line 528]
- `whereUuid(value): this` [line 533]
- `whereUlid(value): this` [line 538]
- `whereFullText(fields, query): this` [line 543]
- `orWhereFullText(fields, query): this` [line 548]
- `whereSearch(field, query): this` [line 553]
- `whereNot(callback): this` [line 558]
- `orWhereNot(callback): this` [line 563]
- `whereExists(callback): this` / `whereExists(field): this` [lines 572, 712]
- `whereNotExists(callback): this` / `whereNotExists(field): this` [lines 581, 720]
- `orWhere(field, value): this` / overloads [lines 589-592]
- `whereIn(field, values): this` [line 600]
- `whereNotIn(field, values): this` [line 608]
- `whereNull(field): this` [line 616]
- `whereNotNull(field): this` [line 624]
- `whereBetween(field, range): this` [line 632]
- `whereNotBetween(field, range): this` [line 640]
- `whereLike(field, pattern): this` [line 648]
- `whereNotLike(field, pattern): this` [line 656]
- `whereStartsWith(field, value): this` [line 664]
- `whereNotStartsWith(field, value): this` [line 672]
- `whereEndsWith(field, value): this` [line 680]
- `whereNotEndsWith(field, value): this` [line 688]
- `whereDateBetween(field, range): this` [line 696]
- `whereDateNotBetween(field, range): this` [line 704]
- `whereSize(field, size): this` / `whereSize(field, op, size): this` [lines 732-733]
- `textSearch(query, filters?): this` [line 741]
- `whereArrayContains(field, value, key?): this` [line 754]
- `whereArrayNotContains(field, value, key?): this` [line 762]
- `whereArrayHasOrEmpty(field, value, key?): this` [line 770]
- `whereArrayNotHaveOrEmpty(field, value, key?): this` [line 778]

**Select / Projection**
- `select(fields): this` / overloads [lines 790-793]
- `selectAs(field, alias): this` [line 801]
- `selectRaw(expression, bindings?): this` [line 809]
- `selectRawMany(definitions): this` [lines 820-826]
- `selectSub(expression, alias): this` [line 834]
- `addSelectSub(expression, alias): this` [line 839]
- `selectAggregate(field, aggregate, alias): this` [lines 847-851]
- `selectExists(field, alias): this` [line 859]
- `selectCount(field, alias): this` [line 867]
- `selectCase(cases, otherwise, alias): this` [lines 882-886]
- `selectWhen(condition, thenValue, elseValue, alias): this` [lines 894-899]
- `selectDriverProjection(callback): this` [line 909]
- `selectJson(path, alias?): this` [line 917]
- `selectJsonRaw(path, expression, alias): this` [line 925]
- `deselectJson(path): this` [line 930]
- `selectConcat(fields, alias): this` [line 938]
- `selectCoalesce(fields, alias): this` [line 946]
- `selectWindow(spec): this` [line 958]
- `deselect(fields): this` [line 966]
- `clearSelect(): this` [line 971]
- `selectAll(): this` [line 976]
- `selectDefault(): this` [line 981]
- `distinctValues(fields?): this` [line 990]
- `addSelect(fields): this` [line 998]

**Joins**
- `join(table, localField, foreignField): this` / `join(options): this` [lines 1032-1033]
- `leftJoin(table, localField, foreignField): this` / `leftJoin(options): this` [lines 1055-1056]
- `rightJoin(table, localField, foreignField): this` / `rightJoin(options): this` [lines 1078-1079]
- `innerJoin(table, localField, foreignField): this` / `innerJoin(options): this` [lines 1101-1102]
- `fullJoin(table, localField, foreignField): this` / `fullJoin(options): this` [lines 1123-1124]
- `crossJoin(table): this` [line 1144]
- `joinRaw(expression, bindings?): this` [line 1174]

**Eager loading / relations**
- `with(relation): this` / overloads [lines 1202-1256]
- `withCount(relation): this` / `withCount(...relations): this` [lines 1272, 1287]
- `has(relation): this` / `has(relation, op, count): this` [lines 1301, 1320]
- `whereHas(relation, callback): this` [line 1346]
- `doesntHave(relation): this` [line 1360]
- `whereDoesntHave(relation, callback): this` [line 1379]

**Ordering**
- `orderBy(field, direction?): this` / `orderBy(fields): this` [lines 1392-1393]
- `orderByDesc(field): this` [line 1401]
- `orderByRaw(expression, bindings?): this` [line 1409]
- `orderByRandom(limit): this` [line 1417]
- `latest(column?): Promise<T[]>` [line 1427]
- `oldest(column?): this` [line 1436]

**Limiting / Pagination**
- `limit(value): this` [line 1448]
- `skip(value): this` [line 1456]
- `offset(value): this` [line 1464]
- `take(value): this` [line 1472]
- `cursor(after?, before?): this` [line 1480]

**Grouping / Aggregation**
- `groupBy(fields): this` / `groupBy(fields, aggregates): this` [lines 1493, 1530]
- `groupByRaw(expression, bindings?): this` [line 1538]
- `having(field, value): this` / overloads [lines 1546-1548]
- `havingRaw(expression, bindings?): this` [line 1556]

**Utility**
- `raw(builder): this` [line 1588]
- `extend<R>(extension, ...args): R` [line 1596]
- `clone(): this` [line 1605]
- `tap(callback): this` [line 1614]
- `when<V>(condition, callback, otherwise?): this` [lines 1622-1626]

**Execution**
- `get<Output>(): Promise<Output[]>` [line 1638]
- `first<Output>(): Promise<Output | null>` [line 1646]
- `firstOrFail<Output>(): Promise<Output>` [line 1655] — throws: if no record found
- `last<Output>(field?): Promise<Output | null>` [line 1663]
- `count(): Promise<number>` [line 1671]
- `sum(field): Promise<number>` [line 1679]
- `avg(field): Promise<number>` [line 1687]
- `min(field): Promise<number>` [line 1695]
- `max(field): Promise<number>` [line 1703]
- `distinct<T>(field): Promise<T[]>` [line 1713]
- `pluck(field): Promise<unknown[]>` [line 1721]
- `value<T>(field): Promise<T | null>` [line 1729]
- `exists(): Promise<boolean>` [line 1737]
- `notExists(): Promise<boolean>` [line 1745]
- `countDistinct(field): Promise<number>` [line 1753]
- `increment(field, amount?): Promise<number>` [line 1762] — returns new value
- `decrement(field, amount?): Promise<number>` [line 1771] — returns new value
- `incrementMany(field, amount?): Promise<number>` [line 1779] — returns modified count
- `decrementMany(field, amount?): Promise<number>` [line 1787] — returns modified count
- `chunk(size, callback): Promise<void>` [line 1803]
- `paginate(options): Promise<PaginationResult<T>>` [line 1812]
- `cursorPaginate(options): Promise<CursorPaginationResult<T>>` [line 1821]

**Inspection**
- `parse(): DriverQuery` [line 1841]
- `pretty(): string` [line 1847]
- `explain(): Promise<unknown>` [line 1855]
- `similarTo(column, embedding, alias?): this` [line 1886]
