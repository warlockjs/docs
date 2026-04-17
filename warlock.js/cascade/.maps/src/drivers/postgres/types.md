# types
source: drivers/postgres/types.ts
description: Pure TypeScript type definitions for the PostgreSQL driver — connection config, pool config, query result, transactions, where clauses, notifications, and COPY options.
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
_(none — this file exports only type aliases; no runtime imports)_

## Exports
- `PostgresConnectionConfig` — Connection options for a single PostgreSQL client.  [lines 12-36]
- `PostgresPoolConfig` — Pool-level options extending `PostgresConnectionConfig`.  [lines 41-54]
- `PostgresQueryResult<T>` — Typed wrapper around a pg query result.  [lines 59-71]
- `PostgresIsolationLevel` — Union of the four SQL transaction isolation levels.  [lines 76-81]
- `PostgresTransactionOptions` — Options bag for beginning a transaction.  [lines 85-92]
- `PostgresOperation` — Internal descriptor of a single query-builder operation.  [lines 97-113]
- `PostgresWhereClause` — Internal representation of a pending WHERE predicate.  [lines 118-147]
- `PostgresNotification` — Shape of a PostgreSQL `LISTEN`/`NOTIFY` notification event.  [lines 152-159]
- `PostgresCopyOptions` — Options for PostgreSQL bulk `COPY` operations.  [lines 164-179]

## Classes / Functions / Types / Constants

### `PostgresConnectionConfig` [lines 12-36]
- All fields readonly.
- Required: `database: string`
- Optional: `host?: string`, `port?: number`, `user?: string`, `password?: string`, `connectionString?: string`
- `ssl?: boolean | { rejectUnauthorized?: boolean; ca?: string; cert?: string; key?: string }`
- `logging?: boolean` — enables query/execution-time logging

### `PostgresPoolConfig` [lines 41-54]
- Extends `PostgresConnectionConfig` with pool-sizing readonly optionals.
- `max?: number` — maximum pool clients (default 10); `min?: number` — minimum idle clients (default 0)
- `idleTimeoutMillis?: number` — ms before idle client is closed
- `connectionTimeoutMillis?: number` — ms to wait for a client before timeout
- `maxUses?: number` — max queries per connection before recycling
- `application_name?: string` — identifier shown in pg_stat_activity

### `PostgresQueryResult<T = Record<string, unknown>>` [lines 59-71]
- `readonly rows: T[]` — result rows
- `readonly rowCount: number | null` — rows affected by INSERT/UPDATE/DELETE
- `readonly fields: Array<{ readonly name: string; readonly dataTypeID: number }>` — column metadata
- `readonly command: string` — SQL command type executed (SELECT, INSERT, etc.)

### `PostgresIsolationLevel` [lines 76-81]
- String literal union: `"read uncommitted" | "read committed" | "repeatable read" | "serializable"`

### `PostgresTransactionOptions` [lines 85-92]
- `readonly isolationLevel?: PostgresIsolationLevel`
- `readonly readOnly?: boolean` — open a read-only transaction
- `readonly deferrable?: boolean` — use DEFERRABLE mode (valid only for serializable + read-only)

### `PostgresOperation` [lines 97-113]
- Internal query-builder operation descriptor.
- `readonly stage`: literal union `"select" | "from" | "join" | "where" | "groupBy" | "having" | "orderBy" | "limit" | "offset"`
- `readonly type: string` — operation name/variant within the stage
- `readonly data: Record<string, unknown>` — operation payload

### `PostgresWhereClause` [lines 118-147]
- Internal recursive representation of a pending WHERE predicate.
- `readonly boolean: "and" | "or"` — combinator with the previous clause
- `readonly type`: literal union `"basic" | "raw" | "null" | "notNull" | "in" | "notIn" | "between" | "notBetween" | "exists" | "notExists" | "nested" | "column"`
- `readonly column?: string`, `readonly operator?: string`, `readonly value?: unknown`
- `readonly raw?: string` — raw SQL fragment for `"raw"` type
- `readonly bindings?: unknown[]` — parameter bindings for raw clauses
- `readonly nested?: PostgresWhereClause[]` — child clauses for `"nested"` type (recursive)

### `PostgresNotification` [lines 152-159]
- Represents a payload received via PostgreSQL `LISTEN`/`NOTIFY`.
- `readonly channel: string` — notification channel name
- `readonly payload?: string` — optional string payload
- `readonly processId: number` — PID of the notifying backend process

### `PostgresCopyOptions` [lines 164-179]
- Options for PostgreSQL bulk `COPY FROM`/`COPY TO` operations.
- `readonly format?: "text" | "csv" | "binary"`
- `readonly delimiter?: string` — field delimiter (text/csv)
- `readonly quote?: string` — quote character (csv)
- `readonly escape?: string` — escape character (csv)
- `readonly header?: boolean` — include header row
- `readonly null?: string` — string representation of NULL values
- `readonly columns?: string[]` — explicit column list
