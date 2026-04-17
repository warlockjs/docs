# src

Root of the Cascade ORM source map tree. This directory holds the package's top-level primitives: the central barrel re-export (`index`), the core type aliases that govern the whole ORM (`types`), and the two change-tracking implementations (`DatabaseDirtyTracker` for document databases and `SqlDatabaseDirtyTracker` for relational databases). Subdirectories cover every major subsystem — drivers, model, query-builder, relations, sync, migration, validation, and utilities.

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [database-dirty-tracker.md](./database-dirty-tracker.md) — Dot-notation change tracking for document-style model fields
- [index.md](./index.md) — Central barrel re-exporting the entire public API
- [sql-database-dirty-tracker.md](./sql-database-dirty-tracker.md) — SQL-aware change tracking that preserves nested object structure
- [types.md](./types.md) — Core type aliases: StrictMode, DeleteStrategy, NamingConvention, ModelDefaults, UuidStrategy, MigrationDefaults

## Subdirectories

- [context/](./context/_README.md) — AsyncLocalStorage contexts for data-source and transaction session binding
- [contracts/](./contracts/_README.md) — Driver, writer, remover, restorer, query-builder, sync, migration, and blueprint contracts
- [data-source/](./data-source/_README.md) — DataSource class and global data-source registry
- [drivers/mongodb/](./drivers/mongodb/_README.md) — MongoDB driver implementation
- [drivers/postgres/](./drivers/postgres/_README.md) — PostgreSQL driver implementation
- [drivers/sql/](./drivers/sql/_README.md) — Shared SQL dialect contract and types
- [errors/](./errors/_README.md) — Custom error types for missing data sources and transaction rollbacks
- [events/](./events/_README.md) — Model event registry and typed lifecycle event helpers
- [expressions/](./expressions/_README.md) — Aggregate expression helpers for query pipelines
- [migration/](./migration/_README.md) — DDL schema management: column/index builders, migration runner, SQL grammar
- [model/](./model/_README.md) — Abstract Model base class, registry decorator, and all method modules
- [query-builder/](./query-builder/_README.md) — Driver-agnostic fluent query builder base class
- [relations/](./relations/_README.md) — Relation types, helpers, eager-loading, pivot operations, and hydration
- [remover/](./remover/_README.md) — DatabaseRemover service for delete-strategy orchestration
- [restorer/](./restorer/_README.md) — DatabaseRestorer service for soft-delete restoration
- [sync/](./sync/_README.md) — Cascading denormalized-data sync system
- [utils/](./utils/_README.md) — Connection helpers, model definition utilities, and writer transform hooks
- [validation/](./validation/_README.md) — Seal-integrated validation, embed validators, and writer error type
- [writer/](./writer/_README.md) — DatabaseWriter orchestrating the full model save pipeline
