# hydration-methods
source: model/methods/hydration-methods.ts
description: Model hydration, snapshotting, serialization and cloning
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `RelationHydrator, ModelSnapshot, SerializedRelation` from `../../relations/relation-hydrator`
- `ChildModel, Model` from `../model`

## Exports
- `hydrateModel` — Create model instance from deserialized data [lines 4-11]
- `modelFromSnapshot` — Restore model from snapshot with relations [lines 13-20]
- `modelToSnapshot` — Serialize model with relations to snapshot [lines 22-40]
- `serializeModel` — Serialize model data using driver [lines 42-44]
- `cloneModel` — Deep clone model with frozen data [lines 46-56]
- `deepFreezeObject` — Recursively freeze object [lines 58-73]
- `replaceModelData` — Replace model data and reset dirty tracker [lines 75-82]

## Classes / Functions / Types / Constants

### `hydrateModel<TModel extends Model = Model>(ModelClass: ChildModel<TModel>, data: Record<string, unknown>): TModel` [lines 4-11]
- Creates new model instance from driver-deserialized data with isNew = false

### `modelFromSnapshot<TModel extends Model>(ModelClass: ChildModel<TModel>, snapshot: ModelSnapshot): TModel` [lines 13-20]
- Restores model from snapshot including hydrated relations

### `modelToSnapshot(model: Model): ModelSnapshot` [lines 22-40]
- Converts model to snapshot with driver-serialized data and relation snapshots; handles null and array relations

### `serializeModel(model: Model)` [lines 42-44]
- Serializes model data using driver's serialize method

### `cloneModel<TModel extends Model>(model: TModel): TModel` [lines 46-56]
- Creates deep clone of model; freezes data and resets dirty tracker

### `deepFreezeObject<T>(obj: T): T` [lines 58-73]
- Recursively freezes object and all nested properties

### `replaceModelData<TModel extends Model>(model: TModel, data: Record<string, unknown>): void` [lines 75-82]
- Replaces model data and updates dirty tracker with new baseline
