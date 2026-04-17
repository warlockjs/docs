# sql-dialect.contract
source: drivers/sql/sql-dialect.contract.ts
description: Interface defining database-specific SQL syntax variations that each SQL driver dialect must implement
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- (none — pure interface declaration, no imports)

## Exports
- `SqlDialectContract` — Interface all SQL dialect implementations must satisfy  [lines 34-210]

## Classes / Functions / Types / Constants

### `SqlDialectContract` [lines 34-210]
- Interface abstracting per-database SQL syntax differences (parameter placeholders, identifier quoting, boolean literals, JSON operators, LIKE, array operations, type mapping). Implemented by PostgreSQL, MySQL, and SQLite dialect classes.

#### `name: string` [line 40]
- Readonly property identifying the dialect. Expected values: `"postgres"`, `"mysql"`, `"sqlite"`.

#### `supportsReturning: boolean` [line 104]
- Readonly flag. `true` for PostgreSQL (supports `RETURNING *`); `false` for MySQL (must use `LAST_INSERT_ID()`).

#### `upsertKeyword: "ON CONFLICT" | "ON DUPLICATE KEY"` [line 112]
- Readonly property selecting the upsert syntax keyword for the dialect. PostgreSQL uses `"ON CONFLICT"`, MySQL uses `"ON DUPLICATE KEY"`.

#### `placeholder(index: number): string` [line 58]
- Generates a parameter placeholder for the given 1-based index. PostgreSQL returns `$1`, `$2`, etc.; MySQL/SQLite return `?`.

#### `quoteIdentifier(identifier: string): string` [line 78]
- Wraps an identifier (table or column name) in the dialect's quote characters and escapes internal occurrences. PostgreSQL uses double-quotes; MySQL uses backticks.

#### `booleanLiteral(value: boolean): string` [line 96]
- Converts a JS boolean to a SQL literal. PostgreSQL returns `"TRUE"`/`"FALSE"`; MySQL returns `"1"`/`"0"`.

#### `limitOffset(limit?: number, offset?: number): string` [line 130]
- Builds the LIMIT/OFFSET pagination clause. Either or both arguments may be omitted. Returns strings like `"LIMIT 10 OFFSET 20"`, `"LIMIT 10"`, or `"OFFSET 20"`.

#### `jsonExtract(column: string, path: string): string` [line 150]
- Produces a database-specific JSON path extraction expression. PostgreSQL uses `->>` / `->` chaining; MySQL uses `JSON_EXTRACT(column, '$.path')`.

#### `jsonContains(column: string, value: unknown, path?: string): string` [line 163]
- Produces a JSON containment check expression. PostgreSQL uses `@>` operator with JSONB casting; MySQL uses `JSON_CONTAINS()`. `path` is optional.

#### `likePattern(pattern: string, caseInsensitive?: boolean): { operator: string; pattern: string }` [line 179]
- Returns the appropriate LIKE operator and pattern for the dialect. PostgreSQL uses `ILIKE` for case-insensitive matching; MySQL handles case-insensitivity natively with `LIKE`.

#### `arrayContains(column: string, paramIndex: number): string` [line 191]
- Generates an array-contains SQL expression referencing a parameter placeholder by index. PostgreSQL uses `$n = ANY(column)`; MySQL targets JSON arrays via `JSON_CONTAINS`.

#### `getSqlType(type: string, options?: { length?: number; precision?: number; scale?: number; dimensions?: number }): string` [lines 206-209]
- Maps an abstract type name (e.g. `"string"`, `"json"`) to the database-specific SQL type string (e.g. `"VARCHAR(255)"`, `"JSONB"`). Options carry length, precision, scale, and array dimension hints.
