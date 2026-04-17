# data-source
source: data-source/data-source.ts
description: DataSourceOptions type and DataSource class coupling a named driver with per-source model, migration, and delete-strategy defaults
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- `DriverContract`, `IdGeneratorContract` from `../contracts`
- `DeleteStrategy`, `MigrationDefaults`, `ModelDefaults` from `../types`

## Exports
- `DataSourceOptions` — Configuration object type for registering a data source  [lines 7-82]
- `DataSource` — Class wrapping a driver with its metadata and defaults  [lines 110-178]

## Classes / Functions / Types / Constants

### `DataSourceOptions` [lines 7-82]
- Plain object type consumed by `DataSource` constructor and `DataSourceRegistry.register()`. All fields except `name` and `driver` are optional.
- `name: string` — Unique identifier for the data source.
- `driver: DriverContract` — The database driver instance.
- `isDefault?: boolean` — Promotes this source as the registry default.
- `defaultDeleteStrategy?: DeleteStrategy` — Fallback delete strategy for models; defaults to `"permanent"` when unset.
- `defaultTrashTable?: string` — Fallback trash collection name for the `"trash"` strategy; defaults to `{table}Trash` pattern when unset.
- `modelDefaults?: Partial<ModelDefaults>` — Per-source model configuration overrides.
- `migrationDefaults?: MigrationDefaults` — Per-source migration defaults (e.g. UUID strategy).
- `migrations?.transactional?: boolean` — Whether to wrap migrations in transactions; driver default applies when omitted.
- `migrations?.table?: string` — Name of the migrations tracking table; defaults to `"_migrations"`.

### `DataSource` [lines 110-178]
- Immutable value object that couples a named `DriverContract` with its configuration defaults. Constructed from `DataSourceOptions`; all public properties are `readonly`.

#### `constructor(options: DataSourceOptions)` [lines 143-152]
- Assigns all options to readonly properties. `isDefault` is coerced to `boolean` via `Boolean()`.

#### `get idGenerator(): IdGeneratorContract | undefined` [lines 170-177]
- Duck-type checks the driver for a `getIdGenerator()` method and returns its result, or `undefined`. NoSQL drivers (e.g. MongoDB) expose this; SQL drivers return `undefined` as they rely on native AUTO_INCREMENT/SERIAL.

#### Public readonly properties [lines 112-136]
- `name: string` — Unique data source name.
- `driver: DriverContract` — Bound database driver.
- `isDefault: boolean` — Whether this is the default source.
- `defaultDeleteStrategy?: DeleteStrategy` — Source-level delete strategy default.
- `defaultTrashTable?: string` — Source-level trash table name default.
- `modelDefaults?: Partial<ModelDefaults>` — Source-level model config defaults.
- `migrationDefaults?: MigrationDefaults` — Source-level migration defaults.
- `migrations?: { transactional?: boolean; table?: string }` — Migration execution settings.
