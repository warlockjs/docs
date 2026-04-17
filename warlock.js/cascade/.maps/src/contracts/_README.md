# contracts

Defines every public interface and shared type that decouples Cascade's consumer-facing API from concrete driver implementations. The nine contracts span the full lifecycle of database interaction: low-level driver operations, ID generation, document writing, soft-delete removal and restoration, fluent query building, schema blueprinting, DDL migration, and cascading sync. All concrete classes in the `drivers/`, `writer/`, `remover/`, and `restorer/` directories implement one or more of these contracts.

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [database-driver.contract.md](./database-driver.contract.md) — Core driver interface: CRUD, transactions, lifecycle, and event hooks
- [database-id-generator.contract.md](./database-id-generator.contract.md) — Interface for pluggable auto-increment and UUID ID generators
- [database-remover.contract.md](./database-remover.contract.md) — Interface for delete-strategy orchestration (trash, soft, permanent)
- [database-restorer.contract.md](./database-restorer.contract.md) — Interface for restoring soft-deleted documents
- [database-writer.contract.md](./database-writer.contract.md) — Interface for the model persistence pipeline (insert, update, events)
- [driver-blueprint.contract.md](./driver-blueprint.contract.md) — Interface for schema introspection (tables, columns, indexes)
- [index.md](./index.md) — Barrel re-exporting all contract types and interfaces
- [migration-driver.contract.md](./migration-driver.contract.md) — Abstract DDL interface: column/index/foreign-key definitions and schema operations
- [query-builder.contract.md](./query-builder.contract.md) — Fluent, driver-agnostic query builder interface with 100+ method signatures
- [sync-adapter.contract.md](./sync-adapter.contract.md) — Interface for executing cascading denormalized-data sync operations
