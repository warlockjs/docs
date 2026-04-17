# data-source-registry
source: data-source/data-source-registry.ts
description: Singleton registry that stores named DataSource instances and emits lifecycle events for registration and connection state.
complexity: medium
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `EventEmitter` from `node:events`
- `databaseDataSourceContext` from `../context/database-data-source-context`
- `MissingDataSourceError` from `../errors/missing-data-source.error`
- `DataSource`, `DataSourceOptions` from `./data-source`

## Exports
- `DataSourceRegistryEvent` — union type of four registry event names  [lines 14-18]
- `DataSourceRegistryListener` — callback receiving a DataSource arg  [line 23]
- `dataSourceRegistry` — singleton DataSourceRegistry instance  [line 194]

## Classes / Functions / Types / Constants

### type `DataSourceRegistryEvent`
[lines 14-18]
Union of `"registered" | "default-registered" | "connected" | "disconnected"`.

### type `DataSourceRegistryListener`
[line 23]
Callback signature `(dataSource: DataSource) => void`.

### class `DataSourceRegistry`
[lines 26-192]
Manages named data sources; forwards driver events centrally.

#### `register(options: DataSourceOptions): DataSource`
[lines 46-72]
Creates and stores a DataSource; sets default if first or flagged.
side-effects: emits `registered`, optionally `default-registered`; forwards driver `connected`/`disconnected`.

#### `clear(): void`
[lines 77-80]
Removes all registered sources and clears the default.
side-effects: mutates internal sources map and defaultSource.

#### `on(event, listener): void`
[lines 111-113]
Subscribes a persistent listener to a registry event.

#### `once(event, listener): void`
[lines 123-125]
Subscribes a one-time listener to a registry event.

#### `off(event, listener): void`
[lines 133-135]
Removes a previously registered listener.

#### `get(name?: string): DataSource`
[lines 138-171]
Returns source by name, context override, or default.
throws: `MissingDataSourceError` if source not found.

#### `getAllDataSources(): DataSource[]`
[lines 189-191]
Returns array of all registered data sources.
