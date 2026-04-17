# model
source: model/model.ts
description: Abstract base class that powers all Cascade models — provides typed accessors, dirty tracking, lifecycle events, relations, scopes, sync operations, and a unified static/instance API over the data-source/driver layer.
complexity: complex
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-opus-4-7
last-updated-by: claude-opus-4-7

## Imports
- `type GenericObject` from `@mongez/reinforcements`
- `type ObjectValidator` from `@warlock.js/seal`
- `type DriverContract, PaginationOptions, PaginationResult, RemoverResult, UpdateOperations, WriterOptions` from `../contracts`
- `QueryBuilderContract, WhereCallback, WhereObject, WhereOperator` from `../contracts`
- `type DataSource` from `../data-source/data-source`
- `DatabaseDirtyTracker` from `../database-dirty-tracker`
- `type ModelEventListener, ModelEventName` from `../events/model-events`
- `ModelEvents` from `../events/model-events`
- `type ModelSnapshot` from `../relations/relation-hydrator`
- `RelationLoader` from `../relations/relation-loader`
- `modelSync` from `../sync/model-sync`
- `type ModelSyncOperationContract` from `../sync/types`
- `type DeleteStrategy, StrictMode` from `../types`
- `decrementField, getBooleanField, getFieldValue, getNumberField, getOnlyFields, getStringField, hasField, incrementField, mergeFields, setFieldValue, unsetFields` from `./methods/accessor-methods`
- `deleteOneRecord, deleteRecords, destroyModel` from `./methods/delete-methods`
- `checkHasChanges, checkIsDirty, getDirtyColumns, getDirtyColumnsWithValues, getRemovedColumns` from `./methods/dirty-methods`
- `cloneModel, deepFreezeObject, hydrateModel, modelFromSnapshot, modelToSnapshot, replaceModelData, serializeModel` from `./methods/hydration-methods`
- `emitModelEvent, offModelEvent, onceModelEvent, onModelEvent` from `./methods/instance-event-methods`
- `applyDefaultsToModel, generateModelNextId, performAtomicDecrement, performAtomicIncrement, performAtomicUpdate` from `./methods/meta-methods`
- `buildNewQueryBuilder, buildQuery, countRecords, decreaseField, findAll, findAndReplaceRecord, findAndUpdateRecords, findById, findFirst, findLast, findLatest, findOneAndDeleteRecord, findOneAndUpdateRecord, increaseField, paginateRecords, performAtomic, resolveDataSource, updateById` from `./methods/query-methods`
- `restoreAllRecords, restoreRecord` from `./methods/restore-methods`
- `addGlobalModelScope, addLocalModelScope, removeGlobalModelScope, removeLocalModelScope` from `./methods/scope-methods`
- `modelToJSON` from `./methods/serialization-methods`
- `cleanupModelEvents, getGlobalEvents, getModelEvents, offStaticEvent, onceStaticEvent, onStaticEvent` from `./methods/static-event-methods`
- `createManyRecords, createRecord, findOrCreateRecord, saveModel, upsertRecord` from `./methods/write-methods`
- `type ChildModel, GlobalScopeDefinition, GlobalScopeOptions, LocalScopeCallback, ModelSchema` from `./model.types`
- `getAllModelsFromRegistry, getModelFromRegistry` from `./register-model`

## Exports
- `Model` (abstract class) — Base class that powers all Cascade models with typed data access, dirty tracking, lifecycle events, relations, scopes, and static query/write APIs.  [lines 153-2292]
- `ChildModel` (re-export type) — Constructor-with-statics type used for static `this`-typing across model methods.  [lines 115-122]
- `GlobalScopeDefinition` (re-export type) — Shape of a registered global scope (callback + options).  [lines 115-122]
- `GlobalScopeOptions` (re-export type) — Options accepted by `addGlobalScope` (e.g. `timing`).  [lines 115-122]
- `LocalScopeCallback` (re-export type) — Signature for a local scope callback.  [lines 115-122]
- `ModelSchema` (re-export type) — Default schema shape constraint for model generics.  [lines 115-122]
- `ScopeTiming` (re-export type) — `'before' | 'after'` ordering for global scopes.  [lines 115-122]

## Classes / Functions / Types / Constants

### `Model<TSchema extends ModelSchema = ModelSchema>` [lines 153-2292]
- Abstract base class for all Cascade models. Wraps raw data in a rich API with dirty tracking, event lifecycle, relation loading, scopes, sync, and static query/CRUD helpers.
- side-effects: Registers a dirty tracker on construction via the data source's driver; interacts with the global model registry, data-source registry, and sync orchestrator.
- throws: Constructor indirectly throws if no data source is resolvable (via `self().getDriver()`); various methods throw via delegated helpers (validation errors, missing records, ID conflicts, etc.).

