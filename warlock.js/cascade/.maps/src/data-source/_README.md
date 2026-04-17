# data-source

Defines the `DataSource` value object and the `dataSourceRegistry` singleton that stores, retrieves, and emits lifecycle events for all named database connections in Cascade. A `DataSource` couples a `DriverContract` with its name, defaults, and migration configuration; the registry is the single place where application bootstrap code registers drivers and where model/query/migration code resolves them at runtime.

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [data-source-registry.md](./data-source-registry.md) — Singleton registry storing named DataSource instances with connection lifecycle events
- [data-source.md](./data-source.md) — Immutable DataSource wrapper coupling a driver to its named configuration
