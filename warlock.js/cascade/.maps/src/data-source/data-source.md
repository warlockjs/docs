# data-source
source: data-source/data-source.ts
description: Defines DataSourceOptions and the DataSource class that couples a driver with its configuration metadata.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `DriverContract`, `IdGeneratorContract` from `../contracts`
- `DeleteStrategy`, `MigrationDefaults`, `ModelDefaults` from `../types`

## Exports
- `DataSourceOptions` — configuration shape for registering a data source  [lines 7-82]
- `DataSource` — class wrapping a driver with its metadata  [lines 110-178]

## Classes / Functions / Types / Constants

### type `DataSourceOptions`
[lines 7-82]
Configuration bag passed to DataSource constructor.
- `name: string` — unique data source identifier
- `driver: DriverContract` — bound database driver
- `isDefault?: boolean` — marks as default source
- `defaultDeleteStrategy?: DeleteStrategy` — fallback delete strategy
- `defaultTrashTable?: string` — fallback trash collection name
- `modelDefaults?: Partial<ModelDefaults>` — per-source model defaults
- `migrationDefaults?: MigrationDefaults` — per-source migration defaults
- `migrations?.transactional?: boolean` — wrap migrations in transactions
- `migrations?.table?: string` — migrations tracking table name

### class `DataSource`
[lines 110-178]
Immutable wrapper coupling a driver to its named configuration.

#### `readonly name: string`
[line 112]
Unique identifier for this data source.

#### `readonly driver: DriverContract`
[line 115]
Database driver for executing queries.

#### `readonly isDefault: boolean`
[line 118]
Whether this is the default data source.

#### `readonly defaultDeleteStrategy?: DeleteStrategy`
[line 121]
Fallback delete strategy for models on this source.

#### `readonly defaultTrashTable?: string`
[line 124]
Fallback trash collection name for trash strategy.

#### `readonly modelDefaults?: Partial<ModelDefaults>`
[line 127]
Default model configuration for this source.

#### `readonly migrationDefaults?: MigrationDefaults`
[line 130]
Migration-level defaults for this source.

#### `readonly migrations?`
[lines 133-136]
Migration configuration: transactional flag and table name.

#### `constructor(options: DataSourceOptions)`
[lines 143-152]
Assigns all options to readonly properties.

#### `get idGenerator(): IdGeneratorContract | undefined`
[lines 170-177]
Retrieves ID generator from driver via duck typing; undefined for SQL drivers.
