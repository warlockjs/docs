# sql-dialect.contract
source: drivers/sql/sql-dialect.contract.ts
description: Interface contract for database-specific SQL syntax variations across dialects.
complexity: medium
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
(none)

## Exports
- `SqlDialectContract` — Database-specific SQL syntax interface [line 34]

## Types & Interfaces
### SqlDialectContract [lines 34-210] — Contract for SQL dialect implementations
- `name: string` — Dialect identifier
- `placeholder(index: number): string` — Generate parameter placeholder [line 58]
- `quoteIdentifier(identifier: string): string` — Quote identifiers safely [line 78]
- `booleanLiteral(value: boolean): string` — Convert boolean to SQL literal [line 96]
- `supportsReturning: boolean` — RETURNING clause support flag [line 104]
- `upsertKeyword: "ON CONFLICT" | "ON DUPLICATE KEY"` — Upsert syntax [line 112]
- `limitOffset(limit?: number, offset?: number): string` — Build LIMIT/OFFSET clause [line 130]
- `jsonExtract(column: string, path: string): string` — Extract JSON path [line 150]
- `jsonContains(column: string, value: unknown, path?: string): string` — Check JSON contains [line 163]
- `likePattern(pattern: string, caseInsensitive?: boolean): { operator: string; pattern: string }` — Build LIKE pattern [line 179]
- `arrayContains(column: string, paramIndex: number): string` — Build array contains expression [line 191]
- `getSqlType(type: string, options?: {...}): string` — Get database-specific SQL type [line 206]
