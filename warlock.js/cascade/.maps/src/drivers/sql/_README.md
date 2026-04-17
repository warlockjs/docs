# SQL (Shared)
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> Shared SQL abstractions and dialect contracts for database-agnostic query building across all SQL drivers.

## What lives here
- `sql-dialect.contract.ts` — Interface for database-specific SQL syntax variations (PostgreSQL, MySQL, SQLite)
- `sql-types.ts` — Shared type definitions for SQL operations, queries, and clauses
- `index.ts` — Central export barrel for the SQL module

## Public API
- `SqlDialectContract` — Interface for database-specific SQL syntax handling
- `SqlQueryResult` — Parameterized SQL query with placeholder and values
- `SqlJoinType` — Union of JOIN operation types (inner, left, right, full, cross)
- `SqlJoinClause` — JOIN clause specification with condition and aliases
- `SqlOrderClause` — ORDER BY clause with direction and nulls position
- `SqlGroupClause` — GROUP BY clause definition
- `SqlHavingClause` — HAVING aggregate condition
- `SqlWhereOperation` — WHERE clause operation (standard, raw, exists, negated)
- `SqlSelectClause` — SELECT column definition with expression and alias
- `SqlQueryConfig` — Complete SQL query building configuration
- `SqlInsertOperation` — INSERT operation with conflict resolution (upsert)
- `SqlUpdateOperation` — UPDATE operation with set, increment, unset, and where
- `SqlDeleteOperation` — DELETE operation with where conditions and limit
- `SqlAggregateFunction` — Union of aggregate function names (count, sum, avg, min, max, array_agg, string_agg, jsonb_agg)

## How it fits together
Dialect drivers implement `SqlDialectContract` to handle database-specific SQL syntax, parameter placeholders, identifier quoting, and advanced features like JSON operations and upserts. Query builders use the shared types (`SqlQueryConfig`, `SqlWhereOperation`, etc.) to build dialect-agnostic query specifications, which are then compiled into database-specific SQL strings using the appropriate dialect implementation. This separation allows different drivers to handle PostgreSQL `$1` vs MySQL `?` placeholders and differences in RETURNING clause support without duplicating type definitions.

## Working examples
```typescript
// Building a parameterized query using shared types
const query: SqlQueryConfig = {
  table: 'users',
  select: [{ expression: 'id' }, { expression: 'name' }],
  where: [{ type: 'where', field: 'active', operator: '=', value: true }],
  limit: 10,
  joins: [],
  groupBy: [],
  having: [],
  orderBy: [],
};

// Dialect implements the contract to generate database-specific SQL
class PostgresDialect implements SqlDialectContract {
  readonly name = 'postgres';
  readonly supportsReturning = true;
  readonly upsertKeyword = 'ON CONFLICT';
  
  placeholder(index: number): string { return `$${index}`; }
  quoteIdentifier(id: string): string { return `"${id}"`; }
  booleanLiteral(value: boolean): string { return value ? 'TRUE' : 'FALSE'; }
  limitOffset(limit?: number, offset?: number): string {
    return `LIMIT ${limit ?? 'ALL'} OFFSET ${offset ?? 0}`;
  }
  jsonExtract(column: string, path: string): string {
    return `${column}->>'${path}'`;
  }
  jsonContains(column: string, value: unknown, path?: string): string {
    return `${column} @> '${JSON.stringify(value)}'::jsonb`;
  }
  likePattern(pattern: string, ci?: boolean): { operator: string; pattern: string } {
    return { operator: ci ? 'ILIKE' : 'LIKE', pattern };
  }
  arrayContains(column: string, paramIndex: number): string {
    return `$${paramIndex} = ANY(${column})`;
  }
  getSqlType(type: string, opts?: Record<string, unknown>): string {
    return type === 'json' ? 'JSONB' : 'VARCHAR';
  }
}

// Result is parameterized to prevent SQL injection
const result: SqlQueryResult = {
  sql: 'SELECT "id", "name" FROM "users" WHERE "active" = $1 LIMIT 10 OFFSET 0',
  params: [true],
};
```

## DO NOT
- Do NOT ignore `SqlDialectContract` when adding database-specific features — every SQL dialect difference must be abstracted here
- Do NOT pass raw SQL strings to query builders — use `SqlQueryResult` with separated `sql` and `params` properties
- Do NOT assume all databases support RETURNING, JSON operations, or array syntax — check dialect capabilities first
