# types
source: relations/types.ts
description: All type and interface definitions for the Cascade ORM relations system.
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- `QueryBuilderContract` from `../contracts`
- `Model` from `../model/model`

## Exports
- `RelationType` — Union of the four supported relation kinds.  [line 33]
- `RelationDefinition` — Complete configuration object for a single relation.  [lines 55-105]
- `HasManyOptions` — Config options for `hasMany()`.  [lines 122-143]
- `HasOneOptions` — Config options for `hasOne()`.  [lines 156-177]
- `BelongsToOptions` — Config options for `belongsTo()`.  [lines 190-209]
- `BelongsToManyOptions` — Config options for `belongsToMany()` (pivot required).  [lines 226-265]
- `RelationConstraintCallback` — Callback signature for query constraints applied when loading a relation.  [line 281]
- `RelationConstraints` — Record mapping relation names to callbacks or boolean values.  [line 299]
- `LoadedRelationResult` — Union type for the resolved value of a loaded relation.  [line 311]
- `LoadedRelationsMap` — `Map<string, LoadedRelationResult>` used to cache loaded relations on model instances.  [line 323]
- `RelationDefinitions` — `Record<string, RelationDefinition>` — type for the static `relations` property on a model class.  [line 345]
- `PivotData` — `Record<string, unknown>` — arbitrary extra columns written to pivot rows.  [line 359]
- `PivotIds` — `(number | string)[]` — ID list accepted by pivot operations.  [line 365]

## Classes / Functions / Types / Constants

### `RelationType` [line 33]
- String literal union: `"hasOne" | "hasMany" | "belongsTo" | "belongsToMany"`.

### `RelationDefinition` [lines 55-105]
- Read-only type describing a complete relation.
- Fields: `type: RelationType`, `model: string`, `foreignKey?: string`, `localKey?: string`, `pivot?: string`, `pivotLocalKey?: string`, `pivotForeignKey?: string`, `select?: string[]`.

### `HasManyOptions` [lines 122-143]
- Read-only type: `foreignKey?: string`, `localKey?: string`, `select?: string[]`.

### `HasOneOptions` [lines 156-177]
- Read-only type: `foreignKey?: string`, `localKey?: string`, `select?: string[]`.
- Structurally identical to `HasManyOptions`; kept separate for semantic clarity.

### `BelongsToOptions` [lines 190-209]
- Read-only type: `foreignKey?: string`, `ownerKey?: string`, `select?: string[]`.
- Uses `ownerKey` (not `localKey`) to name the primary key on the related model.

### `BelongsToManyOptions` [lines 226-265]
- Read-only type: `pivot: string` (required), `localKey?: string`, `foreignKey?: string`, `pivotLocalKey?: string`, `pivotForeignKey?: string`, `select?: string[]`.

### `RelationConstraintCallback` [line 281]
- `(query: QueryBuilderContract) => void` — applied inside `.with()` to scope the eager-loaded query.

### `RelationConstraints` [line 299]
- `Record<string, boolean | RelationConstraintCallback>` — passed to `loadRelations`; `true` loads without extra constraints.

### `LoadedRelationResult` [line 311]
- `Model | Model[] | null` — scalar for hasOne/belongsTo, array for hasMany/belongsToMany, null when not found.

### `LoadedRelationsMap` [line 323]
- `Map<string, LoadedRelationResult>` — keyed by relation name; stored on each model instance after eager/lazy loading.

### `RelationDefinitions` [line 345]
- `Record<string, RelationDefinition>` — the shape of `Model.relations`.

### `PivotData` [line 359]
- `Record<string, unknown>` — extra columns to write alongside the two FK columns in a pivot row.

### `PivotIds` [line 365]
- `(number | string)[]` — accepted by `attach`, `detach`, `sync`, `toggle`.
