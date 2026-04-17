# types
source: drivers/postgres/types.ts
description: Type definitions for PostgreSQL driver configuration, query results, transactions, and internal query builder structures.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
_(none)_

## Exports
- `PostgresConnectionConfig` — Connection config type  [lines 12-36]
- `PostgresPoolConfig` — Pool config extending connection config  [lines 41-54]
- `PostgresQueryResult` — Generic query result wrapper type  [lines 59-71]
- `PostgresIsolationLevel` — Union of four isolation level strings  [lines 76-80]
- `PostgresTransactionOptions` — Transaction options type  [lines 85-92]
- `PostgresOperation` — Internal query-builder operation type  [lines 97-113]
- `PostgresWhereClause` — Internal pending WHERE clause representation  [lines 118-147]
- `PostgresNotification` — NOTIFY payload structure  [lines 152-159]
- `PostgresCopyOptions` — COPY command options for bulk operations  [lines 164-179]

## Classes / Functions / Types / Constants

### type `PostgresConnectionConfig`  [lines 12-36]
- `readonly host?: string`
- `readonly port?: number`
- `readonly database: string`
- `readonly user?: string`
- `readonly password?: string`
- `readonly connectionString?: string`
- `readonly ssl?: boolean | { rejectUnauthorized?, ca?, cert?, key? }`
- `readonly logging?: boolean`

### type `PostgresPoolConfig`  [lines 41-54]
Extends `PostgresConnectionConfig` with pool-sizing fields.
- `readonly max?: number`; `readonly min?: number`; `readonly idleTimeoutMillis?: number`
- `readonly connectionTimeoutMillis?: number`; `readonly maxUses?: number`; `readonly application_name?: string`

### type `PostgresQueryResult<T>`  [lines 59-71]
- `readonly rows: T[]`; `readonly rowCount: number | null`
- `readonly fields: Array<{ name: string; dataTypeID: number }>`; `readonly command: string`

### type `PostgresIsolationLevel`  [lines 76-80]
Union: `"read uncommitted" | "read committed" | "repeatable read" | "serializable"`

### type `PostgresTransactionOptions`  [lines 85-92]
- `readonly isolationLevel?: PostgresIsolationLevel`; `readonly readOnly?: boolean`; `readonly deferrable?: boolean`

### type `PostgresOperation`  [lines 97-113]
- `readonly stage` — One of select/from/join/where/groupBy/having/orderBy/limit/offset
- `readonly type: string`; `readonly data: Record<string, unknown>`

### type `PostgresWhereClause`  [lines 118-147]
- `readonly boolean: "and" | "or"`; `readonly type` — One of 11 clause kinds
- `readonly column?`, `operator?`, `value?`, `raw?`, `bindings?`, `nested?: PostgresWhereClause[]`

### type `PostgresNotification`  [lines 152-159]
- `readonly channel: string`; `readonly payload?: string`; `readonly processId: number`

### type `PostgresCopyOptions`  [lines 164-179]
- `readonly format?: "text" | "csv" | "binary"`; delimiter, quote, escape, header, null, columns fields