#### Static properties
- `static table: string` [line 166] — table/collection name; must be provided by each subclass.
- `static resource?: any` [line 180] — optional resource class used for `toJSON` conversion.
- `static resourceColumns?: string[]` [line 186] — columns passed to the resource during JSON conversion.
- `static toJsonColumns?: string[]` [line 199] — optional whitelist of columns for `toJSON` when no `resource`.
- `static dataSource?: string | DataSource` [line 216] — data-source name or instance (falls back to default).
- `static builder?: new (...args: any[]) => QueryBuilderContract<Model>` [line 221] — optional custom query builder class.
- `static primaryKey: string = "id"` [line 239] — primary key column name.
- `static embed?: string[]` [line 244] — fields emitted when the document is embedded inside another model.
- `static schema?: ObjectValidator` [line 266] — validation/casting schema from `@warlock.js/seal`.
- `static strictMode: StrictMode = "strip"` [line 289] — behavior for unknown fields (`strip` / `fail` / `allow`).
- `static autoGenerateId = true` [line 313] — auto-generate sequential `id` on insert (NoSQL).
- `static initialId?: number` [line 327] — first ID value for auto-generation.
- `static randomInitialId?: boolean | (() => number)` [line 350] — randomize initial ID.
- `static incrementIdBy?: number = 1` [line 366] — ID increment step.
- `static randomIncrement?: boolean | (() => number)` [line 389] — randomize increment step.
- `static createdAtColumn?: string | false` [line 394] — created-at column name (or `false` to disable).
- `static updatedAtColumn?: string | false` [line 399] — updated-at column name (or `false` to disable).
- `static deleteStrategy?: DeleteStrategy` [line 419] — `"trash" | "permanent" | "soft"`.
- `static deletedAtColumn: string | false = "deletedAt"` [line 435] — column for soft-delete timestamps.
- `static trashTable?: string` [line 450] — override for trash collection/table.
- `static globalScopes = new Map<string, GlobalScopeDefinition>()` [line 456] — global scopes auto-applied to queries.
- `static localScopes = new Map<string, LocalScopeCallback>()` [line 462] — opt-in local scopes.
- `static relations: Record<string, any> = {}` [line 493] — relation definitions (hasMany/hasOne/belongsTo/belongsToMany).

#### Instance properties
- `public isNew = true` [line 503] — flag indicating unsaved state (drives insert vs. update).
- `public data: TSchema` [line 510] — raw mutable data backing the model.
- `public readonly dirtyTracker: DatabaseDirtyTracker` [line 522] — change tracker for efficient partial updates.
- `public events: ModelEvents<any> = new ModelEvents()` [line 528] — per-instance event emitter.
- `public loadedRelations: Map<string, any> = new Map()` [line 544] — loaded relation data by name.
- `protected isActiveColumn = "isActive"` [line 549] — column name for the `isActive` getter (subclass-overridable).

#### `constructor(initialData: Partial<TSchema> = {})` [lines 563-566]
- Stores `initialData` as `this.data` and initializes the dirty tracker via the resolved driver.

#### `load(...relations: string[]): Promise<this>` [lines 593-598]
- Lazily loads one or more relations into this instance using `RelationLoader`; returns `this` for chaining.

#### `isLoaded(relationName: string): boolean` [lines 616-618]
- Returns whether the named relation has been loaded.

#### `getRelation<TRelation = any>(relationName: string): TRelation | undefined` [lines 636-638]
- Returns the loaded relation value or `undefined`.

#### `static getModel(name: string)` [lines 656-658]
- Returns a registered model class by name from the global registry.

#### `static getAllModels()` [lines 675-677]
- Returns the full map of registered model classes.

#### `static sync<TModel extends Model = Model>(this: ChildModel<TModel>, TargetModel: ChildModel<Model>, targetField: string): ModelSyncOperationContract` [lines 699-705]
- Registers a single-embedded sync operation: when this model updates, `TargetModel.targetField` is updated.

#### `static syncMany<TModel extends Model = Model>(this: ChildModel<TModel>, TargetModel: ChildModel<Model>, targetField: string): ModelSyncOperationContract` [lines 723-729]
- Registers an array-embedded sync operation on a target array field.

#### `get id(): number | string` [lines 734-736]
- Returns `get("id")`.

#### `get uuid(): string` [lines 741-743]
- Returns `get("id")` (aliased as string).

#### `get<TKey>(field, defaultValue?): TSchema[TKey] | any` [lines 760-769]
- Overloaded field accessor supporting typed keys and dot notation; returns value or `defaultValue`.

