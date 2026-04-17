# database-restorer
source: restorer/database-restorer.ts
description: Implements the full model restoration pipeline for trash and soft-delete strategies.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `DriverContract`, `UpdateOperations` from `../contracts/database-driver.contract`
- `RestorerContract`, `RestorerOptions`, `RestorerResult` from `../contracts/database-restorer.contract`
- `DataSource` from `../data-source/data-source`
- `Model` from `../model/model`
- `DeleteStrategy` from `../types`

## Exports
- `DatabaseRestorer` — orchestrates model restoration with conflict resolution  [lines 30-516]

## Classes / Functions / Types / Constants

### `DatabaseRestorer` [lines 30-516]
implements `RestorerContract`; restores trash or soft-deleted records.

#### `constructor(modelClass: typeof Model)` [lines 57-63]
Initializes restorer from model class; resolves driver and table.
side-effects: reads model class data source and driver references.

#### `restore(id, options?): Promise<RestorerResult>` [lines 74-152]
Restores single deleted record; handles ID conflict and events.
throws: `Error` if strategy is permanent, record not found, or ID conflict with `fail` mode.
side-effects: inserts or updates record in DB; emits `restoring`/`restored` events; mutates `model.isNew`.

#### `restoreAll(options?): Promise<RestorerResult>` [lines 160-310]
Restores all deleted records for the model table.
throws: `Error` if strategy is permanent or conflict in `fail` mode.
side-effects: inserts or updates records in DB; emits `restoring`/`restored` per record; mutates `model.isNew`.
