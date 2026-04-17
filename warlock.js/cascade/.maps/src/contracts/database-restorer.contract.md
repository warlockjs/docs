# database-restorer.contract
source: contracts/database-restorer.contract.ts
description: Contract interface and supporting types for the database restoration pipeline (trash and soft-delete strategies)
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- `Model` from `../model/model`

## Exports
- `RestorerContract` — Interface defining the restore/restoreAll API that all restorer implementations must satisfy  [lines 23-77]
- `RestorerOptions` — Options type controlling strategy override, ID conflict behaviour, and event suppression  [lines 82-110]
- `RestorerResult` — Result type returned after any restore operation  [lines 115-156]

## Classes / Functions / Types / Constants

### `RestorerContract` [lines 23-77]
- Interface that concrete restorer classes (e.g., `DatabaseRestorer`) must implement.
- Orchestration pipeline: strategy detection → record retrieval → ID conflict resolution → event emission (`restoring`/`restored`) → driver execution.

#### `restore(id: string | number, options?: RestorerOptions): Promise<RestorerResult>` [lines 53-56]
- Restores a single deleted record by its primary key.
- Strategy resolved in priority order: `options.strategy` → model static property → data source default.
- Throws `Error` if strategy is `"permanent"` (permanently deleted records cannot be restored), if record is not found in trash or soft-deleted set, or if ID conflicts and `onIdConflict` is `"fail"`.

#### `restoreAll(options?: RestorerOptions): Promise<RestorerResult>` [line 76]
- Restores all deleted records for the model's table.
- For `"trash"` strategy: reads all rows from the trash table and inserts them back. For `"soft"` strategy: clears `deletedAt` on all soft-deleted rows.
- Returns aggregate counts and a `conflicts` array if `onIdConflict` is `"assignNew"` and conflicts were encountered.

### `RestorerOptions` [lines 82-110]
- `strategy?: "trash" | "soft"` — Overrides model static and data source default; must be `"trash"` or `"soft"` (cannot restore permanently deleted records). Default: `undefined`.
- `onIdConflict?: "fail" | "assignNew"` — How to handle primary key collision in target table: `"assignNew"` auto-generates a new ID (default), `"fail"` throws an error.
- `skipEvents?: boolean` — When `true`, suppresses `restoring`/`restored` lifecycle event emission (silent restore). Default: `false`.

### `RestorerResult` [lines 115-156]
- `success: boolean` — Whether the overall restore operation succeeded.
- `restoredCount: number` — `1` for `restore()`; `N` for `restoreAll()` (total records restored).
- `strategy: "trash" | "soft"` — The delete strategy actually used for this restoration.
- `restoredRecord?: Model` — The restored record for single `restore()` calls; may carry a new ID if an ID conflict was resolved via `"assignNew"`.
- `restoredRecords?: Model[]` — All restored records for `restoreAll()` calls.
- `conflicts?: Array<{ id: string | number; reason: string }>` — List of ID conflicts that were auto-resolved during `restoreAll()`; only populated when `onIdConflict` is `"assignNew"` and conflicts occurred.
