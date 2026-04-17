# query-methods
source: model/methods/query-methods.ts
description: Standalone exported functions that implement the static query-layer methods mixed into Model subclasses, covering query builder construction, record retrieval, mutation, and data-source resolution.
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- `PaginationOptions`, `PaginationResult`, `QueryBuilderContract`, `UpdateOperations` from `../../contracts`
- `DataSource` from `../../data-source/data-source`
- `dataSourceRegistry` from `../../data-source/data-source-registry`
- `RelationLoader` from `../../relations/relation-loader`
- `ChildModel`, `GlobalScopeDefinition`, `Model` from `../model`

## Exports
- `buildQuery` — Constructs and configures a fully scoped query builder for a model class.  [lines 12-57]
- `buildNewQueryBuilder` — Creates a raw query builder from the model's driver or custom builder class.  [lines 59-71]
- `findFirst` — Fetches the first matching record using an optional filter.  [lines 73-82]
- `findLast` — Fetches the last matching record using an optional filter.  [lines 84-94]
- `findAll` — Fetches all matching records using an optional filter.  [lines 96-105]
- `countRecords` — Returns the count of matching records using an optional filter.  [lines 107-116]
- `findById` — Fetches a single record by primary key value.  [lines 118-124]
- `paginateRecords` — Paginates records with optional filter, page, and limit options.  [lines 126-139]
- `findLatest` — Fetches all matching records ordered latest-first.  [lines 141-150]
- `increaseField` — Increments a numeric field on all records matching a filter by a given amount.  [lines 152-160]
- `decreaseField` — Decrements a numeric field on all records matching a filter by a given amount.  [lines 162-170]
- `performAtomic` — Executes a raw atomic update operation via the driver and returns modified count.  [lines 172-179]
- `updateById` — Updates fields on a record identified by id using `$set` and returns modified count.  [lines 181-188]
- `findAndUpdateRecords` — Atomically applies update operations then returns all matching records.  [lines 190-197]
- `findOneAndUpdateRecord` — Atomically updates and returns the first matching record as a model instance.  [lines 199-208]
- `findAndReplaceRecord` — Replaces the first matching record with a new document and returns it as a model instance.  [lines 210-219]
- `findOneAndDeleteRecord` — Finds and deletes the first matching record, returning it as a hydrated model instance with a reset dirty tracker.  [lines 221-236]
- `resolveDataSource` — Resolves the correct `DataSource` for a model class and lazily applies driver/data-source model defaults once per class.  [lines 238-269]

## Classes / Functions / Types / Constants

### `buildQuery<TModel extends Model>(ModelClass: ChildModel<TModel>, BaseModel: typeof Model): QueryBuilderContract<TModel>` [lines 12-57]
- Calls `ModelClass.newQueryBuilder()`, merges global scopes from `BaseModel` and `ModelClass` into a single `Map`, and sets `pendingGlobalScopes`, `availableLocalScopes`, `disabledGlobalScopes`, `relationDefinitions`, and `modelClass` on the builder. Emits a `"fetching"` event via `ModelClass.events()`, registers a hydration callback via `queryBuilder.hydrate`, and registers an `onFetched` callback that eager-loads relations via `RelationLoader` and emits a `"fetched"` event.

### `buildNewQueryBuilder<TModel extends Model>(ModelClass: ChildModel<TModel>): QueryBuilderContract<TModel>` [lines 59-71]
- If `ModelClass.builder` is set, instantiates that custom builder class with `(ModelClass.table, dataSource)`. Otherwise delegates to `dataSource.driver.queryBuilder(ModelClass.table)`.

### `findFirst<TModel extends Model>(ModelClass: ChildModel<TModel>, filter?: Record<string, unknown>): Promise<TModel | null>` [lines 73-82]
- Opens a query via `ModelClass.query()`, optionally applies `where(filter)`, and returns `.first()`.

### `findLast<TModel extends Model>(ModelClass: ChildModel<TModel>, filter?: Record<string, unknown>): Promise<TModel | null>` [lines 84-94]
- Opens a query, optionally applies `where(filter)`, and returns `.last()`.

### `findAll<TModel extends Model>(ModelClass: ChildModel<TModel>, filter?: Record<string, unknown>): Promise<TModel[]>` [lines 96-105]
- Opens a query, optionally applies `where(filter)`, and returns `.get()`.

