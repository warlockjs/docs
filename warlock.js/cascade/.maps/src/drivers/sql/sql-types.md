# sql-types
source: drivers/sql/sql-types.ts
description: Shared type definitions for SQL operations and query configurations.
complexity: medium
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
(none)

## Exports
- `SqlQueryResult` — Parameterized SQL query with values [line 16]
- `SqlJoinType` — Supported JOIN operation types [line 26]
- `SqlJoinClause` — JOIN clause definition [line 33]
- `SqlOrderClause` — ORDER BY clause definition [line 60]
- `SqlGroupClause` — GROUP BY clause definition [line 72]
- `SqlHavingClause` — HAVING clause condition [line 80]
- `SqlWhereType` — WHERE clause operation type variants [line 94]
- `SqlWhereOperation` — WHERE clause operation [line 109]
- `SqlSelectClause` — SELECT clause definition [line 129]
- `SqlQueryConfig` — SQL query building configuration [line 141]
- `SqlInsertOperation` — INSERT operation definition [line 169]
- `SqlUpdateOperation` — UPDATE operation definition [line 189]
- `SqlDeleteOperation` — DELETE operation definition [line 209]
- `SqlAggregateFunction` — Supported aggregate function types [line 223]

## Types & Interfaces
### SqlQueryResult [lines 16-21] — Parameterized SQL query container
- `sql: string` — SQL query with placeholders
- `params: unknown[]` — Parameter values in order

### SqlJoinClause [lines 33-55] — JOIN operation specification
- `type: SqlJoinType` — JOIN type (inner, left, right, full, cross)
- `table: string` — Target table to join
- `alias?: string` — Optional joined table alias
- `on: { left: string; operator: string; right: string }` — JOIN condition
- `additionalConditions?: Array<...>` — Complex join conditions

### SqlSelectClause [lines 129-136] — SELECT column definition
- `expression: string` — Column or expression
- `alias?: string` — Optional column alias
- `isRaw?: boolean` — Raw expression flag

### SqlQueryConfig [lines 141-164] — Query building configuration
- `table: string` — Target table name
- `select: SqlSelectClause[]` — SELECT columns
- `joins: SqlJoinClause[]` — JOIN clauses
- `where: SqlWhereOperation[]` — WHERE conditions
- `limit?: number` — LIMIT value
- `offset?: number` — OFFSET value

### SqlInsertOperation [lines 169-184] — INSERT specification
- `table: string` — Target table
- `columns: string[]` — Column names
- `values: unknown[][]` — Values for multi-row insert
- `onConflict?: {...}` — Upsert conflict resolution

### SqlUpdateOperation [lines 189-204] — UPDATE specification
- `table: string` — Target table
- `set: Record<string, unknown>` — Columns to update
- `where: SqlWhereOperation[]` — WHERE conditions
- `limit?: number` — Maximum rows to update

### SqlDeleteOperation [lines 209-218] — DELETE specification
- `table: string` — Target table
- `where: SqlWhereOperation[]` — WHERE conditions
- `limit?: number` — Maximum rows to delete
