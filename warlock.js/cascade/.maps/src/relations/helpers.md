# helpers
source: relations/helpers.ts
description: Fluent factory functions for declaring hasMany, hasOne, belongsTo, and belongsToMany relations on models.
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- `BelongsToManyOptions`, `BelongsToOptions`, `HasManyOptions`, `HasOneOptions`, `RelationDefinition` from `./types`

## Exports
- `hasMany` — Returns a `RelationDefinition` for a one-to-many relation.  [lines 64-72]
- `hasOne` — Returns a `RelationDefinition` for a one-to-one relation (FK on related model).  [lines 109-117]
- `belongsTo` — Returns a `RelationDefinition` for an inverse (many-to-one) relation.  [lines 151-161]
- `belongsToMany` — Returns a `RelationDefinition` for a many-to-many pivot relation.  [lines 208-219]

## Classes / Functions / Types / Constants

### `hasMany` [lines 64-72]

#### `hasMany(model: string, options?: HasManyOptions): RelationDefinition` [lines 64-72]
- Sets `type: "hasMany"`.
- `localKey` defaults to `"id"` when not supplied.
- `foreignKey` and `select` are passed through as-is (undefined if omitted).

### `hasOne` [lines 109-117]

#### `hasOne(model: string, options?: HasOneOptions): RelationDefinition` [lines 109-117]
- Sets `type: "hasOne"`.
- `localKey` defaults to `"id"` when not supplied.
- `foreignKey` and `select` are passed through as-is (undefined if omitted).

### `belongsTo` [lines 151-161]

#### `belongsTo(model: string, options?: BelongsToOptions | string): RelationDefinition` [lines 151-161]
- Accepts `options` as either a `BelongsToOptions` object or a plain `string` shorthand for `foreignKey`.
- When a string is passed it is normalized to `{ foreignKey: options, ownerKey: "id" }`.
- Maps `ownerKey` to `localKey` in the returned definition.
- Sets `type: "belongsTo"`.

### `belongsToMany` [lines 208-219]

#### `belongsToMany(model: string, options: BelongsToManyOptions): RelationDefinition` [lines 208-219]
- `options.pivot` is required (enforced by `BelongsToManyOptions` type).
- `pivotLocalKey` defaults to `"id"`; `pivotForeignKey` defaults to `"id"` when not supplied.
- `localKey`, `foreignKey`, and `select` are passed through as-is.
- Sets `type: "belongsToMany"`.

## Ambiguities
- `belongsTo` accepts a `string` shorthand for `foreignKey` — in that path `ownerKey` is hardcoded to `"id"` and cannot be overridden without switching to the object form. This behaviour is implicit and not noted in the JSDoc.
