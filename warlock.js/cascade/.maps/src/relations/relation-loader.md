# relation-loader
source: relations/relation-loader.ts
description: Core relation loading engine for Cascade ORM providing batched, nested, and constrained eager-loading for all relation types.
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-opus-4-7
last-updated-by: claude-opus-4-7

## Imports
- `ChildModel`, `Model` (type) from `../model/model`
- `getModelFromRegistry` from `../model/register-model`
- `LoadedRelationResult`, `RelationConstraintCallback`, `RelationConstraints`, `RelationDefinition` (type) from `./types`

## Exports
- `RelationLoader` — Efficiently loads relationships for one or more model instances, preventing N+1 via batch loading.  [lines 54-598]

## Classes / Functions / Types / Constants

### `RelationLoader<TModel extends Model = Model>` [lines 54-598]
- Generic class responsible for eager-loading relations onto a collection of model instances.
- Handles batch loading, nested (dot-notation) relations, constraint callbacks, and all four relation types (`hasOne`, `hasMany`, `belongsTo`, `belongsToMany`).
- Private state: `models: TModel[]` (line 62), `modelClass: ChildModel<TModel>` (line 67).

#### `constructor(models: TModel[], modelClass: ChildModel<TModel>)` [lines 79-82]
- Stores the target model instances and their class constructor for subsequent loading operations.

#### `load(relations: string | string[], constraints?: RelationConstraints): Promise<void>` [lines 108-127]
- Public entrypoint. Normalizes the relation argument to an array, then loads each relation sequentially.
- Short-circuits when `this.models` is empty.
- Extracts per-relation callback constraint from the `constraints` map; only callback-type constraints are forwarded to `loadRelation` (object-form constraints are dropped at line 123).

## Ambiguities / Notes
- All remaining methods (`loadRelation`, `loadHasMany`, `loadHasOne`, `loadBelongsTo`, `loadBelongsToMany`, `loadNestedRelations`, `parseNestedRelation`, `resolveModelClass`, `getRelationDefinition`, `collectKeyValues`, `groupBy`, `inferForeignKey`, `setRelationOnModels`, `getLoadedRelation`, `setLoadedRelation`) are `private` and intentionally omitted per mapping rules.
- `loadBelongsToMany` key mapping (lines 337-340) uses an unusual assignment where `definition.localKey` drives `pivotLocalKey` and `definition.pivotLocalKey` drives the loader's `localKey`; this naming appears inverted relative to the other relation types but matches the source verbatim.
- `getRelationDefinition` and `getLoadedRelation`/`setLoadedRelation` rely on structural casts (`as unknown as { ... }`) to access `relations` and `loadedRelations` members, implying these are conventions on Model rather than typed on `ChildModel`/`Model` directly.
- `setLoadedRelation` (line 596) also assigns the relation value as a direct property on the model instance alongside storing it in the `loadedRelations` Map.
