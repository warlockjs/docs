# restore-methods
source: model/methods/restore-methods.ts
description: Model restoration from trash/soft-delete
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `DatabaseRestorer` from `../../restorer/database-restorer`
- `ChildModel, Model` from `../model`

## Exports
- `restoreRecord` — Restore single soft-deleted record by id [lines 4-19]
- `restoreAllRecords` — Restore all soft-deleted records [lines 21-29]

## Classes / Functions / Types / Constants

### `restoreRecord<TModel extends Model>(ModelClass: ChildModel<TModel>, id: string | number, options?: { onIdConflict?: "fail" | "assignNew"; skipEvents?: boolean }): Promise<TModel>` [lines 4-19]
- Restores a soft-deleted record by primary key with conflict handling; throws if restoration fails

### `restoreAllRecords<TModel extends Model>(ModelClass: ChildModel<TModel>, options?: { onIdConflict?: "fail" | "assignNew"; skipEvents?: boolean }): Promise<TModel[]>` [lines 21-29]
- Restores all soft-deleted records for a model; returns empty array if none restored
