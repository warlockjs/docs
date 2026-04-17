# relation-hydrator
source: relations/relation-hydrator.ts
description: Restores eager-loaded relations from snapshot data onto model instances
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `ChildModel, Model` from `../model/model`
- `getModelFromRegistry` from `../model/register-model`
- `RelationDefinition` from `./types`

## Exports
- `SerializedRelation` — Shape of relation in snapshot [lines 34-34]
- `ModelSnapshot` — Plain-object shape of model snapshot [lines 41-44]
- `RelationHydrator` — Class for restoring relations from snapshots [lines 63-116]

## Types

### `SerializedRelation` [lines 34-34]
- Union: null | ModelSnapshot | ModelSnapshot[]
- null indicates loaded relation with no match
- ModelSnapshot for single relations
- ModelSnapshot[] for collection relations

### `ModelSnapshot` [lines 41-44]
- `data: Record<string, unknown>` — Model data
- `relations: Record<string, SerializedRelation>` — Nested relations by name

## Classes

### `RelationHydrator` [lines 63-116]

#### `static hydrate(model: Model, relationDefs: Record<string, RelationDefinition>, relationsSnapshot: Record<string, SerializedRelation> | undefined): void` [lines 79-115]
- Hydrates all relations from snapshot onto model instance
- Looks up relation definitions to find target model classes
- Recursively calls fromSnapshot on nested snapshots
- Sets relations on both loadedRelations Map and as direct properties
- Preserves null entries for explicitly loaded but unmatched relations
- Gracefully skips unknown relation names from older schema versions
