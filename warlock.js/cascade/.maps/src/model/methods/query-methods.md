# query-methods
source: model/methods/query-methods.ts
description: Static query helpers that build and execute database queries for a model class.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `PaginationOptions`, `PaginationResult`, `QueryBuilderContract`, `UpdateOperations` from `../../contracts`
- `DataSource` from `../../data-source/data-source`
- `dataSourceRegistry` from `../../data-source/data-source-registry`
- `RelationLoader` from `../../relations/relation-loader`
- `ChildModel`, `GlobalScopeDefinition`, `Model` from `../model`

## Exports
- `buildQuery` — builds configured query builder with scopes/events  [lines 12-57]
- `buildNewQueryBuilder` — creates raw query builder from data source  [lines 59-71]
- `findFirst` — returns first matching model or null  [lines 73-82]
- `findLast` — returns last matching model or null  [lines 84-94]
- `findAll` — returns all matching models  [lines 96-105]
- `countRecords` — returns count of matching records  [lines 107-116]
- `findById` — finds single model by primary key  [lines 118-124]
- `paginateRecords` — returns paginated result set  [lines 126-139]
- `findLatest` — returns records in latest order  [lines 141-150]
- `increaseField` — increments a numeric field by amount  [lines 152-160]
- `decreaseField` — decrements a numeric field by amount  [lines 162-170]
- `performAtomic` — runs atomic update operations on matched records  [lines 172-179]
- `updateById` — updates record fields by id  [lines 181-188]
- `findAndUpdateRecords` — atomically updates then returns records  [lines 190-197]
- `findOneAndUpdateRecord` — updates one record and returns it  [lines 199-208]
- `findAndReplaceRecord` — replaces one document and returns it  [lines 210-219]
- `findOneAndDeleteRecord` — deletes one record and returns it  [lines 221-236]
- `resolveDataSource` — resolves and caches data source for model  [lines 238-269]

## Classes / Functions / Types / Constants
### `buildQuery<TModel>`
[lines 12-57]
- Builds query builder; applies global/local scopes, hydration, eager relation loading, fetching events.
- side-effects: emits `fetching` event; registers `onFetched` callback that emits `fetched` and loads relations

### `buildNewQueryBuilder<TModel>`
[lines 59-71]
- Instantiates query builder from custom builder class or driver.

### `findFirst<TModel>`  async
[lines 73-82]
- throws: propagates query errors

### `findLast<TModel>`  async
[lines 84-94]
- throws: propagates query errors

### `findAll<TModel>`  async
[lines 96-105]
- throws: propagates query errors

### `countRecords<TModel>`
[lines 107-116]
- throws: propagates query errors

### `findById<TModel>`  async
[lines 118-124]
- throws: propagates query errors

### `paginateRecords<TModel>`  async
[lines 126-139]
- throws: propagates query errors

### `findLatest<TModel>`  async
[lines 141-150]
- throws: propagates query errors

### `increaseField<TModel>`
[lines 152-160]
- throws: propagates driver errors

### `decreaseField<TModel>`
[lines 162-170]
- throws: propagates driver errors

### `performAtomic<TModel>`  async
[lines 172-179]
- throws: propagates driver errors

### `updateById<TModel>`  async
[lines 181-188]
- throws: propagates driver errors

### `findAndUpdateRecords<TModel>`  async
[lines 190-197]
- throws: propagates driver errors

### `findOneAndUpdateRecord<TModel>`  async
[lines 199-208]
- throws: propagates driver errors

### `findAndReplaceRecord<TModel>`  async
[lines 210-219]
- throws: propagates driver errors

### `findOneAndDeleteRecord<TModel>`  async
[lines 221-236]
- side-effects: resets dirty tracker on returned model
- throws: propagates driver errors

### `resolveDataSource<TModel>`
[lines 238-269]
- side-effects: applies driver/data-source model defaults once per class; sets `_defaultsApplied` flag