#### `only<TKey>(fields: TKey[] | string[]): Record<TKey | string, unknown>` [lines 774-778]
- Returns a sub-object containing only the listed fields.

#### `string(key: string, defaultValue?: string): string | undefined` [lines 783-785]
- Typed string field accessor.

#### `number(key: string, defaultValue?: number): number | undefined` [lines 790-792]
- Typed number field accessor.

#### `boolean(key: string, defaultValue?: boolean): boolean | undefined` [lines 797-799]
- Typed boolean field accessor.

#### `set<TKey>(field, value): this` [lines 816-820]
- Sets a field value (supports dot notation) and marks dirty; returns `this`.

#### `has<TKey>(field): boolean` [lines 836-840]
- Checks for existence of a field (supports dot notation).

#### `increment<TKey>(field, amount?): this` [lines 845-849]
- Increments a numeric field in-memory and marks dirty.

#### `decrement<TKey>(field, amount?): this` [lines 854-858]
- Decrements a numeric field in-memory and marks dirty.

#### `unset(...fields: string[]): this` [lines 874-878]
- Removes one or more fields and records them as removed in the dirty tracker.

#### `merge(values): this` [lines 894-898]
- Deep-merges partial values, marking changed fields dirty.

#### `atomicUpdate(operations: Record<string, unknown>): Promise<number>` [lines 906-908]
- Performs an atomic update on the current record using its `id`.

#### `atomicIncrement<T extends keyof TSchema & string>(field: T, amount?: number = 1): Promise<number>` [lines 915-920]
- Atomically increments a field in the database without saving the model.

#### `atomicDecrement<T extends keyof TSchema & string>(field: T, amount?: number = 1): Promise<number>` [lines 927-932]
- Atomically decrements a field in the database without saving the model.

#### `get isActive(): boolean` [lines 937-939]
- Returns the value of `isActiveColumn` as a boolean.

#### `get createdAt(): Date | undefined` [lines 944-950]
- Returns the `createdAtColumn` value as a Date (or `undefined` if column disabled).

#### `get updatedAt(): Date | undefined` [lines 955-961]
- Returns the `updatedAtColumn` value as a Date (or `undefined` if column disabled).

#### `isCreatedBy(user: Model | GenericObject): boolean` [lines 966-968]
- Compares `createdBy.id` against `user.id`.

#### `hasChanges(): boolean` [lines 983-985]
- Returns whether any fields are dirty or removed.

#### `isDirty(column: string): boolean` [lines 999-1001]
- Returns whether a specific column has been modified.

#### `getDirtyColumnsWithValues(): Record<string, { oldValue: unknown; newValue: unknown }>` [lines 1015-1017]
- Returns all dirty columns with their before/after values.

#### `getRemovedColumns(): string[]` [lines 1030-1032]
- Returns names of fields that were removed since load.

#### `getDirtyColumns(): string[]` [lines 1045-1047]
- Returns names of dirty fields.

#### `emitEvent<TContext>(event: ModelEventName, context?: TContext): Promise<void>` [lines 1064-1069]
- Emits a lifecycle event to both instance and global listeners.

#### `on<TContext>(event: ModelEventName, listener: ModelEventListener<this, TContext>): () => void` [lines 1078-1083]
- Registers an instance-scoped lifecycle listener; returns unsubscribe.

#### `once<TContext>(event: ModelEventName, listener: ModelEventListener<this, TContext>): () => void` [lines 1092-1097]
- Registers a one-shot instance listener; returns unsubscribe.

#### `off<TContext>(event: ModelEventName, listener: ModelEventListener<this, TContext>): void` [lines 1105-1110]
- Removes an instance listener.

#### `static getDataSource(): DataSource` [lines 1132-1134]
- Resolves the data source for this model (named / instance / default).

#### `static getDriver(): DriverContract` [lines 1139-1141]
- Returns the underlying driver from the resolved data source.

#### `generateNextId(): Promise<number | string>` [lines 1146-1148]
- Generates and assigns the next auto-ID to this instance.

#### `static applyModelDefaults(defaults: any): void` [lines 1165-1167]
- Applies data-source-provided defaults to the model's static configuration.

#### `static addGlobalScope(name: string, callback: (query: QueryBuilderContract) => void, options: GlobalScopeOptions = {}): void` [lines 1192-1198]
- Registers a global scope auto-applied to all queries.

#### `static removeGlobalScope(name: string): void` [lines 1210-1212]
- Removes a global scope by name.

