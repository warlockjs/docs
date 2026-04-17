# types
source: relations/types.ts
description: Defines all TypeScript types and interfaces for the Cascade relations system.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `QueryBuilderContract` from `../contracts`
- `Model` from `../model/model`

## Exports
- `RelationType` — union of four relation type strings  [line 33]
- `RelationDefinition` — complete structural description of one relation  [lines 55-105]
- `HasManyOptions` — config options for hasMany helper  [lines 122-143]
- `HasOneOptions` — config options for hasOne helper  [lines 156-177]
- `BelongsToOptions` — config options for belongsTo helper  [lines 190-209]
- `BelongsToManyOptions` — config options for belongsToMany helper  [lines 226-265]
- `RelationConstraintCallback` — query modifier callback type  [line 281]
- `RelationConstraints` — map of relation names to callbacks or booleans  [line 299]
- `LoadedRelationResult` — single model, array, or null  [line 311]
- `LoadedRelationsMap` — Map storing loaded relation data on a model  [line 323]
- `RelationDefinitions` — Record type for model static `relations` property  [line 345]
- `PivotData` — extra key-value data stored in pivot rows  [line 359]
- `PivotIds` — array of number or string IDs for pivot operations  [line 365]

## Classes / Functions / Types / Constants

### `type RelationType`
`"hasOne" | "hasMany" | "belongsTo" | "belongsToMany"`. [line 33]

### `type RelationDefinition`
readonly fields: `type`, `model`, `foreignKey?`, `localKey?`, `pivot?`, `pivotLocalKey?`, `pivotForeignKey?`, `select?`. [lines 55-105]

### `type RelationConstraintCallback`
`(query: QueryBuilderContract) => void`. [line 281]

### `type LoadedRelationResult`
`Model | Model[] | null`. [line 311]

### `type LoadedRelationsMap`
`Map<string, LoadedRelationResult>`. [line 323]

### `type PivotIds`
`(number | string)[]`. [line 365]
