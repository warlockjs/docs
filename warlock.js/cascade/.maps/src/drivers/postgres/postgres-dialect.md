# postgres-dialect
source: drivers/postgres/postgres-dialect.ts
description: Implements SqlDialectContract for PostgreSQL-specific SQL syntax, placeholders, and JSONB operators.
complexity: medium
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `SqlDialectContract` from `../sql/sql-dialect.contract`

## Exports
- `PostgresDialect` — PostgreSQL dialect implementing SqlDialectContract  [lines 32-297]

## Classes / Functions / Types / Constants

### class `PostgresDialect` implements `SqlDialectContract`  [lines 32-297]
PostgreSQL-specific SQL dialect implementation.

- `readonly name` = `"postgres"`  [line 36]
- `readonly supportsReturning` = `true`  [line 41]
- `readonly upsertKeyword` = `"ON CONFLICT"`  [line 46]
- `placeholder(index: number): string` — Returns `$N` numbered placeholder  [lines 56-58]
- `quoteIdentifier(identifier: string): string` — Double-quotes identifier, handles dots and escaping  [lines 69-73]
- `booleanLiteral(value: boolean): string` — Returns TRUE or FALSE literal  [lines 81-83]
- `limitOffset(limit?: number, offset?: number): string` — Builds LIMIT/OFFSET clause  [lines 92-104]
- `jsonExtract(column: string, path: string): string` — Builds JSONB ->> extraction expression  [lines 116-132]
- `jsonContains(column: string, value: unknown, path?: string): string` — Builds JSONB @> containment expression  [lines 144-156]
- `likePattern(pattern: string, caseInsensitive?: boolean): { operator, pattern }` — Returns ILIKE or LIKE with escaped pattern  [lines 167-178]
- `arrayContains(column: string, paramIndex: number): string` — Builds ANY() array containment expression  [lines 189-191]
- `getSqlType(type: string, options?): string` — Maps abstract type to PostgreSQL SQL type string  [lines 200-296]
