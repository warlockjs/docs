# relation-loader
source: relations/relation-loader.ts
description: Batch-loads all relation types for model arrays, preventing N+1 queries.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `ChildModel`, `Model` from `../model/model`
- `getModelFromRegistry` from `../model/register-model`
- `LoadedRelationResult`, `RelationConstraintCallback`, `RelationConstraints`, `RelationDefinition` from `./types`

## Exports
- `RelationLoader` — generic class batch-loading relations for model arrays  [lines 54-598]

## Classes / Functions / Types / Constants

### `class RelationLoader<TModel extends Model>`
Handles hasOne, hasMany, belongsTo, belongsToMany with nested dot-notation support. [lines 54-598]

#### `constructor(models, modelClass)`
Stores model array and class reference. [lines 79-82]

#### `public async load(relations, constraints?)`
Entry point; normalises input and dispatches per relation.
throws: `Error` if relation is not defined on the model class.
side-effects: mutates each model's `loadedRelations` Map and direct properties. [lines 108-127]

#### `private async loadRelation(name, constraint?)`
Parses dot notation, selects loader by type, recurses for nested paths.
throws: `Error` if relation definition is missing. [lines 139-176]

#### `private async loadHasMany(name, definition, constraint?)`
Batch-fetches related records grouped by foreign key.
side-effects: calls `setRelationOnModels`, mutating all models. [lines 185-219]

#### `private async loadHasOne(name, definition, constraint?)`
Batch-fetches single related record per model.
side-effects: calls `setRelationOnModels`, mutating all models. [lines 228-268]

#### `private async loadBelongsTo(name, definition, constraint?)`
Batch-fetches owner records indexed by owner key.
side-effects: calls `setRelationOnModels`, mutating all models. [lines 277-314]

#### `private async loadBelongsToMany(name, definition, constraint?)`
Queries pivot table then related model; builds per-model arrays.
throws: `Error` if `definition.pivot` is absent.
side-effects: calls `setRelationOnModels`, mutating all models. [lines 323-401]

#### `private async loadNestedRelations(parentRelation, remainingPath, constraint?)`
Collects loaded related models and creates nested `RelationLoader`. [lines 414-448]
