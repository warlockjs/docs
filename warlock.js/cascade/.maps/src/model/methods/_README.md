# Model Methods
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> This folder contains all discrete, single-responsibility helper modules that implement every behaviour a Model instance or class can perform — reads, writes, queries, events, scopes, dirty tracking, serialization, hydration, deletion, restore, and atomic operations.

## What lives here
- `accessor-methods.ts` — field-level get/set/merge/unset/typed-read helpers operating on model data and dirty tracker
- `delete-methods.ts` — async single and bulk delete helpers wrapping DatabaseRemover
- `dirty-methods.ts` — pure delegates exposing dirty-tracker state (has changes, is dirty, dirty columns)
- `hydration-methods.ts` — model construction from raw data, snapshot round-trips, cloning, and data replacement
- `instance-event-methods.ts` — emit and subscribe to per-instance lifecycle events across instance, class, and global buses
- `meta-methods.ts` — static defaults application, ID generation, and atomic increment/decrement via DatabaseWriter
- `query-methods.ts` — static query helpers: build queries with scopes, find, paginate, count, upsert, atomic updates
- `restore-methods.ts` — async helpers to restore soft-deleted records via DatabaseRestorer
- `scope-methods.ts` — add and remove named global and local query scopes on a model class
- `serialization-methods.ts` — converts a model instance to a plain JSON object via resource or column config
- `static-event-methods.ts` — per-class and global model event subscription registry
- `write-methods.ts` — async create, save, upsert, findOrCreate, and createMany record helpers

