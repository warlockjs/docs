# sql-types
source: drivers/sql/sql-types.ts
description: Shared type definitions for SQL query building across PostgreSQL, MySQL, and SQLite drivers
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- (none — pure type declarations, no imports)

## Exports
- `SqlQueryResult` — Result of building a parameterized SQL query (sql string + params array)  [lines 16-21]
- `SqlJoinType` — Union of supported JOIN types: inner, left, right, full, cross  [line 26]
- `SqlJoinClause` — Full JOIN clause definition including type, table, alias, ON condition, and optional additional conditions  [lines 33-55]
- `SqlOrderClause` — ORDER BY clause with column, direction (asc/desc), and optional nulls positioning  [lines 60-67]
- `SqlGroupClause` — GROUP BY clause holding an array of column names  [lines 72-75]
- `SqlHavingClause` — HAVING condition with aggregate function, column, operator, and value  [lines 80-89]
- `SqlWhereType` — Union of WHERE operation type literals (where, orWhere, whereRaw, orWhereRaw, whereNot, orWhereNot, whereExists, whereNotExists)  [lines 94-102]
- `SqlWhereOperation` — Single WHERE condition with type, optional field/operator/value, optional raw expression with bindings, and optional nested conditions  [lines 109-124]
- `SqlSelectClause` — SELECT column definition with expression, optional alias, and isRaw flag  [lines 129-136]
- `SqlQueryConfig` — Complete query configuration bundling all clauses (table, alias, select, joins, where, groupBy, having, orderBy, limit, offset, distinct)  [lines 141-164]
- `SqlInsertOperation` — INSERT definition with table, columns, multi-row values, optional RETURNING, and optional ON CONFLICT upsert config  [lines 169-184]
- `SqlUpdateOperation` — UPDATE definition with table, set map, optional increment/unset/returning/limit, and WHERE conditions  [lines 189-204]
- `SqlDeleteOperation` — DELETE definition with table, WHERE conditions, optional RETURNING and limit  [lines 209-218]
- `SqlAggregateFunction` — Union of supported SQL aggregate function names: count, sum, avg, min, max, array_agg, string_agg, jsonb_agg  [lines 223-231]

## Classes / Functions / Types / Constants

### `SqlQueryResult` [lines 16-21]
- Readonly object pairing a SQL string (with `$1`/`?` placeholders) with its corresponding `params` array. Prevents SQL injection by keeping values separate from the query string.
- Fields: `sql: string`, `params: unknown[]`

### `SqlJoinType` [line 26]
- String literal union: `"inner" | "left" | "right" | "full" | "cross"`.

### `SqlJoinClause` [lines 33-55]
- Describes a JOIN between tables. All fields are `readonly`.
- Fields: `type: SqlJoinType`, `table: string`, `alias?: string`, `on: { left: string; operator: string; right: string }`, `additionalConditions?: Array<{ left: string; operator: string; right: string }>`

### `SqlOrderClause` [lines 60-67]
- Describes a single ORDER BY term. `nulls` (`"first" | "last"`) is PostgreSQL-specific.
- Fields: `column: string`, `direction: "asc" | "desc"`, `nulls?: "first" | "last"`

### `SqlGroupClause` [lines 72-75]
- Wraps an array of column name strings for GROUP BY.
- Fields: `columns: string[]`

### `SqlHavingClause` [lines 80-89]
- Represents one HAVING condition.
- Fields: `aggregate: string`, `column: string`, `operator: string`, `value: unknown`

### `SqlWhereType` [lines 94-102]
- String literal union covering all WHERE clause variants: `"where" | "orWhere" | "whereRaw" | "orWhereRaw" | "whereNot" | "orWhereNot" | "whereExists" | "whereNotExists"`.

### `SqlWhereOperation` [lines 109-124]
- Flexible WHERE node. Standard clauses use `field`, `operator`, `value`. Raw clauses use `raw` + `bindings`. Grouped/nested clauses embed child `SqlWhereOperation[]` in `nested`.
- Fields: `type: SqlWhereType`, `field?: string`, `operator?: string`, `value?: unknown`, `raw?: string`, `bindings?: unknown[]`, `nested?: SqlWhereOperation[]`

### `SqlSelectClause` [lines 129-136]
- Represents one item in a SELECT list. `isRaw` bypasses identifier quoting when `true`.
- Fields: `expression: string`, `alias?: string`, `isRaw?: boolean`

### `SqlQueryConfig` [lines 141-164]
- Aggregates all parts of a SELECT query into one immutable config object consumed by dialect-specific query builders.
- Fields: `table: string`, `alias?: string`, `select: SqlSelectClause[]`, `joins: SqlJoinClause[]`, `where: SqlWhereOperation[]`, `groupBy: string[]`, `having: SqlHavingClause[]`, `orderBy: SqlOrderClause[]`, `limit?: number`, `offset?: number`, `distinct?: boolean`

### `SqlInsertOperation` [lines 169-184]
- Defines an INSERT statement. `values` is `unknown[][]` to support bulk inserts. `onConflict` enables upsert with `action: "update" | "nothing"` and optional `updateColumns`.
- Fields: `table: string`, `columns: string[]`, `values: unknown[][]`, `returning?: string[] | boolean`, `onConflict?: { columns: string[]; action: "update" | "nothing"; updateColumns?: string[] }`

### `SqlUpdateOperation` [lines 189-204]
- Defines an UPDATE statement. `increment` maps column to numeric delta. `unset` lists columns to set to NULL.
- Fields: `table: string`, `set: Record<string, unknown>`, `increment?: Record<string, number>`, `unset?: string[]`, `where: SqlWhereOperation[]`, `returning?: string[] | boolean`, `limit?: number`

### `SqlDeleteOperation` [lines 209-218]
- Defines a DELETE statement.
- Fields: `table: string`, `where: SqlWhereOperation[]`, `returning?: string[] | boolean`, `limit?: number`

### `SqlAggregateFunction` [lines 223-231]
- String literal union: `"count" | "sum" | "avg" | "min" | "max" | "array_agg" | "string_agg" | "jsonb_agg"`.
