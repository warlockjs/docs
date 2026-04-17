# dirty-methods
source: model/methods/dirty-methods.ts
description: Model dirty tracking methods for change detection
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `Model` from `../model`

## Exports
- `checkHasChanges` — Check if model has pending changes [lines 3-5]
- `checkIsDirty` — Check if specific column is dirty [lines 7-9]
- `getDirtyColumnsWithValues` — Get all dirty columns with old/new values [lines 11-13]
- `getRemovedColumns` — Get list of removed columns [lines 15-17]
- `getDirtyColumns` — Get list of all dirty columns [lines 19-21]

## Classes / Functions / Types / Constants

### `checkHasChanges(model: Model): boolean` [lines 3-5]
- Checks if the model has pending changes via dirtyTracker

### `checkIsDirty(model: Model, column: string): boolean` [lines 7-9]
- Checks if a specific column is marked as dirty

### `getDirtyColumnsWithValues(model: Model): Record<string, { oldValue: unknown; newValue: unknown }>` [lines 11-13]
- Returns map of dirty columns with their old and new values

### `getRemovedColumns(model: Model): string[]` [lines 15-17]
- Returns list of columns that have been removed

### `getDirtyColumns(model: Model): string[]` [lines 19-21]
- Returns list of all columns that have been modified
