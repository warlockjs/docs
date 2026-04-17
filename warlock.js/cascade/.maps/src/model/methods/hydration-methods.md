# hydration-methods
source: model/methods/hydration-methods.ts
description: Model construction, snapshot serialization, cloning, and data-replacement utilities.
complexity: medium
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `RelationHydrator`, `ModelSnapshot`, `SerializedRelation` from `../../relations/relation-hydrator`
- `ChildModel`, `Model` from `../model`

## Exports
- `hydrateModel` — construct model instance from raw data  [lines 4-11]
- `modelFromSnapshot` — rebuild model with relations from snapshot  [lines 13-20]
- `modelToSnapshot` — serialize model and its relations to snapshot  [lines 22-40]
- `serializeModel` — serialize model data via driver  [lines 42-44]
- `cloneModel` — deep-clone model with frozen data  [lines 46-56]
- `deepFreezeObject` — recursively freeze an object  [lines 58-73]
- `replaceModelData` — replace model data and reset dirty tracker  [lines 75-81]

## Classes / Functions / Types / Constants
### `hydrateModel<TModel>(ModelClass, data)` [lines 4-11]
- side-effects: sets `model.isNew = false`

### `modelFromSnapshot<TModel>(ModelClass, snapshot)` [lines 13-20]
- side-effects: calls `RelationHydrator.hydrate` to attach relations

### `modelToSnapshot(model)` [lines 22-40]
- Iterates `model.loadedRelations`; serializes via driver
- side-effects: none (reads only)

### `serializeModel(model)` [lines 42-44]
- Pure; delegates to data-source driver

### `cloneModel<TModel>(model)` [lines 46-56]
- side-effects: freezes cloned data; resets dirty tracker on clone

### `deepFreezeObject<T>(obj)` [lines 58-73]
- Recursively calls `Object.freeze`; returns same reference

### `replaceModelData<TModel>(model, data)` [lines 75-81]
- side-effects: mutates `model.data`; calls `dirtyTracker.replaceCurrentData`
