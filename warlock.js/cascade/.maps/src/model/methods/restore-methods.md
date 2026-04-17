# restore-methods
source: model/methods/restore-methods.ts
description: Async helpers to restore soft-deleted model records via DatabaseRestorer.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `DatabaseRestorer` from `../../restorer/database-restorer`
- `ChildModel`, `Model` from `../model`

## Exports
- `restoreRecord` — restores single soft-deleted record by id  [lines 4-19]
- `restoreAllRecords` — restores all soft-deleted records for model  [lines 21-29]

## Classes / Functions / Types / Constants
### `restoreRecord<TModel>`  async
[lines 4-19]
- Delegates to `DatabaseRestorer.restore`; throws if no record returned.
- throws: `Error` when restored record is missing from result

### `restoreAllRecords<TModel>`  async
[lines 21-29]
- Delegates to `DatabaseRestorer.restoreAll`; returns empty array when none restored.
- throws: propagates restorer errors
