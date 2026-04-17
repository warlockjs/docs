# drivers/postgres

PostgreSQL implementation of all Cascade driver contracts, backed by the `pg` connection pool. `PostgresDriver` is the entry point; it owns the pool and lazily constructs the blueprint, migration driver, and sync adapter. Queries are built by `PostgresQueryBuilder`, compiled to parameterized SQL by `PostgresQueryParser` using the `PostgresDialect`, and DDL strings are produced by `PostgresSQLSerializer`. The sync adapter uses JSONB `jsonb_set` and CTEs for efficient denormalized fan-out.

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [types.md](./types.md) — Connection, pool, query-result, transaction, and internal operation type definitions
- [index.md](./index.md) — Barrel re-exporting all PostgreSQL driver components
- [postgres-blueprint.md](./postgres-blueprint.md) — Schema introspection via information_schema and pg_indexes
- [postgres-dialect.md](./postgres-dialect.md) — PostgreSQL SQL dialect: placeholders, quoting, JSONB, upsert syntax
- [postgres-driver.md](./postgres-driver.md) — Main PostgreSQL DriverContract implementation
- [postgres-migration-driver.md](./postgres-migration-driver.md) — Full DDL migration driver for PostgreSQL
- [postgres-query-builder.md](./postgres-query-builder.md) — PostgreSQL query builder with execution, hydration, and relation loading
- [postgres-query-parser.md](./postgres-query-parser.md) — Translates query builder operations into parameterized PostgreSQL SQL
- [postgres-sql-serializer.md](./postgres-sql-serializer.md) — Pure DDL serializer converting pending migration operations to SQL strings
- [postgres-sync-adapter.md](./postgres-sync-adapter.md) — Batch JSONB sync adapter implementing SyncAdapterContract for PostgreSQL