## Public API
- `getFieldValue(model, field, defaultValue?)` — get field from model data with optional default
- `setFieldValue(model, field, value)` — set field and mark dirty tracker
- `hasField(model, field): boolean` — check field existence via sentinel symbol
- `incrementField(model, field, amount?)` — increment numeric field in-place
- `decrementField(model, field, amount?)` — decrement numeric field in-place
- `unsetFields(model, ...fields)` — remove fields and update dirty tracker
- `mergeFields(model, values)` — deep-merge values into model data
- `getOnlyFields(model, fields): Record<string, unknown>` — pick subset of fields
- `getStringField(model, key, defaultValue?): string | undefined` — typed string accessor
- `getNumberField(model, key, defaultValue?): number | undefined` — typed number accessor
- `getBooleanField(model, key, defaultValue?): boolean | undefined` — typed boolean accessor
- `MISSING_VALUE: unique symbol` — sentinel distinguishing missing vs undefined field
- `destroyModel(model, options?): Promise<void>` — destroy single model via DatabaseRemover
- `deleteRecords(ModelClass, filter?): Promise<void>` — bulk-delete records matching filter
- `deleteOneRecord(ModelClass, filter?): Promise<void>` — delete one record matching filter
- `checkHasChanges(model): boolean` — whether model has any unsaved changes
- `checkIsDirty(model, column): boolean` — whether specific column is dirty
- `getDirtyColumnsWithValues(model): Record<string, { oldValue, newValue }>` — dirty columns with values
- `getRemovedColumns(model): string[]` — list of removed column names
- `getDirtyColumns(model): string[]` — list of all dirty column names
- `hydrateModel<TModel>(ModelClass, data): TModel` — construct model instance from raw data
- `modelFromSnapshot<TModel>(ModelClass, snapshot): TModel` — rebuild model with relations from snapshot
- `modelToSnapshot(model): ModelSnapshot` — serialize model and loaded relations to snapshot
- `serializeModel(model)` — serialize model data via driver
- `cloneModel<TModel>(model): TModel` — deep-clone model with frozen data
- `deepFreezeObject<T>(obj): T` — recursively freeze an object
- `replaceModelData<TModel>(model, data): TModel` — replace model data and reset dirty tracker
- `emitModelEvent<TContext>(model, event, context?): Promise<void>` — emit on instance, class, and global buses
- `onModelEvent<TContext>(model, event, listener)` — subscribe listener to instance event, returns unsubscribe
- `onceModelEvent<TContext>(model, event, listener)` — one-time instance event subscription
- `offModelEvent<TContext>(model, event, listener)` — unsubscribe listener from instance event
- `applyDefaultsToModel(ModelClass, defaults)` — apply config defaults to ModelClass statics
- `generateModelNextId(model): Promise<void>` — generate and assign next model ID
- `performAtomicUpdate(model, operations): Promise<void>` — run raw atomic operations on model
- `performAtomicIncrement<T>(model, field, amount?): Promise<void>` — atomically increment a field
- `performAtomicDecrement<T>(model, field, amount?): Promise<void>` — atomically decrement a field
- `buildQuery<TModel>(ModelClass, BaseModel): QueryBuilderContract<TModel>` — build query with scopes and hydration wired
- `buildNewQueryBuilder<TModel>(ModelClass): QueryBuilderContract<TModel>` — create raw query builder from data source
- `findFirst<TModel>(ModelClass, filter?): Promise<TModel | null>` — first matching model or null
- `findLast<TModel>(ModelClass, filter?): Promise<TModel | null>` — last matching model or null
- `findAll<TModel>(ModelClass, filter?): Promise<TModel[]>` — all matching models
- `countRecords<TModel>(ModelClass, filter?): Promise<number>` — count of matching records
- `findById<TModel>(ModelClass, id): Promise<TModel | null>` — find single model by primary key
- `paginateRecords<TModel>(ModelClass, options): Promise<PaginationResult<TModel>>` — paginated result set
- `findLatest<TModel>(ModelClass, filter?): Promise<TModel[]>` — records in latest order
- `increaseField<TModel>(ModelClass, filter, field, amount?): Promise<void>` — increment numeric field in DB
- `decreaseField<TModel>(ModelClass, filter, field, amount?): Promise<void>` — decrement numeric field in DB
- `performAtomic<TModel>(ModelClass, filter, operations): Promise<void>` — atomic update on matched records
- `updateById<TModel>(ModelClass, id, data): Promise<TModel | null>` — update record fields by id
- `findAndUpdateRecords<TModel>(ModelClass, filter, data): Promise<TModel[]>` — atomically update then return records
- `findOneAndUpdateRecord<TModel>(ModelClass, filter, data): Promise<TModel | null>` — update one record and return it
- `findAndReplaceRecord<TModel>(ModelClass, filter, data): Promise<TModel | null>` — replace one document and return it
- `findOneAndDeleteRecord<TModel>(ModelClass, filter): Promise<TModel | null>` — delete one record and return it
- `resolveDataSource<TModel>(ModelClass): DataSource` — resolve and cache data source for model class
- `restoreRecord<TModel>(ModelClass, id): Promise<TModel>` — restore single soft-deleted record by id
- `restoreAllRecords<TModel>(ModelClass): Promise<TModel[]>` — restore all soft-deleted records
- `addGlobalModelScope(ModelClass, name, scope, options?)` — register named global scope on model class
- `removeGlobalModelScope(ModelClass, name)` — delete named global scope from model class
- `addLocalModelScope(ModelClass, name, callback)` — register named local scope on model class
- `removeLocalModelScope(ModelClass, name)` — delete named local scope from model class
- `modelToJSON(model): Record<string, unknown>` — serialize model to plain record via resource or columns
- `getModelEvents<TModel>(ModelClass): ModelEvents` — return or create ModelEvents instance for class
- `cleanupModelEvents(ModelClass)` — remove events registry entry and unregister model
- `onStaticEvent<TModel, TContext>(ModelClass, event, listener)` — subscribe listener to named model event
- `onceStaticEvent<TModel, TContext>(ModelClass, event, listener)` — one-time class-level event subscription
- `offStaticEvent<TModel, TContext>(ModelClass, event, listener)` — unsubscribe listener from named model event
- `getGlobalEvents(): ModelEvents` — return shared global model events emitter
- `saveModel<TModel>(model, options?): Promise<TModel>` — persist model instance via DatabaseWriter
- `createRecord<TModel, TSchema>(ModelClass, data): Promise<TModel>` — instantiate and save a new model record
- `createManyRecords<TModel, TSchema>(ModelClass, data[]): Promise<TModel[]>` — create multiple records in parallel
- `findOrCreateRecord<TModel, TSchema>(ModelClass, filter, data): Promise<TModel>` — return existing or create new record
- `upsertRecord<TModel, TSchema>(ModelClass, filter, data, options?): Promise<TModel>` — upsert with timestamps and events

## How it fits together
Each file in this folder is a thin functional layer called by the `Model` class itself — the `Model` delegates almost all of its public method bodies to the corresponding helper here, keeping the class declaration clean and each concern independently testable. The accessor and dirty modules work together to ensure every field mutation is tracked, while the query module depends on `resolveDataSource` to lazily wire the correct driver and call `applyDefaultsToModel` exactly once per class. Write helpers depend on `instance-event-methods` for `saving`/`saved` lifecycle events, and hydration helpers depend on the relations subsystem (`RelationHydrator`, `RelationLoader`) to attach eager-loaded associations after a query completes.

