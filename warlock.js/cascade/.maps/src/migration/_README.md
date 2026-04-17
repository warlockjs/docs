# migration

Full DDL and schema management subsystem. The abstract `Migration` base class provides a fluent API for accumulating pending operations; `ColumnBuilder` and `ForeignKeyBuilder` produce the column and FK definitions that feed those operations. A dialect-specific `SQLSerializer` converts the pending queue to SQL strings, `SQLGrammar` classifies and phase-sorts them for dependency-safe execution, and `MigrationRunner` wires everything together, tracking batch state in a database table.

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [types.md](./types.md) — Shared result, status, record, runner options, and tagged-SQL type definitions
- [column-builder.md](./column-builder.md) — Fluent column definition builder that registers index and FK operations on a parent migration
- [column-helpers.md](./column-helpers.md) — DetachedColumnBuilder subclass and ~45 standalone per-type column helper functions
- [foreign-key-builder.md](./foreign-key-builder.md) — Fluent FK constraint builder that registers definitions on a parent migration
- [index.md](./index.md) — Barrel re-exporting all migration public symbols
- [migration-runner.md](./migration-runner.md) — Batch/single migration executor with database-backed state tracking
- [migration.md](./migration.md) — Abstract Migration base class and MigrationContract/OperationType/PendingOperation types
- [sql-grammar.md](./sql-grammar.md) — Static SQL classifier and phase sorter for dependency-safe migration ordering
- [sql-serializer.md](./sql-serializer.md) — Abstract base for dialect-specific serializers converting PendingOperations to SQL strings
