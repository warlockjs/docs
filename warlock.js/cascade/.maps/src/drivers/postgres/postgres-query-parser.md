# postgres-query-parser
source: drivers/postgres/postgres-query-parser.ts
description: Translates query operations into PostgreSQL SQL and bindings.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `DriverQuery, JoinOptions, WhereOperator` from `../../contracts/query-builder.contract`
- `SqlDialectContract` from `../sql/sql-dialect.contract`
- `PostgresDialect` from `./postgres-dialect`

## Exports
- `PostgresOperationType` — Union of supported op types  [lines 23-78]
- `PostgresParserOperation` — Internal operation shape  [lines 83-88]
- `PostgresParserOptions` — Parser configuration type  [lines 93-104]
- `PostgresQueryParser` — SQL compiler class  [lines 128-1109]

## Classes
### PostgresQueryParser  [lines 128-1109] — Compile operations into SQL query
fields:
- `selectColumns: string[]`  [line 162]
- `whereClauses: string[]`  [line 177]
- `orderClauses: string[]`  [line 187]
- `limitValue?: number`  [line 202]
- `offsetValue?: number`  [line 207]

methods:
- `constructor(options: PostgresParserOptions)`  [lines 230-235] — Initialise parser state
- `parse(): DriverQuery`  [lines 242-279] — Compile all ops to SQL
  - side-effects: populates params and clause arrays
- `toPrettyString(): string`  [lines 286-289] — Formatted SQL with bindings

## Types
- `PostgresOperationType` — Supported operation type union  [lines 23-78]
- `PostgresParserOperation` — `{ type; data }` op shape  [lines 83-88]
- `PostgresParserOptions` — Parser config options  [lines 93-104]
