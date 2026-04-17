# model
source: model/model.ts
description: Base Model class powering Cascade ORM with data, events, queries, and lifecycle.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `GenericObject` from `@mongez/reinforcements`
- `ObjectValidator` from `@warlock.js/seal`
- `DriverContract, PaginationOptions, PaginationResult, RemoverResult, UpdateOperations, WriterOptions, QueryBuilderContract, WhereCallback, WhereObject, WhereOperator` from `../contracts`
- `DataSource` from `../data-source/data-source`
- `DatabaseDirtyTracker` from `../database-dirty-tracker`
- `ModelEventListener, ModelEventName, ModelEvents` from `../events/model-events`
- `ModelSnapshot` from `../relations/relation-hydrator`
- `RelationLoader` from `../relations/relation-loader`
- `modelSync`, `ModelSyncOperationContract` from `../sync/*`
- `DeleteStrategy, StrictMode` from `../types`
- accessor/delete/dirty/hydration/instance-event/meta/query/restore/scope/serialization/static-event/write methods from `./methods/*`
- `ChildModel, GlobalScopeDefinition, GlobalScopeOptions, LocalScopeCallback, ModelSchema` from `./model.types`
- `getAllModelsFromRegistry, getModelFromRegistry` from `./register-model`

## Exports
- `Model` — abstract base class for all models  [line 153]
- type `ChildModel, GlobalScopeDefinition, GlobalScopeOptions, LocalScopeCallback, ModelSchema, ScopeTiming` — re-exported  [lines 115-122]

## Classes
### Model<TSchema extends ModelSchema>  [lines 153-2292] — abstract base for Cascade ORM models
extends: none

fields:
- `static table: string`  [line 166]
- `static resource?: any`  [line 180]
- `static resourceColumns?: string[]`  [line 186]
- `static toJsonColumns?: string[]`  [line 199]
- `static dataSource?: string | DataSource`  [line 216]
- `static builder?: new (...args) => QueryBuilderContract<Model>`  [line 221]
- `static primaryKey: string`  [line 239] — default "id"
- `static embed?: string[]`  [line 244]
- `static schema?: ObjectValidator`  [line 266]
- `static strictMode: StrictMode`  [line 289] — default "strip"
- `static autoGenerateId: boolean`  [line 313]
- `static initialId?: number`  [line 327]
- `static randomInitialId?: boolean | (() => number)`  [line 350]
- `static incrementIdBy?: number`  [line 366]
- `static randomIncrement?: boolean | (() => number)`  [line 389]
- `static createdAtColumn?: string | false`  [line 394]
- `static updatedAtColumn?: string | false`  [line 399]
- `static deleteStrategy?: DeleteStrategy`  [line 419]
- `static deletedAtColumn: string | false`  [line 435]
- `static trashTable?: string`  [line 450]
- `static globalScopes: Map<string, GlobalScopeDefinition>`  [line 456]
- `static localScopes: Map<string, LocalScopeCallback>`  [line 462]
- `static relations: Record<string, any>`  [line 493]
- `isNew: boolean`  [line 503]
- `data: TSchema`  [line 510]
- `readonly dirtyTracker: DatabaseDirtyTracker`  [line 522]
- `events: ModelEvents<any>`  [line 528]
- `loadedRelations: Map<string, any>`  [line 544]
- `protected isActiveColumn: string`  [line 549]