## Working examples
```typescript
import {
  getFieldValue,
  setFieldValue,
  hasField,
  incrementField,
  decrementField,
  unsetFields,
  mergeFields,
  getOnlyFields,
  getStringField,
  getNumberField,
  getBooleanField,
  checkHasChanges,
  checkIsDirty,
  getDirtyColumns,
  getDirtyColumnsWithValues,
  getRemovedColumns,
  saveModel,
  createRecord,
  createManyRecords,
  findOrCreateRecord,
  upsertRecord,
  destroyModel,
  deleteRecords,
  deleteOneRecord,
  hydrateModel,
  cloneModel,
  replaceModelData,
  modelToSnapshot,
  modelFromSnapshot,
  serializeModel,
  deepFreezeObject,
  emitModelEvent,
  onModelEvent,
  onceModelEvent,
  offModelEvent,
  getModelEvents,
  onStaticEvent,
  getGlobalEvents,
  buildQuery,
  findFirst,
  findAll,
  findById,
  countRecords,
  paginateRecords,
  findLatest,
  updateById,
  findOrCreateRecord as findOrCreate,
  performAtomicIncrement,
  performAtomicDecrement,
  restoreRecord,
  restoreAllRecords,
  addGlobalModelScope,
  removeGlobalModelScope,
  addLocalModelScope,
  modelToJSON,
  applyDefaultsToModel,
  generateModelNextId,
  resolveDataSource,
} from "./model/methods";

// --- Accessor and dirty tracking ---
const model = new User({ name: "Alice", score: 10 });

setFieldValue(model, "name", "Bob");
console.log(getStringField(model, "name")); // "Bob"
console.log(hasField(model, "name"));       // true
console.log(checkHasChanges(model));        // true
console.log(checkIsDirty(model, "name"));   // true
console.log(getDirtyColumns(model));        // ["name"]

incrementField(model, "score", 5);          // score -> 15
decrementField(model, "score", 3);          // score -> 12
mergeFields(model, { meta: { verified: true } });
const subset = getOnlyFields(model, ["name", "score"]);
unsetFields(model, "meta");

// --- Write operations ---
const user = await createRecord(User, { name: "Carol", email: "carol@example.com" });
await saveModel(user, { merge: { updatedAt: new Date() } });

const users = await createManyRecords(User, [
  { name: "Dave" },
  { name: "Eve" },
]);

const existing = await findOrCreateRecord(User, { email: "frank@example.com" }, { name: "Frank" });
const upserted = await upsertRecord(User, { email: "grace@example.com" }, { name: "Grace" });

// --- Query operations ---
const first = await findFirst(User, { active: true });
const all   = await findAll(User, { role: "admin" });
const byId  = await findById(User, 42);
const total = await countRecords(User, { role: "admin" });
const page  = await paginateRecords(User, { page: 1, limit: 20 });
const latest = await findLatest(User, { role: "admin" });
const updated = await updateById(User, 42, { name: "Updated" });

// --- Hydration and cloning ---
const hydrated = hydrateModel(User, { id: 1, name: "Hydrated" });
const snapshot = modelToSnapshot(hydrated);
const restored = modelFromSnapshot(User, snapshot);
const clone    = cloneModel(hydrated);
replaceModelData(hydrated, { id: 1, name: "Replaced" });

// --- Soft-delete and restore ---
await destroyModel(user);
await deleteRecords(User, { active: false });
await deleteOneRecord(User, { id: 99 });
const restoredOne = await restoreRecord(User, 99);
const restoredAll = await restoreAllRecords(User);

// --- Events ---
const unsub = onModelEvent(user, "saving", async (ctx) => {
  console.log("saving", ctx);
});
await emitModelEvent(user, "saving", { isInsert: false });
unsub();

onStaticEvent(User, "saved", async (models) => {
  console.log("saved", models);
});

const globalBus = getGlobalEvents();

// --- Scopes ---
addGlobalModelScope(User, "active", (qb) => qb.where("active", true));
addLocalModelScope(User, "admins", (qb) => qb.where("role", "admin"));
removeGlobalModelScope(User, "active");

// --- Serialization ---
const json = modelToJSON(user);

// --- Atomic operations ---
await performAtomicIncrement(user, "loginCount", 1);
await performAtomicDecrement(user, "credits", 5);
```

## DO NOT
- Do NOT call `model.dirtyTracker` directly from outside this folder — use `checkHasChanges`, `checkIsDirty`, `getDirtyColumns`, `getDirtyColumnsWithValues`, and `getRemovedColumns` instead, because direct tracker access bypasses the stable public contract.
- Do NOT invent field-mutation helpers that bypass `setFieldValue` — all writes must go through it so the dirty tracker stays in sync; skipping it will cause `save()` to miss changed columns.
- Do NOT call `applyDefaultsToModel` or `resolveDataSource` manually in application code — these are invoked automatically the first time a query runs on a class; calling them again can silently overwrite intentional runtime overrides.
- Do NOT mutate `ModelClass.globalScopes` or `ModelClass.localScopes` maps directly — use `addGlobalModelScope`, `removeGlobalModelScope`, `addLocalModelScope`, and `removeLocalModelScope` so scope registration remains consistent and reversible.
- Do NOT use `deepFreezeObject` on live model data — it is intended only for cloned snapshots; freezing the active `model.data` object will cause all subsequent `setFieldValue` calls to silently fail in non-strict mode or throw in strict mode.
