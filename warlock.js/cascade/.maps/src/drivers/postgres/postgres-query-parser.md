# postgres-query-parser
source: drivers/postgres/postgres-query-parser.ts
description: Translates Cascade query operations into PostgreSQL SQL queries with parameter bindings.
complexity: complex
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-opus-4-7
last-updated-by: claude-opus-4-7

## Imports
- `DriverQuery`, `JoinOptions`, `WhereOperator` from `../../contracts/query-builder.contract`
- `SqlDialectContract` from `../sql/sql-dialect.contract`
- `PostgresDialect` from `./postgres-dialect`

## Exports
- `PostgresOperationType` — Union type of all operation types supported by the parser  [lines 23-78]
- `PostgresParserOperation` — Internal representation of a single operation (type + data)  [lines 83-88]
- `PostgresParserOptions` — Configuration options for constructing a parser  [lines 93-104]
- `PostgresQueryParser` — Class that converts a list of query operations into an SQL query string with parameters  [lines 128-1109]

## Classes / Functions / Types / Constants

### `PostgresOperationType` [lines 23-78]
- Union type enumerating every supported operation category: WHERE variants (`where`, `orWhere`, `whereRaw`, `orWhereRaw`, `whereIn`, `whereNotIn`, `whereNull`, `whereNotNull`, `whereBetween`, `whereNotBetween`, `whereLike`, `whereNotLike`, `whereColumn`, `orWhereColumn`, `whereExists`, `whereNotExists`, `whereDate*`, `whereJsonContains`, `whereJsonDoesntContain`, `whereFullText`), SELECT variants (`select`, `selectRaw`, `deselect`), JOIN variants (`join`, `leftJoin`, `rightJoin`, `innerJoin`, `fullJoin`, `crossJoin`, `joinRaw`), ORDER (`orderBy`, `orderByRaw`), GROUP/HAVING (`groupBy`, `having`, `havingRaw`), LIMIT (`limit`, `offset`), RELATION (`has`, `whereHas`, `doesntHave`, `whereDoesntHave`), `selectRelatedColumns`, and `distinct`.

### `PostgresParserOperation` [lines 83-88]
- Readonly object shape: `type: PostgresOperationType` and `data: Record<string, unknown>`.

### `PostgresParserOptions` [lines 93-104]
- Readonly object: `table: string`, `alias?: string`, `operations: PostgresParserOperation[]`, `dialect?: SqlDialectContract`, `createSubParser?: (table: string) => PostgresQueryParser`.

### `PostgresQueryParser` [lines 128-1109]
- Converts a list of query operations into a SQL query string with bound parameters. Handles SELECT, WHERE, JOIN, ORDER BY, GROUP BY, HAVING, LIMIT/OFFSET, JSONB path detection, full-text search, and related-column subqueries (hasOne/belongsTo/hasMany via `row_to_json` / `json_agg`).
- Public fields: `selectColumns: string[]` [line 162], `whereClauses: string[]` [line 177], `orderClauses: string[]` [line 187], `limitValue?: number` [line 202], `offsetValue?: number` [line 207].

#### `constructor(options: PostgresParserOptions)` [lines 230-235]
- Stores table, alias, and operations; defaults `dialect` to a new `PostgresDialect` instance when not supplied.

#### `parse(): DriverQuery` [lines 242-279]
- Pre-scans operations to detect any JOIN types and populate the internal `joinedTables` set (so `qualifyColumn`/`parseColumnIdentifier` can correctly prefix columns even when WHERE clauses precede JOINs). Processes each operation via `processOperation`, builds the final SQL via `buildSql`, and returns `{ query, bindings }`.

#### `toPrettyString(): string` [lines 286-289]
- Invokes `parse()` and returns the SQL followed by a newline and `-- Bindings: <JSON>` comment for debugging.

Report:
- Exports: 4 (`PostgresOperationType`, `PostgresParserOperation`, `PostgresParserOptions`, `PostgresQueryParser`).
- Public method count on `PostgresQueryParser`: 3 (`constructor`, `parse`, `toPrettyString`). All other methods (`processOperation`, `buildSql`, `buildSelectClause`, `addParam`, `processWhere`, `processWhereRaw`, `processWhereIn`, `processWhereNull`, `processWhereBetween`, `processWhereLike`, `processWhereColumn`, `processWhereJsonContains`, `processWhereFullText`, `processSelect`, `processSelectRaw`, `processDeselect`, `processSelectRelatedColumns`, `processJoin`, `parseColumnIdentifier`, `isTableReference`, `buildJsonbPath`, `processCrossJoin`, `processJoinRaw`, `processOrderBy`, `processOrderByRaw`, `processGroupBy`, `processHaving`, `processHavingRaw`, `addWhereClause`, `mapOperator`) are `private` and therefore skipped per rules.
- Public fields intentionally exposed (non-private) for sub-parser merging in `processSelectRelatedColumns`: `selectColumns`, `whereClauses`, `orderClauses`, `limitValue`, `offsetValue`.
- Ambiguities: the `PostgresOperationType` union declares `"has"`, `"whereHas"`, `"doesntHave"`, `"whereDoesntHave"`, `"whereExists"`, `"whereNotExists"`, `"whereDate"`, `"whereDateBefore"`, `"whereDateAfter"`, and `"whereDateBetween"`, but `processOperation` has no case-handlers for them — they fall through to the `default` branch and are silently ignored. The `createSubParser` option field is defined on `PostgresParserOptions` but never read by the class (sub-parsers are constructed directly via `new PostgresQueryParser(...)` inside `processSelectRelatedColumns`).
