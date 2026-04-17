# index
source: relations/index.ts
description: Barrel export for relation definitions, loaders, and helper functions
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
None (barrel file with doc example)

## Exports
- Types: `BelongsToManyOptions, BelongsToOptions, HasManyOptions, HasOneOptions, LoadedRelationResult, LoadedRelationsMap, PivotData, PivotIds, RelationConstraintCallback, RelationConstraints, RelationDefinition, RelationDefinitions, RelationType` [lines 31-45]
- `belongsTo` from `./helpers` [line 48]
- `belongsToMany` from `./helpers` [line 48]
- `hasMany` from `./helpers` [line 48]
- `hasOne` from `./helpers` [line 48]
- `RelationLoader` from `./relation-loader` [line 51]
- `RelationHydrator` from `./relation-hydrator` [line 54]
- Types: `ModelSnapshot, SerializedRelation` from `./relation-hydrator` [line 55]
- `PivotOperations` from `./pivot-operations` [line 58]
- `createPivotOperations` from `./pivot-operations` [line 58]

## Summary
Comprehensive barrel exporting relation type definitions, helper functions (belongsTo, belongsToMany, hasMany, hasOne), RelationLoader, RelationHydrator, and PivotOperations for managing model relationships.