#### `static addScope(name: string, callback: LocalScopeCallback): void` [lines 1239-1241]
- Registers a named local scope callable via `.scope(name)` on the query builder.

#### `static removeScope(name: string): void` [lines 1253-1255]
- Removes a local scope by name.

#### `static query<TModel extends Model = Model>(this: ChildModel<TModel>): QueryBuilderContract<TModel>` [lines 1260-1264]
- Creates a new query builder for this model.

#### `static with<TModel>(...args): QueryBuilderContract<TModel>` [lines 1289-1360]
- Shorthand for `query().with(...)` with overloads: single name, varargs, `(name, callback)`, and map form.

#### `static joinWith<TModel extends Model = Model>(this: ChildModel<TModel>, ...relations: string[]): QueryBuilderContract<TModel>` [lines 1387-1392]
- Loads relations via JOIN/`$lookup` in a single query.

#### `static newQueryBuilder<TModel extends Model = Model>(this: ChildModel<TModel>): QueryBuilderContract<TModel>` [lines 1413-1417]
- Instantiates the model's custom `builder` class if set, else the driver default.

#### `static first<TModel>(filter?: Record<string, unknown>): Promise<TModel | null>` [lines 1422-1427]
- Returns the first matching record.

#### `static last<TModel>(filter?: Record<string, unknown>): Promise<TModel | null>` [lines 1432-1437]
- Returns the last matching record.

#### `static where<TModel>(...args): QueryBuilderContract<TModel>` [lines 1442-1468]
- Starts a query with a `where` clause; overloads accept `(field, value)`, `(field, operator, value)`, object form, and callback form.

#### `static count<TModel>(filter?: Record<string, unknown>): Promise<number>` [lines 1474-1479]
- Counts matching records.

#### `static find<TModel>(id: string | number): Promise<TModel | null>` [lines 1484-1489]
- Fetches a record by primary key.

#### `static all<TModel>(filter?: Record<string, unknown>): Promise<TModel[]>` [lines 1497-1502]
- Fetches all matching records.

#### `static paginate<TModel>(options: PaginationOptions & { filter?: Record<string, unknown> } = {}): Promise<PaginationResult<TModel>>` [lines 1507-1514]
- Paginates results with optional filter.

#### `static latest<TModel>(filter?: Record<string, unknown>): Promise<TModel[]>` [lines 1521-1526]
- Returns the latest records (by created-at/primary key).

#### `static increase<TModel>(filter, field: string, amount: number): Promise<number>` [lines 1538-1545]
- Atomically increments a field on matching records.

#### `static decrease<TModel>(filter, field: string, amount: number): Promise<number>` [lines 1556-1563]
- Atomically decrements a field on matching records.

#### `static atomic<TModel>(filter, operations: UpdateOperations): Promise<number>` [lines 1573-1579]
- Performs a raw atomic update using driver operators.

#### `static update<TModel>(id: string | number, data: Record<string, unknown>): Promise<number>` [lines 1584-1590]
- Atomically updates the record with the given id.

#### `static findAndUpdate<TModel>(filter, update: UpdateOperations): Promise<TModel[]>` [lines 1598-1604]
- Updates all matching records and returns the updated models.

#### `static findOneAndUpdate<TModel>(filter, update: UpdateOperations): Promise<TModel | null>` [lines 1612-1618]
- Updates a single matching record and returns the updated model.

#### `static findAndReplace<TModel>(filter, document: Record<string, unknown>): Promise<TModel | null>` [lines 1623-1629]
- Replaces an entire matching document and returns the replaced model.

#### `destroy(options?: { strategy?: DeleteStrategy; skipEvents?: boolean }): Promise<RemoverResult>` [lines 1649-1654]
- Deletes the current instance emitting `deleting`/`deleted` events. Throws if not persisted.

#### `self<TModel extends Model = this>(): ChildModel<TModel>` [lines 1671-1673]
- Returns `this.constructor` cast to the typed model class.

#### `clone(): this` [lines 1709-1711]
- Returns a deeply-frozen clone with no dirty state and preserved `isNew`.

#### `deepFreeze<T>(obj: T): T` [lines 1719-1721]
- Recursively freezes an object (used by `clone`).

#### `getTableName(): string` [lines 1726-1728]
- Returns `self().table`.

#### `getPrimaryKey(): string` [lines 1733-1735]
- Returns `self().primaryKey`.

#### `getSchema()` [lines 1740-1742]
- Returns the static `schema` validator.

#### `schemaHas(key: string): boolean` [lines 1747-1749]
- Returns whether the schema contains the given key.

#### `getStrictMode(): StrictMode` [lines 1754-1756]
- Returns the static `strictMode` setting.

