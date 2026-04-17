# Data Source
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> Defines the `DataSource` value object and the `dataSourceRegistry` singleton that stores, retrieves, and emits lifecycle events for all named database connections in Cascade.

## What lives here
- `data-source.ts` — Declares `DataSourceOptions` and the `DataSource` class that couples a driver with its configuration metadata
- `data-source-registry.ts` — Singleton `dataSourceRegistry` that stores named `DataSource` instances and emits registration/connection lifecycle events

## Public API
- `DataSourceOptions` — configuration shape for registering a data source
- `DataSource(options: DataSourceOptions)` — immutable wrapper coupling a driver to its named config
- `DataSource.name: string` — unique identifier for this data source
- `DataSource.driver: DriverContract` — database driver for executing queries
- `DataSource.isDefault: boolean` — whether this is the default data source
- `DataSource.defaultDeleteStrategy?: DeleteStrategy` — fallback delete strategy for models
- `DataSource.defaultTrashTable?: string` — fallback trash collection name for trash strategy
- `DataSource.modelDefaults?: Partial<ModelDefaults>` — per-source model configuration defaults
- `DataSource.migrationDefaults?: MigrationDefaults` — per-source migration-level defaults
- `DataSource.migrations?: { transactional?: boolean; table?: string }` — migration transaction and table config
- `DataSource.idGenerator: IdGeneratorContract | undefined` — retrieves ID generator from driver; undefined for SQL drivers
- `DataSourceRegistryEvent` — union type `"registered" | "default-registered" | "connected" | "disconnected"`
- `DataSourceRegistryListener` — callback signature `(dataSource: DataSource) => void`
- `dataSourceRegistry.register(options: DataSourceOptions): DataSource` — creates, stores, and emits events for a new data source
- `dataSourceRegistry.clear(): void` — removes all registered sources and clears the default
- `dataSourceRegistry.on(event, listener): void` — subscribes a persistent listener to a registry event
- `dataSourceRegistry.once(event, listener): void` — subscribes a one-time listener to a registry event
- `dataSourceRegistry.off(event, listener): void` — removes a previously registered listener
- `dataSourceRegistry.get(name?: string): DataSource` — returns source by name, context override, or default; throws `MissingDataSourceError` if not found
- `dataSourceRegistry.getAllDataSources(): DataSource[]` — returns array of all registered data sources

## How it fits together
`DataSource` is a plain immutable value object created by `DataSourceRegistry.register()`; it holds a `DriverContract` reference and all source-level defaults that models and the migration runner inherit. The `dataSourceRegistry` singleton is the single source of truth for all active connections — upstream bootstrapping code calls `register()` once per driver, and downstream query/model/migration code calls `get()` to resolve the correct source. Driver `connected`/`disconnected` events are forwarded centrally through the registry so any part of the system can react to connection state without holding a direct driver reference. The `databaseDataSourceContext` (AsyncLocalStorage) allows per-request source overrides resolved transparently inside `get()`.

## Working examples
```typescript
import { dataSourceRegistry } from "./data-source-registry";
import type { DataSourceRegistryListener } from "./data-source-registry";

// Register a primary data source (first registered becomes default automatically)
const primary = dataSourceRegistry.register({
  name: "primary",
  driver: mongoDriver,
  isDefault: true,
  defaultDeleteStrategy: "trash",
  defaultTrashTable: "RecycleBin",
  migrations: { transactional: false, table: "_migrations" },
});

// Register a secondary read-replica source
dataSourceRegistry.register({
  name: "replica",
  driver: replicaDriver,
});

// React to connection events centrally
const onConnected: DataSourceRegistryListener = (ds) => {
  console.log(`[cascade] data source "${ds.name}" connected`);
};
dataSourceRegistry.on("connected", onConnected);

// Retrieve by name
const source = dataSourceRegistry.get("primary");
console.log(source.driver, source.isDefault); // DriverContract, true

// Access optional ID generator (NoSQL only)
const idGen = source.idGenerator;
if (idGen) {
  const id = await idGen.generateNextId({ table: "users" });
}

// Iterate all sources for graceful shutdown
for (const ds of dataSourceRegistry.getAllDataSources()) {
  await ds.driver.disconnect();
}

// Clean up in tests
dataSourceRegistry.clear();
```

## DO NOT
- Do NOT instantiate `DataSource` directly in application code — always call `dataSourceRegistry.register()` so driver events are forwarded and the default is tracked correctly
- Do NOT call `dataSourceRegistry.clear()` in production code — it is intended for test teardown and will silently break all subsequent `get()` calls
- Do NOT rely on `DataSource.idGenerator` for SQL drivers — it returns `undefined` because SQL engines use native `AUTO_INCREMENT`/sequences; use it only after a NoSQL driver that implements `getIdGenerator()`
- Do NOT store the result of `dataSourceRegistry.get()` long-term across async boundaries — use the context-aware `get()` each time so per-request source overrides via `databaseDataSourceContext` are respected
