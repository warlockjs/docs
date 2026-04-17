# drivers/sql

Shared SQL abstractions used by all relational driver implementations. The `SqlDialectContract` interface defines the adapter surface each database-specific dialect must implement (placeholder syntax, identifier quoting, JSONB operations, upsert keywords). The `sql-types` file provides the shared structural types for building and describing SQL queries in a driver-agnostic way.

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [index.md](./index.md) — Barrel re-exporting all shared SQL types and contracts
- [sql-dialect.contract.md](./sql-dialect.contract.md) — Interface for database-specific SQL syntax variations (placeholders, quoting, JSONB, upsert)
- [sql-types.md](./sql-types.md) — Shared structural types for SQL query building: clauses, operations, configurations
