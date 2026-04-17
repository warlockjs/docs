# migration
source: migration/migration.ts
description: Abstract base class and contract for database migrations with a full fluent DDL API.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `ColumnDefinition`, `ForeignKeyDefinition`, `FullTextIndexOptions`, `GeoIndexOptions`, `IndexDefinition`, `MigrationDriverContract`, `TableIndexInformation`, `VectorIndexOptions` from `../contracts/migration-driver.contract`
- `DataSource` from `../data-source/data-source`
- `ChildModel`, `Model` from `../model/model`
- `MigrationDefaults` from `../types`
- `DatabaseDriver` from `../utils/connect-to-database`
- `ColumnBuilder` from `./column-builder`
- `ForeignKeyBuilder` from `./foreign-key-builder`

## Exports
- `OperationType` — union of all supported migration operation strings  [lines 22-54]
- `PendingOperation` — queued operation with type and payload  [lines 59-62]
- `MigrationContract` — full interface for a migration class  [lines 67-623]
- `MigrationConstructor` — constructor interface with static properties  [lines 628-634]
- `Migration` — abstract base class implementing MigrationContract  [lines 684-end]

## Classes / Functions / Types / Constants

### `OperationType` [lines 22-54]
- Union string type of every DDL/DML operation a migration can queue.

### `PendingOperation` [lines 59-62]
- Immutable tuple of operation type and opaque payload for queuing.

### `MigrationContract` [lines 67-623]
- Interface defining the complete public migration API surface.

### `MigrationConstructor` [lines 628-634]
- Constructor interface with optional static migrationName/createdAt/order.

### `Migration` [lines 684-end]
- Abstract base providing fluent column/index/FK methods that queue operations.
- side-effects: accumulates `pendingOperations`; `toSQL()` clears the queue

#### `static for(model)` [lines 801-808]
- Returns anonymous abstract subclass bound to model's table/dataSource.

#### `setDriver(driver)` [lines 822-824]
- Injects migration driver instance before up/down execution.

#### `setMigrationDefaults(defaults?)` [lines 832-834]
- Stores DataSource migration defaults on the instance.

#### `getDriver()` [lines 841-843]
- Returns the injected MigrationDriverContract driver.

#### `execute()` [lines 863-869]
- Deprecated; executes pending ops directly through driver.
- throws: propagates driver errors

#### `toSQL()` [lines 892-897]
- Serializes pending operations to SQL strings and clears the queue.
- side-effects: clears pendingOperations array

#### `up()` [line 765]
- Abstract; subclass defines forward schema changes.

#### `down()` [line 773]
- Abstract; subclass defines rollback schema changes.
