# dirty-methods
source: model/methods/dirty-methods.ts
description: Pure delegating helpers exposing dirty-tracker state for a Model instance.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `Model` from `../model`

## Exports
- `checkHasChanges` — whether model has any unsaved changes  [lines 3-5]
- `checkIsDirty` — whether a specific column is dirty  [lines 7-9]
- `getDirtyColumnsWithValues` — dirty columns with old/new values  [lines 11-13]
- `getRemovedColumns` — list of columns removed from model  [lines 15-17]
- `getDirtyColumns` — list of all dirty column names  [lines 19-21]

## Classes / Functions / Types / Constants
### `checkHasChanges(model)` [lines 3-5]
- Delegates to `model.dirtyTracker.hasChanges()`

### `checkIsDirty(model, column)` [lines 7-9]
- Delegates to `model.dirtyTracker.isDirty(column)`

### `getDirtyColumnsWithValues(model)` [lines 11-13]
- Returns `Record<string, { oldValue, newValue }>`

### `getRemovedColumns(model)` [lines 15-17]
- Returns string array of removed column names

### `getDirtyColumns(model)` [lines 19-21]
- Returns string array of all dirty column names