#### `getConnection(): DataSource` [lines 1761-1763]
- Returns the resolved data source (alias for `self().getDataSource()`).

#### `static delete<TModel>(filter?: Record<string, unknown>): Promise<number>` [lines 1768-1773]
- Deletes all matching records, returns count.

#### `static deleteOne<TModel>(filter?: Record<string, unknown>): Promise<number>` [lines 1778-1783]
- Deletes a single matching record, returns count (0 or 1).

#### `static restore<TModel>(id: string | number, options?: { onIdConflict?: "fail" | "assignNew"; skipEvents?: boolean }): Promise<TModel>` [lines 1810-1819]
- Restores a single deleted record (trash or soft). Throws on not-found or unresolvable ID conflict.

#### `static restoreAll<TModel>(options?: { onIdConflict?: "fail" | "assignNew"; skipEvents?: boolean }): Promise<TModel[]>` [lines 1839-1847]
- Restores all deleted records; returns restored instances.

#### `static create<TModel, TSchema>(data: Partial<TSchema>): Promise<TModel>` [lines 1868-1873]
- Inserts a new record and returns the hydrated model.

#### `static createMany<TModel, TSchema>(data: Partial<TSchema>[]): Promise<TModel[]>` [lines 1878-1883]
- Bulk-inserts and returns the hydrated models.

#### `static findOrCreate<TModel, TSchema>(filter: Partial<TSchema>, data: Partial<TSchema>): Promise<TModel>` [lines 1906-1911]
- Finds a matching record or creates one (no update to existing).

#### `static upsert<TModel, TSchema>(filter: Partial<TSchema>, data: Partial<TSchema>, options?: Record<string, unknown>): Promise<TModel>` [lines 1955-1965]
- Atomic insert-or-update with full model lifecycle (ID, timestamps, validation, events).

#### `static updateOrCreate<TModel, TSchema>(filter: Partial<TSchema>, data: Partial<TSchema>, options?: Record<string, unknown>): Promise<TModel>` [lines 1977-1988]
- Deprecated alias that delegates to `upsert`.

#### `static findOneAndDelete<TModel>(filter: Record<string, unknown>, options?: Record<string, unknown>): Promise<TModel | null>` [lines 2005-2011]
- Deletes a matching record and returns it.

#### `get embedData(): Record<string, unknown>` [lines 2027-2029]
- Returns embed-safe data (only the `embed` columns if configured, else full data).

#### `static $cleanup()` [lines 2034-2036]
- Clears per-model event listeners (test/teardown helper).

#### `static events<TModel>(this: ChildModel<TModel>): ModelEvents<TModel>` [lines 2053-2057]
- Returns the per-constructor event emitter.

#### `static on<TModel, TContext>(event: ModelEventName, listener: ModelEventListener<TModel, TContext>): () => void` [lines 2075-2081]
- Registers a lifecycle listener on this constructor.

#### `static once<TModel, TContext>(event: ModelEventName, listener: ModelEventListener<TModel, TContext>): () => void` [lines 2100-2106]
- Registers a one-shot lifecycle listener on this constructor.

#### `static off<TModel, TContext>(event: ModelEventName, listener: ModelEventListener<TModel, TContext>): void` [lines 2123-2129]
- Removes a lifecycle listener from this constructor.

#### `static globalEvents(): ModelEvents<Model>` [lines 2146-2148]
- Returns the shared global event emitter for cross-model hooks.

#### `replaceData(data: Record<string, unknown>): void` [lines 2167-2169]
- Replaces the model's data and resets dirty tracking (internal writer path).

#### `save(options?: WriterOptions & { merge?: Partial<TSchema> }): Promise<this>` [lines 2210-2212]
- Inserts (if `isNew`) or updates the record. Runs validation, casting, ID generation, and lifecycle events. Returns `this`.

#### `serialize()` [lines 2222-2224]
- Serializes model data via the driver (DB write-side transformation).

#### `toSnapshot(): ModelSnapshot` [lines 2241-2243]
- Produces a plain-object snapshot suitable for cache storage, including loaded relations.

#### `static fromSnapshot<TModel extends Model>(this: ChildModel<TModel>, snapshot: ModelSnapshot): TModel` [lines 2258-2263]
- Reconstructs a model (and relations) from a cache snapshot.

#### `static hydrate<TModel extends Model = Model>(this: ChildModel<TModel>, data: Record<string, unknown>): TModel` [lines 2279-2284]
- Creates a model instance from a raw DB row (no relation restoration).

#### `toJSON()` [lines 2289-2291]
- Converts the model to JSON using `resource` / `resourceColumns` / `toJsonColumns` rules.
