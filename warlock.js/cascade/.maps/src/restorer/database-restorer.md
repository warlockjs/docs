# database-restorer
source: restorer/database-restorer.ts
description: Database restorer service orchestrating model restoration from trash or soft-delete state.
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-opus-4-7
last-updated-by: claude-opus-4-7

## Imports
- `DriverContract`, `UpdateOperations` from `../contracts/database-driver.contract`
- `RestorerContract`, `RestorerOptions`, `RestorerResult` from `../contracts/database-restorer.contract`
- `DataSource` from `../data-source/data-source`
- `Model` from `../model/model`
- `DeleteStrategy` from `../types`

## Exports
- `DatabaseRestorer` — Restorer service class implementing `RestorerContract` for single and bulk record restoration.  [lines 30-516]

## Classes / Functions / Types / Constants

### `DatabaseRestorer` [lines 30-516]
- Implements `RestorerContract`. Orchestrates the complete restoration pipeline: strategy detection (trash vs soft delete), record retrieval, ID conflict resolution, event emission (`restoring`, `restored`), and driver execution (insert back into original table or clear `deletedAt`).
- Constructor captures private references to the model class, its data source, the driver, table name, and primary key.

#### `constructor(modelClass: typeof Model)` [lines 57-63]
- Initializes the restorer with the model's data source, driver, table, and primary key.
- side-effects: reads the model class's data source and driver references.

#### `restore(id: string | number, options: RestorerOptions = {}): Promise<RestorerResult>` [lines 74-152]
- Restores a single deleted record by primary key. Resolves strategy (rejects `permanent`), fetches the record via `fetchRecordByStrategy`, strips `deletedAt`/`originalTable` metadata, handles ID conflict via `handleIdConflict`, constructs a temporary model instance, emits `restoring`/`restored` events unless `skipEvents`. For `trash` strategy it inserts back into the original table and deletes from the trash table; for `soft` it issues an `$unset` update on the configured `deletedAtColumn`.
- Returns `{ success: true, restoredCount: 1, strategy, restoredRecord }`.
- throws: `Error` when strategy is `permanent`, record not found, or ID conflict with `onIdConflict: "fail"`.
- side-effects: writes to DB via driver; emits events on a temporary model; mutates `model.isNew`.

#### `restoreAll(options: RestorerOptions = {}): Promise<RestorerResult>` [lines 160-310]
- Restores every deleted record for the model's table under the resolved strategy (rejects `permanent`). Fetches candidates via `fetchAllRecordsByStrategy`, iterates them, checks ID existence via `checkIdExists`; on conflict either throws (when `onIdConflict === "fail"`) or assigns a new ID via `assignNewId` and records a conflict entry.
- For each record emits `restoring`/`restored` events (unless `skipEvents`), performs the strategy-specific write (insert for `trash`, `$unset` `deletedAt` for `soft`), and for `trash` also removes the source row from the trash table. Errors are caught and recorded as conflicts when `onIdConflict !== "fail"`.
- Returns `{ success: true, restoredCount, restoredRecords, strategy, conflicts? }`; short-circuits with `restoredCount: 0` when no records are found.
- throws: `Error` when strategy is `permanent`, or when a per-record error occurs under `onIdConflict: "fail"`.
- side-effects: writes to DB via driver per record; emits events per record; mutates `model.isNew`.
