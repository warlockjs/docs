# relation-hydrator
source: relations/relation-hydrator.ts
description: Restores eager-loaded relations onto model instances from plain snapshot objects.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `ChildModel`, `Model` from `../model/model`
- `getModelFromRegistry` from `../model/register-model`
- `RelationDefinition` from `./types`

## Exports
- `SerializedRelation` — type for one serialized relation entry  [lines 34-34]
- `ModelSnapshot` — plain-object shape with `data` and `relations`  [lines 41-44]
- `RelationHydrator` — static class hydrating relations from snapshots  [lines 63-116]

## Classes / Functions / Types / Constants

### `type SerializedRelation`
Union: `null | ModelSnapshot | ModelSnapshot[]`. [line 34]

### `type ModelSnapshot`
Object `{ data: Record<string, unknown>; relations: Record<string, SerializedRelation> }`. [lines 41-44]

### `class RelationHydrator`
Provides a single static method; no instance state. [lines 63-116]

#### `static hydrate(model, relationDefs, relationsSnapshot)`
Iterates snapshot entries, resolves model classes, recursively calls `fromSnapshot`,
and sets values on `model.loadedRelations` and as direct properties.
side-effects: mutates `model.loadedRelations` Map and sets properties on model. [lines 79-115]
