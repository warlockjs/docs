# connect-to-database
source: utils/connect-to-database.ts
description: High-level utility for establishing a database connection, creating a DataSource, and registering it in the registry.
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- `DriverContract`, `TransactionContext` from `../contracts`
- `DataSource` from `../data-source/data-source`
- `dataSourceRegistry` from `../data-source/data-source-registry`
- `MongoDbDriver` from `../drivers/mongodb/mongodb-driver`
- `PostgresDriver` from `../drivers/postgres`
- `DeleteStrategy`, `MigrationDefaults`, `ModelDefaults` from `../types`

## Exports
- `DatabaseDriver` — Union type of supported driver name strings  [lines 11-11]
- `ModelDefaultConfig` — Alias for `Partial<ModelDefaults>`, used in connection config  [lines 30-30]
- `ConnectionOptions` — Generic connection configuration type  [lines 70-296]
- `connectToDatabase` — Async function that connects to a database and returns a registered DataSource  [lines 342-423]
- `getDatabaseDriver` — Returns the driver from the default data source  [lines 436-440]
- `transaction` — Shorthand for running a transaction on the default driver  [lines 446-451]

## Classes / Functions / Types / Constants

### `DatabaseDriver` [lines 11-11]
- String union type: `"mongodb" | "postgres" | "mysql"`.

### `ModelDefaultConfig` [lines 30-30]
- Re-export of `Partial<ModelDefaults>` for backward-compatibility and clarity in connection config context.

### `ConnectionOptions<TDriverOptions, TClientOptions>` [lines 70-296]
- Generic object type capturing all connection settings split into concern groups: shared config, connection details, driver options, client options, model options, migration options, data-source defaults, and migrations table config.
- Fields: `driver?`, `name?`, `isDefault?`, `database` (required), `logging?`, `uri?`, `host?`, `port?`, `username?`, `password?`, `authSource?`, `driverOptions?`, `clientOptions?`, `modelOptions?`, `migrationOptions?`, `defaultDeleteStrategy?`, `defaultTrashTable?`, `migrations?`.

#### `migrations` object [lines 275-295]
- `transactional?: boolean` — overrides driver default for transaction-wrapped migrations.
- `table?: string` — name of the migrations tracking table/collection (default `"_migrations"`).

### `connectToDatabase<TDriverOptions, TClientOptions>(options: ConnectionOptions): Promise<DataSource>` [lines 342-423]
- Instantiates the appropriate driver (`MongoDbDriver` or `PostgresDriver`) based on `options.driver` (defaults to `"mongodb"`).
- Throws `Error` for `"mysql"` (not yet implemented) or unknown driver values.
- Creates a `DataSource` and registers it via `dataSourceRegistry.register()`.
- Calls `driver.connect()` and re-throws on failure with a descriptive message that includes driver type and original error message.
- Returns the connected and registered `DataSource`.

### `getDatabaseDriver<T extends DriverContract>(): T` [lines 436-440]
- Retrieves the driver from the default registered data source via `dataSourceRegistry.get().driver`.
- Generic `T` allows callers to cast to a specific driver type (e.g., `PostgresDriver`).

### `transaction<T>(fn: (ctx: TransactionContext) => Promise<T>, options?: Record<string, unknown>): Promise<T>` [lines 446-451]
- Delegates to `getDatabaseDriver().transaction(fn, options)`.
- `fn` receives a `TransactionContext` and must return `Promise<T>`.
- `options` is an optional `Record<string, unknown>` for driver-specific transaction settings.
