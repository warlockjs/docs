# delete-methods
source: model/methods/delete-methods.ts
description: Async deletion helpers wrapping DatabaseRemover and driver delete operations.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `DatabaseRemover` from `../../remover/database-remover`
- `DeleteStrategy` from `../../types`
- `RemoverResult` from `../../contracts`
- `ChildModel`, `Model` from `../model`

## Exports
- `destroyModel` — destroy a single model via DatabaseRemover  [lines 6-12]
- `deleteRecords` — bulk-delete records matching filter  [lines 14-19]
- `deleteOneRecord` — delete one record matching filter  [lines 21-26]

## Classes / Functions / Types / Constants
### `destroyModel(model, options?)` [lines 6-12]
- async
- throws: propagates errors from `DatabaseRemover.destroy`
- side-effects: removes model from database; may emit events unless `skipEvents`

### `deleteRecords(ModelClass, filter?)` [lines 14-19]
- async
- throws: propagates driver errors
- side-effects: deletes many rows from `ModelClass.table`

### `deleteOneRecord(ModelClass, filter?)` [lines 21-26]
- async
- throws: propagates driver errors
- side-effects: deletes one row from `ModelClass.table`
