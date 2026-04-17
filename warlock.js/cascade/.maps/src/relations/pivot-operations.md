# pivot-operations
source: relations/pivot-operations.ts
description: Manages attach, detach, sync, and toggle operations on a belongsToMany pivot table.
complexity: medium
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `ChildModel`, `Model` from `../model/model`
- `PivotData`, `PivotIds`, `RelationDefinition` from `./types`

## Exports
- `PivotOperations` — class managing pivot table CRUD  [lines 43-327]
- `createPivotOperations` — factory resolving relation and returning instance  [lines 341-351]

## Classes / Functions / Types / Constants

### `class PivotOperations`
Encapsulates all pivot table mutations for a single belongsToMany relation. [lines 43-327]

#### `constructor(model, relationName, definition, modelClass)`
throws: `Error` if relation type is not `belongsToMany` or pivot is missing. [lines 80-101]

#### `public async attach(ids, pivotData?)`
Inserts new pivot rows, skipping already-attached IDs.
throws: propagates driver errors.
side-effects: writes rows to pivot table via `dataSource.driver.insertMany`. [lines 125-145]

#### `public async detach(ids?)`
Deletes pivot rows; removes all if `ids` omitted.
throws: propagates driver errors.
side-effects: deletes rows from pivot table via `dataSource.driver.deleteMany`. [lines 164-178]

#### `public async sync(ids, pivotData?)`
Detaches removed IDs and attaches new IDs to match target set.
throws: propagates driver errors.
side-effects: may call `detach` and `attach`, mutating pivot table. [lines 195-218]

#### `public async toggle(ids, pivotData?)`
Attaches unattached IDs and detaches already-attached IDs.
throws: propagates driver errors.
side-effects: may call `detach` and `attach`, mutating pivot table. [lines 234-257]

### `createPivotOperations(model, relationName)`
throws: `Error` if relation is undefined on model class. [lines 341-351]
