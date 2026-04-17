# query-builder
source: query-builder/query-builder.ts
description: Driver-agnostic fluent query builder recording operations for later parser consumption.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `GroupByInput`, `HavingInput`, `JoinOptions`, `OrderDirection`, `RawExpression`, `WhereCallback`, `WhereObject`, `WhereOperator` from `../contracts/query-builder.contract`

## Exports
- `Op` — recorded operation type  [lines 49-52]
- `JoinWithConstraint` — joinWith constraint union  [line 64]
- `QueryBuilder` — main fluent builder class  [lines 93-1357]

## Types
- `Op = { readonly type, readonly data }`  [lines 49-52] — operation record shape
- `JoinWithConstraint = string | ((q: QueryBuilder) => void)`  [line 64] — joinWith argument type

## Classes
### QueryBuilder<T = unknown>  [lines 93-1357] — pure driver-agnostic operation recorder

fields:
- `operations: Op[]`  [line 99]
- `protected opIndex: Map<string, number[]>`  [line 110]
- `pendingGlobalScopes?: Map<string, any>`  [line 117]
- `availableLocalScopes?: Map<string, (...args: any[]) => void>`  [line 119]
- `disabledGlobalScopes: Set<string>`  [line 121]
- `scopesApplied: boolean`  [line 123]
- `eagerLoadRelations: Map<string, boolean | ((query: any) => void)>`  [line 130]
- `countRelations: string[]`  [line 132]
- `relationDefinitions?: Record<string, any>`  [line 134]
- `modelClass?: any`  [line 136]

methods:
- `protected addOperation(type, data): void`  [lines 146-155] — append op, update index — side-effects: mutates operations/opIndex
- `getOps(...types: string[]): Op[]`  [lines 164-175] — return ops by type in order
- `rebuildIndex(): void`  [lines 183-194] — rebuild opIndex after mutation — side-effects: resets opIndex
- `protected subQuery(): QueryBuilder`  [lines 209-211] — factory for nested sub-builders
- `clone(): this`  [lines 219-232] — shallow clone with state copy
- `withoutGlobalScope(...scopeNames): this`  [lines 239-242] — disable named global scopes
- `withoutGlobalScopes(): this`  [lines 245-248] — disable all pending global scopes
- `scope(scopeName, ...args): this`  [lines 254-262] — apply registered local scope
  - throws: `Error` — when no local scopes or scope not found
