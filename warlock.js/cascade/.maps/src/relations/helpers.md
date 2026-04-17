# helpers
source: relations/helpers.ts
description: Provides fluent helper functions for defining all four model relationship types.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `BelongsToManyOptions` from `./types`
- `BelongsToOptions` from `./types`
- `HasManyOptions` from `./types`
- `HasOneOptions` from `./types`
- `RelationDefinition` from `./types`

## Exports
- `hasMany` — builds a hasMany RelationDefinition  [lines 64-72]
- `hasOne` — builds a hasOne RelationDefinition  [lines 109-117]
- `belongsTo` — builds a belongsTo RelationDefinition  [lines 151-161]
- `belongsToMany` — builds a belongsToMany RelationDefinition  [lines 208-219]

## Classes / Functions / Types / Constants

### `hasMany(model, options?)`
Returns `RelationDefinition` with type `"hasMany"`. [lines 64-72]

### `hasOne(model, options?)`
Returns `RelationDefinition` with type `"hasOne"`. [lines 109-117]

### `belongsTo(model, options?)`
Accepts string shorthand or `BelongsToOptions`; returns `RelationDefinition`. [lines 151-161]

### `belongsToMany(model, options)`
Returns `RelationDefinition` with pivot configuration; `options.pivot` required. [lines 208-219]
