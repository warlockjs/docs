# connect-to-database
source: utils/connect-to-database.ts
description: Provides the high-level connectToDatabase utility and supporting types for establishing and registering database connections across supported drivers.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `DriverContract`, `TransactionContext` from `../contracts`
- `DataSource` from `../data-source/data-source`
- `dataSourceRegistry` from `../data-source/data-source-registry`
- `MongoDbDriver` from `../drivers/mongodb/mongodb-driver`
- `PostgresDriver` from `../drivers/postgres`
- `DeleteStrategy`, `MigrationDefaults`, `ModelDefaults` from `../types`

## Exports
- `DatabaseDriver` — union of supported driver name strings  [line 11]
- `ModelDefaultConfig` — partial model defaults for connection config  [line 30]
- `ConnectionOptions` — generic connection configuration type  [lines 70-296]
- `connectToDatabase` — creates, registers, and connects a DataSource  [lines 342-423]
- `getDatabaseDriver` — returns current driver from default DataSource  [lines 436-440]
- `transaction` — shorthand wrapper for driver transaction method  [lines 446-451]

## Classes / Functions / Types / Constants

### `DatabaseDriver`
type  [line 11]
Union: `"mongodb" | "postgres" | "mysql"`.

### `ModelDefaultConfig`
type  [line 30]
Alias for `Partial<ModelDefaults>`.

### `ConnectionOptions<TDriverOptions, TClientOptions>`
type  [lines 70-296]
Shared + driver-specific + client + model connection config shape.

### `connectToDatabase`
async function  [lines 342-423]
throws: `Error` if driver unknown, MySQL used, or connect fails.
side-effects: instantiates driver, creates DataSource, calls `dataSourceRegistry.register`, calls `driver.connect`.
Instantiates driver, registers DataSource, opens connection.

### `getDatabaseDriver`
function  [lines 436-440]
Returns typed driver from the default registered DataSource.

### `transaction`
async function  [lines 446-451]
throws: propagates driver transaction errors.
Delegates transaction execution to the default driver.
