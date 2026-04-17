# postgres-dialect
source: drivers/postgres/postgres-dialect.ts
description: PostgreSQL-specific SQL dialect implementing SqlDialectContract with $N placeholders, double-quote identifiers, and JSONB operators.
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- `SqlDialectContract` from `../sql/sql-dialect.contract`

## Exports
- `PostgresDialect` — Concrete implementation of SqlDialectContract for PostgreSQL.  [lines 32-297]

## Classes / Functions / Types / Constants

### `PostgresDialect` [lines 32-297]
- Implements `SqlDialectContract`. Stateless class; all methods are pure transformations of their inputs.
- Public readonly properties: `name = "postgres"`, `supportsReturning = true`, `upsertKeyword = "ON CONFLICT"`.

#### `placeholder(index: number): string` [lines 56-58]
- Returns `$${index}` — PostgreSQL's numbered parameter placeholder (e.g., index 1 → `"$1"`).

#### `quoteIdentifier(identifier: string): string` [lines 69-73]
- Splits on `.` for qualified names, wraps each part in double-quotes, escapes embedded double-quotes by doubling them (e.g., `user` → `"user"`, `schema.table` → `"schema"."table"`).

#### `booleanLiteral(value: boolean): string` [lines 81-83]
- Returns `"TRUE"` or `"FALSE"`.

#### `limitOffset(limit?: number, offset?: number): string` [lines 92-104]
- Produces `LIMIT N OFFSET M` clause; omits either part when its argument is undefined.

#### `jsonExtract(column: string, path: string): string` [lines 116-132]
- Builds a JSONB text-extraction expression using `->>` for a single-segment path and `->` chaining for nested paths (dot-notation). Examples: `"data"->>'name'`, `"data"->'user'->>'name'`.

#### `jsonContains(column: string, value: unknown, path?: string): string` [lines 144-156]
- Builds a JSONB containment expression using the `@>` operator. When `path` is provided, wraps value as `{ [path]: value }`. Returns `column @> '...'::jsonb`.

#### `likePattern(pattern: string, caseInsensitive?: boolean): { operator: string; pattern: string }` [lines 167-178]
- Escapes `\`, `%`, `_` in `pattern`. Returns `{ operator: "ILIKE" | "LIKE", pattern: escapedPattern }`. `caseInsensitive` defaults to `true`.

#### `arrayContains(column: string, paramIndex: number): string` [lines 189-191]
- Returns `$N = ANY("column")` expression for checking membership in a PostgreSQL array column.

#### `getSqlType(type: string, options?: { length?: number; precision?: number; scale?: number; dimensions?: number }): string` [lines 200-296]
- Maps abstract type names to PostgreSQL SQL type strings. Key mappings:
  - `string` → `VARCHAR(N)` or `TEXT`; `char` → `CHAR(N)`; `text` / `mediumText` / `longText` → `TEXT`
  - `integer` → `INTEGER`; `smallInteger` / `tinyInteger` → `SMALLINT`; `bigInteger` → `BIGINT`
  - `float` → `REAL`; `double` → `DOUBLE PRECISION`; `decimal` → `DECIMAL(P,S)` or `DECIMAL`
  - `boolean` → `BOOLEAN`; `date` → `DATE`; `dateTime` → `TIMESTAMP`; `timestamp` → `TIMESTAMPTZ`; `time` → `TIME`; `year` → `SMALLINT`
  - `json` → `JSONB`; `binary` → `BYTEA`; `uuid` → `UUID`; `ulid` → `CHAR(26)`
  - `ipAddress` → `INET`; `macAddress` → `MACADDR`; `point` → `POINT`; `polygon` → `POLYGON`; `lineString` → `PATH`; `geometry` → `GEOMETRY`
  - `vector` → `VECTOR(N)` or `VECTOR`; `enum` → `TEXT`; `set` → `TEXT[]`
  - Native array variants: `arrayInt` → `INTEGER[]`, `arrayBigInt` → `BIGINT[]`, `arrayFloat` → `REAL[]`, `arrayDecimal` → `DECIMAL(P,S)[]` or `DECIMAL[]`, `arrayBoolean` → `BOOLEAN[]`, `arrayText` → `TEXT[]`, `arrayDate` → `DATE[]`, `arrayTimestamp` → `TIMESTAMPTZ[]`, `arrayUuid` → `UUID[]`
  - Unknown types fall through to `type.toUpperCase()`
