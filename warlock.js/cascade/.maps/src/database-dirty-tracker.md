# database-dirty-tracker
source: database-dirty-tracker.ts
description: Tracks model data mutations by diffing initial and current snapshots using dot-notation flattening to detect changed, added, and removed fields.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `areEqual`, `clone` from `@mongez/reinforcements`
- `isPlainObject` from `@mongez/supportive-is`

## Exports
- `DatabaseDirtyTracker` — change-tracking class for model data  [lines 71-458]

## Classes / Functions / Types / Constants

### Classes
- `DatabaseDirtyTracker` — compares flattened snapshots to track dirty/removed columns  [lines 71-458]

#### Public Methods
- `constructor(data)` — initialises both snapshots and computes initial dirty state  [lines 104-112]
  - side-effects: clones data, calls `updateDirtyState`
- `getDirtyColumns()` — returns array of modified dot-notation column paths  [lines 127-129]
- `hasChanges()` — true if any column was modified or removed  [lines 148-150]
- `isDirty(column)` — checks whether a specific column is dirty  [lines 155-157]
- `getRemovedColumns()` — returns array of columns removed since baseline  [lines 174-176]
- `getDirtyColumnsWithValues()` — maps each dirty column to oldValue/newValue pair  [lines 194-208]
- `replaceCurrentData(data)` — replaces current snapshot and recomputes diff  [lines 225-229]
  - side-effects: mutates `currentRaw`, `currentFlattened`; calls `updateDirtyState`
- `mergeChanges(partial)` — deep-merges partial data into current snapshot  [lines 247-251]
  - side-effects: mutates `currentRaw`, `currentFlattened`; calls `updateDirtyState`
- `unset(columns)` — removes one or more columns from current snapshot  [lines 268-277]
  - side-effects: deletes keys from `currentRaw`; calls `updateDirtyState`
- `reset(data?)` — resets both snapshots to given or current data, clears dirty sets  [lines 299-309]
  - side-effects: clears `dirtyColumns`, `removedColumns`; replaces all snapshot fields