methods:
- `constructor(initialData?: Partial<TSchema>)`  [lines 563-566] — initializes data and dirty tracker
- `load(...relations: string[]): Promise<this>`  [lines 593-598] — lazy-load relations onto instance
- `isLoaded(relationName: string): boolean`  [lines 616-618]
- `getRelation<TRelation>(relationName: string): TRelation | undefined`  [lines 636-638]
- `static getModel(name: string)`  [lines 656-658]
- `static getAllModels()`  [lines 675-677]
- `static sync(TargetModel, targetField): ModelSyncOperationContract`  [lines 699-705]
- `static syncMany(TargetModel, targetField): ModelSyncOperationContract`  [lines 723-729]
- `get id(): number | string`  [lines 734-736]
- `get uuid(): string`  [lines 741-743]
- `get(field, defaultValue?): any`  [lines 760-769] — overloaded field accessor
- `only(fields): Record<string, unknown>`  [lines 774-778]
- `string/number/boolean(key, defaultValue?)`  [lines 783-799] — typed field accessors
- `set(field, value): this`  [lines 816-820]
- `has(field): boolean`  [lines 836-840]
- `increment(field, amount?): this`  [lines 845-849]
- `decrement(field, amount?): this`  [lines 854-858]
- `unset(...fields): this`  [lines 874-878]
- `merge(values): this`  [lines 894-898]
- `atomicUpdate(operations): Promise<number>`  [lines 906-908] — side-effects: DB write
- `atomicIncrement(field, amount?): Promise<number>`  [lines 915-920] — side-effects: DB write
- `atomicDecrement(field, amount?): Promise<number>`  [lines 927-932] — side-effects: DB write
- `get isActive(): boolean`  [lines 937-939]
- `get createdAt(): Date | undefined`  [lines 944-950]
- `get updatedAt(): Date | undefined`  [lines 955-961]
- `isCreatedBy(user): boolean`  [lines 966-968]
- `hasChanges(): boolean`  [lines 983-985]
- `isDirty(column): boolean`  [lines 999-1001]
- `getDirtyColumnsWithValues(): Record<string, {oldValue, newValue}>`  [lines 1015-1017]
- `getRemovedColumns(): string[]`  [lines 1030-1032]
- `getDirtyColumns(): string[]`  [lines 1045-1047]
- `emitEvent(event, context?): Promise<void>`  [lines 1064-1069] — side-effects: dispatches model events
- `on/once/off(event, listener)`  [lines 1078-1110] — instance event registration
- `static getDataSource(): DataSource`  [lines 1132-1134] — throws: Error if no data source
- `static getDriver(): DriverContract`  [lines 1139-1141]
- `generateNextId(): Promise<number | string>`  [lines 1146-1148] — side-effects: queries/mutates id counter
- `static applyModelDefaults(defaults): void`  [lines 1165-1167] — side-effects: mutates static props
- `static addGlobalScope/removeGlobalScope/addScope/removeScope`  [lines 1192-1255] — scope registry mutations
- `static query(): QueryBuilderContract<TModel>`  [lines 1260-1264]
- `static with(...): QueryBuilderContract<TModel>`  [lines 1289-1360] — overloaded eager-load
- `static joinWith(...relations): QueryBuilderContract<TModel>`  [lines 1387-1392]
- `static newQueryBuilder(): QueryBuilderContract<TModel>`  [lines 1413-1417]
- `static first/last/find/all/latest/count/paginate/where`  [lines 1422-1514] — query helpers (async where noted)
- `static increase/decrease/atomic/update`  [lines 1538-1590] — atomic DB updates
- `static findAndUpdate/findOneAndUpdate/findAndReplace`  [lines 1598-1629] — mutation queries
- `destroy(options?): Promise<RemoverResult>`  [lines 1649-1654] — throws: Error if new/deletion fails; side-effects: DB delete, events
- `self(): ChildModel<TModel>`  [lines 1671-1673]
- `clone(): this`  [lines 1709-1711] — immutable deep clone
- `deepFreeze<T>(obj): T`  [lines 1719-1721]
- `getTableName/getPrimaryKey/getSchema/schemaHas/getStrictMode/getConnection`  [lines 1726-1763]
- `static delete/deleteOne(filter?): Promise<number>`  [lines 1768-1783] — side-effects: DB delete
- `static restore(id, options?): Promise<TModel>`  [lines 1810-1819] — throws: Error if not found or ID conflict
- `static restoreAll(options?): Promise<TModel[]>`  [lines 1839-1847]
- `static create/createMany/findOrCreate/upsert/updateOrCreate`  [lines 1868-1988] — side-effects: DB writes, events
- `static findOneAndDelete(filter, options?): Promise<TModel | null>`  [lines 2005-2011]
- `get embedData(): Record<string, unknown>`  [lines 2027-2029]
- `static $cleanup()`  [lines 2034-2036] — side-effects: removes event listeners
- `static events(): ModelEvents<TModel>`  [lines 2053-2057]
- `static on/once/off(event, listener)`  [lines 2075-2129] — static event registration
- `static globalEvents(): ModelEvents<Model>`  [lines 2146-2148]
- `replaceData(data): void`  [lines 2167-2169] — side-effects: mutates data, dirty tracker
- `save(options?): Promise<this>`  [lines 2210-2212] — throws: ValidationError, Error; side-effects: DB write, events
- `serialize()`  [lines 2222-2224]
- `toSnapshot(): ModelSnapshot`  [lines 2241-2243]
- `static fromSnapshot(snapshot): TModel`  [lines 2258-2263]
- `static hydrate(data): TModel`  [lines 2279-2284]
- `toJSON()`  [lines 2289-2291]

see also: model/methods/*.ts maps