### `countRecords<TModel extends Model>(ModelClass: ChildModel<TModel>, filter?: Record<string, unknown>): Promise<number>` [lines 107-116]
- Opens a query, optionally applies `where(filter)`, and returns `.count()`.

### `findById<TModel extends Model>(ModelClass: ChildModel<TModel>, id: string | number): Promise<TModel | null>` [lines 118-124]
- Opens a query with `where(ModelClass.primaryKey, id)` and returns `.first()`.

### `paginateRecords<TModel extends Model>(ModelClass: ChildModel<TModel>, options: PaginationOptions & { filter?: Record<string, unknown> } = {}): Promise<PaginationResult<TModel>>` [lines 126-139]
- Opens a query, optionally applies `where(options.filter)`, and calls `.paginate({ limit: options.limit, page: options.page })`.

### `findLatest<TModel extends Model>(ModelClass: ChildModel<TModel>, filter?: Record<string, unknown>): Promise<TModel[]>` [lines 141-150]
- Opens a query, optionally applies `where(filter)`, and calls `.latest()`. Return value is cast through `unknown as TModel[]`.

### `increaseField<TModel extends Model>(ModelClass: ChildModel<TModel>, filter: Record<string, unknown>, field: string, amount: number): Promise<number>` [lines 152-160]
- Opens a query with `where(filter)` and calls `.increment(field, amount)`.

### `decreaseField<TModel extends Model>(ModelClass: ChildModel<TModel>, filter: Record<string, unknown>, field: string, amount: number): Promise<number>` [lines 162-170]
- Opens a query with `where(filter)` and calls `.decrement(field, amount)`.

### `performAtomic<TModel extends Model>(ModelClass: ChildModel<TModel>, filter: Record<string, unknown>, operations: UpdateOperations): Promise<number>` [lines 172-179]
- Calls `ModelClass.getDriver().atomic(ModelClass.table, filter, operations)` and returns `result.modifiedCount`.

### `updateById<TModel extends Model>(ModelClass: ChildModel<TModel>, id: string | number, data: Record<string, unknown>): Promise<number>` [lines 181-188]
- Calls `driver.update(ModelClass.table, { id }, { $set: data })` and returns `result.modifiedCount`. Note: filter key is the literal string `"id"`, not `ModelClass.primaryKey`.

### `findAndUpdateRecords<TModel extends Model>(ModelClass: ChildModel<TModel>, filter: Record<string, unknown>, update: UpdateOperations): Promise<TModel[]>` [lines 190-197]
- Calls `performAtomic(ModelClass, filter, update)` then re-fetches all matching records via `ModelClass.query().where(filter).get()`.

### `findOneAndUpdateRecord<TModel extends Model>(ModelClass: ChildModel<TModel>, filter: Record<string, unknown>, update: UpdateOperations): Promise<TModel | null>` [lines 199-208]
- Calls `driver.findOneAndUpdate(ModelClass.table, filter, update)`. Returns `null` if no document found; otherwise constructs a new model instance via `new ctor(result)`.

### `findAndReplaceRecord<TModel extends Model>(ModelClass: ChildModel<TModel>, filter: Record<string, unknown>, document: Record<string, unknown>): Promise<TModel | null>` [lines 210-219]
- Calls `driver.replace(ModelClass.table, filter, document)`. Returns `null` if no document found; otherwise constructs a new model instance via `new ctor(result)`.

### `findOneAndDeleteRecord<TModel extends Model>(ModelClass: ChildModel<TModel>, filter: Record<string, unknown>, options?: Record<string, unknown>): Promise<TModel | null>` [lines 221-236]
- Calls `driver.findOneAndDelete(ModelClass.table, filter, options)`. Returns `null` if not found; otherwise hydrates the result via `ModelClass.hydrate`, resets `model.dirtyTracker`, and returns the model.

### `resolveDataSource<TModel extends Model>(ModelClass: ChildModel<TModel>): DataSource` [lines 238-269]
- Resolves `DataSource` by checking `ModelClass.dataSource`: a string name is looked up in `dataSourceRegistry`, a `DataSource` object is used directly, and `undefined` falls back to the default registry entry. On first call per class (guarded by own-property `_defaultsApplied`), merges `driver.modelDefaults` with `dataSource.modelDefaults` (data-source defaults win on conflict) and calls `ModelClass.applyModelDefaults(mergedDefaults)`, then sets `_defaultsApplied = true`.
