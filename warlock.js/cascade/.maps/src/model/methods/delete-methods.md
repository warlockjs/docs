# delete-methods
source: model/methods/delete-methods.ts
description: Model deletion and record removal methods
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `DatabaseRemover` from `../../remover/database-remover`
- `DeleteStrategy` from `../../types`
- `RemoverResult` from `../../contracts`
- `ChildModel, Model` from `../model`

## Exports
- `destroyModel` — Delete single model instance with options [lines 6-12]
- `deleteRecords` — Delete multiple records by filter [lines 14-19]
- `deleteOneRecord` — Delete single record by filter [lines 21-26]

## Classes / Functions / Types / Constants

### `destroyModel(model: Model, options?: { strategy?: DeleteStrategy; skipEvents?: boolean }): Promise<RemoverResult>` [lines 6-12]
- Removes a model instance using DatabaseRemover with optional strategy and event skipping

### `deleteRecords(ModelClass: ChildModel<any>, filter?: Record<string, unknown>): Promise<number>` [lines 14-19]
- Deletes multiple records matching filter using driver's deleteMany

### `deleteOneRecord(ModelClass: ChildModel<any>, filter?: Record<string, unknown>): Promise<number>` [lines 21-26]
- Deletes single record matching filter using driver's delete
