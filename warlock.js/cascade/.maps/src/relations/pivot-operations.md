# pivot-operations
source: relations/pivot-operations.ts
description: Pivot table CRUD operations (attach / detach / sync / toggle) for belongsToMany relationships.
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- `ChildModel`, `Model` from `../model/model`
- `PivotData`, `PivotIds`, `RelationDefinition` from `./types`

## Exports
- `PivotOperations` — Class managing pivot table operations for a single belongsToMany relation instance.  [lines 43-327]
- `createPivotOperations` — Factory that resolves the relation definition and returns a `PivotOperations`.  [lines 341-351]

## Classes / Functions / Types / Constants

### `PivotOperations` [lines 43-327]
- Encapsulates attach / detach / sync / toggle against a single pivot table.
- Constructor validates that the relation is `belongsToMany` and that `pivot` is set; throws otherwise.

#### `constructor(model: Model, relationName: string, definition: RelationDefinition, modelClass: ChildModel<Model>)` [lines 80-101]
- Stores `model`, `relationName`, `definition`, `modelClass`.
- Throws `Error` if `definition.type !== "belongsToMany"` or `definition.pivot` is falsy.

#### `attach(ids: PivotIds, pivotData?: PivotData): Promise<void>` [lines 125-145]
- Fetches already-attached IDs via `getExistingPivotIds()`; skips any already present.
- Inserts new rows `{ [pivotLocalKey]: localKeyValue, [pivotForeignKey]: id, ...pivotData }` via `dataSource.driver.insertMany`.
- Returns early when `ids` is empty or all IDs already exist.

#### `detach(ids?: PivotIds): Promise<void>` [lines 164-178]
- Builds a filter `{ [pivotLocalKey]: localKeyValue }` and optionally adds `{ [pivotForeignKey]: { $in: ids } }`.
- Deletes matching pivot rows via `dataSource.driver.deleteMany`.
- If `ids` is omitted, removes all pivot rows for this model instance.

#### `sync(ids: PivotIds, pivotData?: PivotData): Promise<void>` [lines 195-218]
- Computes the symmetric difference between existing and requested IDs.
- Calls `detach(toDetach)` then `attach(toAttach, pivotData)` in sequence.
- Result: pivot table contains exactly `ids` after completion.

#### `toggle(ids: PivotIds, pivotData?: PivotData): Promise<void>` [lines 234-257]
- For each ID: if currently attached queued for detach; otherwise queued for attach.
- Calls `detach` then `attach` with the respective queues.
- Returns early when `ids` is empty.

### `createPivotOperations` [lines 341-351]

#### `createPivotOperations(model: Model, relationName: string): PivotOperations` [lines 341-351]
- Reads `Model.relations[relationName]` from the constructor; throws if the relation is missing.
- Returns `new PivotOperations(model, relationName, definition, ModelClass)`.