- `where(...): this`  [lines 277-296] — add AND where clause (overloaded)
- `orWhere(...): this`  [lines 304-323] — add OR where clause (overloaded)
- `whereRaw(expression, bindings?): this`  [lines 332-335] — raw AND where expression
- `orWhereRaw(expression, bindings?): this`  [lines 338-341] — raw OR where expression
- `whereColumn(first, operator, second): this`  [lines 351-354] — AND column comparison
- `orWhereColumn(first, operator, second): this`  [lines 357-360] — OR column comparison
- `whereColumns(comparisons): this`  [lines 363-370] — multiple column comparisons
- `whereBetweenColumns(field, lowerColumn, upperColumn): this`  [lines 377-380] — between two columns
- `whereIn(field, values): this`  [lines 387-390]
- `whereNotIn(field, values): this`  [lines 393-396]
- `whereNull(field): this`  [lines 399-402]
- `whereNotNull(field): this`  [lines 405-408]
- `whereBetween(field, range): this`  [lines 411-414]
- `whereNotBetween(field, range): this`  [lines 417-420]
- `whereLike(field, pattern): this`  [lines 430-434]
- `whereNotLike(field, pattern): this`  [lines 437-441]
- `whereStartsWith(field, value): this`  [lines 444-446]
- `whereNotStartsWith(field, value): this`  [lines 449-451]
- `whereEndsWith(field, value): this`  [lines 454-456]
- `whereNotEndsWith(field, value): this`  [lines 459-461]
- `whereDate(field, value): this`  [lines 471-474]
- `whereDateEquals(field, value): this`  [lines 477-479]
- `whereDateBefore(field, value): this`  [lines 482-485]
- `whereDateAfter(field, value): this`  [lines 488-491]
- `whereDateBetween(field, range): this`  [lines 494-497]
- `whereDateNotBetween(field, range): this`  [lines 500-503]
- `whereTime(field, value): this`  [lines 510-516]
- `whereDay(field, value): this`  [lines 523-529]
- `whereMonth(field, value): this`  [lines 532-538]
- `whereYear(field, value): this`  [lines 541-547]
- `whereJsonContains(path, value): this`  [lines 557-560]
- `whereJsonDoesntContain(path, value): this`  [lines 563-566]
- `whereJsonContainsKey(path): this`  [lines 572-575]
- `whereJsonLength(path, operator, value): this`  [lines 581-587]
- `whereJsonIsArray(path): this`  [lines 590-596]
- `whereJsonIsObject(path): this`  [lines 599-605]
- `whereArrayLength(field, operator, value): this`  [lines 611-617]
- `whereId(value): this`  [lines 624-626]
- `whereIds(values): this`  [lines 629-631]
- `whereUuid(value): this`  [lines 634-636]
- `whereUlid(value): this`  [lines 639-641]
- `whereFullText(fields, query): this`  [lines 647-653]
- `orWhereFullText(fields, query): this`  [lines 656-658]
- `whereSearch(field, query): this`  [lines 661-663]
- `textSearch(query, filters?): this`  [lines 669-674]
- `whereExists(...): this`  [lines 687-698] — subquery exists or not-null
- `whereNotExists(...): this`  [lines 703-714] — subquery not-exists or is-null
- `whereSize(field, ...): this`  [lines 723-729] — array size constraint (overloaded)
- `whereNot(callback): this`  [lines 735-740] — AND negated group
- `orWhereNot(callback): this`  [lines 743-748] — OR negated group
- `join(...): this`  [lines 765-774] — INNER JOIN (overloaded)
- `leftJoin(...): this`  [lines 777-786]
- `rightJoin(...): this`  [lines 789-802]
- `innerJoin(...): this`  [lines 805-818]
- `fullJoin(...): this`  [lines 821-830]
- `crossJoin(table): this`  [lines 833-836]
- `joinRaw(expression, bindings?): this`  [lines 839-842]
- `joinWith(...args): this`  [lines 869-899] — eager-load relations via JOIN
- `with(...args): this`  [lines 913-935] — eager-load via separate queries — side-effects: mutates eagerLoadRelations
- `withCount(...relations): this`  [lines 938-941] — side-effects: mutates countRelations
- `has(relation, operator?, count?): this`  [lines 948-951]
- `whereHas(relation, callback): this`  [lines 957-962]
- `orWhereHas(relation, callback): this`  [lines 965-970]
- `doesntHave(relation): this`  [lines 973-976]
- `whereDoesntHave(relation, callback): this`  [lines 979-984]
- `select(...): this`  [lines 998-1010] — specify columns (overloaded)
- `selectAs(field, alias): this`  [lines 1013-1016]
- `selectRaw(expression, bindings?): this`  [lines 1022-1025]
- `selectRawMany(definitions): this`  [lines 1028-1035]
- `selectSub(expression, alias): this`  [lines 1038-1041]
- `addSelectSub(expression, alias): this`  [lines 1044-1046]
- `selectAggregate(field, aggregate, alias): this`  [lines 1052-1058]
- `selectExists(field, alias): this`  [lines 1061-1063]
- `selectCount(field, alias): this`  [lines 1066-1068]
- `selectCase(cases, otherwise, alias): this`  [lines 1074-1081]
- `selectWhen(condition, thenValue, elseValue, alias): this`  [lines 1084-1093]
- `selectDriverProjection(_callback): this`  [lines 1099-1101] — no-op base, overridable
- `selectJson(path, alias?): this`  [lines 1104-1110]
- `selectJsonRaw(_path, expression, alias): this`  [lines 1113-1115]
- `deselectJson(path): this`  [lines 1118-1120]
- `selectConcat(fields, alias): this`  [lines 1123-1125]
- `selectCoalesce(fields, alias): this`  [lines 1128-1130]
- `selectWindow(spec): this`  [lines 1133-1136]
- `deselect(fields): this`  [lines 1139-1142]
- `clearSelect(): this`  [lines 1148-1154] — remove all select ops — side-effects: filters operations, rebuilds index
- `selectAll(): this`  [lines 1157-1159]
- `selectDefault(): this`  [lines 1162-1164]
- `addSelect(fields): this`  [lines 1167-1170]
- `distinctValues(fields?): this`  [lines 1176-1180]
- `orderBy(...): this`  [lines 1193-1207] — order by column (overloaded)
- `orderByDesc(field): this`  [lines 1210-1212]
- `orderByRaw(expression, bindings?): this`  [lines 1219-1222]
- `orderByRandom(limit?): this`  [lines 1228-1232]
- `oldest(column?): this`  [lines 1235-1237]
- `limit(value): this`  [lines 1244-1247]
- `skip(value): this`  [lines 1250-1253]
- `offset(value): this`  [lines 1256-1258]
- `take(value): this`  [lines 1261-1263]
- `groupBy(input): this`  [lines 1274-1278]
- `groupByRaw(expression, bindings?): this`  [lines 1281-1284]
- `having(...): this`  [lines 1294-1317] — post-group filter (overloaded)
- `havingRaw(expression, bindings?): this`  [lines 1320-1323]
- `tap(callback): this`  [lines 1333-1336] — side-effects: invokes callback
- `when(condition, callback, otherwise?): this`  [lines 1345-1356] — conditional modifications
