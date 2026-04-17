# data-source-registry
source: data-source/data-source-registry.ts
description: Singleton registry that stores named DataSource instances, manages the default source, and forwards driver connection events
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- `EventEmitter` from `node:events`
- `databaseDataSourceContext` from `../context/database-data-source-context`
- `MissingDataSourceError` from `../errors/missing-data-source.error`
- `DataSource`, `DataSourceOptions` from `./data-source`

## Exports
- `DataSourceRegistryEvent` — Union type of registry event name strings  [lines 14-18]
- `DataSourceRegistryListener` — Callback type `(dataSource: DataSource) => void`  [line 23]
- `dataSourceRegistry` — Singleton `DataSourceRegistry` instance  [line 194]

## Classes / Functions / Types / Constants

### `DataSourceRegistryEvent` [lines 14-18]
- String literal union: `"registered" | "default-registered" | "connected" | "disconnected"`. Describes all events the registry can emit.

### `DataSourceRegistryListener` [line 23]
- Type alias for event callback: `(dataSource: DataSource) => void`.

### `DataSourceRegistry` (class, not directly exported) [lines 26-192]
- Internal class holding a `Map<string, DataSource>`, an optional default source pointer, and a Node.js `EventEmitter`. Exposed externally only via the `dataSourceRegistry` singleton.

#### `register(options: DataSourceOptions): DataSource` [lines 46-72]
- Creates a new `DataSource` from `options`, stores it by name, and optionally promotes it to default (when `options.isDefault` is true or no default exists yet). Emits `"registered"` always; emits `"default-registered"` when the source becomes default. Forwards driver `"connected"` and `"disconnected"` events to the registry emitter, passing the `DataSource` to listeners.

#### `clear(): void` [lines 77-80]
- Removes all registered data sources and clears the default source reference. Intended for test teardown or full resets.

#### `on(event: DataSourceRegistryEvent, listener: DataSourceRegistryListener): void` [lines 111-113]
- Subscribes a persistent listener to a registry event.

#### `once(event: DataSourceRegistryEvent, listener: DataSourceRegistryListener): void` [lines 123-125]
- Subscribes a one-shot listener that auto-removes after first invocation.

#### `off(event: DataSourceRegistryEvent, listener: DataSourceRegistryListener): void` [lines 133-135]
- Unsubscribes a previously registered listener.

#### `get(name?: string): DataSource` [lines 138-171]
- Resolves and returns a `DataSource`. Resolution priority: (1) context override from `databaseDataSourceContext` when `name` is omitted; (2) named lookup when `name` is provided; (3) default source when neither applies. Throws `MissingDataSourceError` if the resolved source is not found or no default is registered.

#### `getAllDataSources(): DataSource[]` [lines 189-191]
- Returns an array of all registered `DataSource` instances. Useful for batch operations such as disconnecting all drivers on shutdown.

### `dataSourceRegistry` [line 194]
- Module-level singleton of `DataSourceRegistry`. All application code interacts with this single shared instance.
