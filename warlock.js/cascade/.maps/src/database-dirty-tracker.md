# database-dirty-tracker
source: database-dirty-tracker.ts
description: Change-tracking class that compares initial and current model snapshots (raw and dot-notation flattened) to identify modified, added, and removed fields.
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports

- `areEqual`, `clone` from `@mongez/reinforcements`
- `isPlainObject` from `@mongez/supportive-is`

## Exports

- `DatabaseDirtyTracker` — Class that tracks dirty (changed) and removed columns between initial and current data snapshots.  [lines 71-458]

## Classes / Functions / Types / Constants

### `DatabaseDirtyTracker` [lines 71-458]
- Maintains two parallel representations of model data: raw nested objects (`initialRaw`, `currentRaw`) and dot-notation flattened records (`initialFlattened`, `currentFlattened`).
- On construction both initial and current snapshots are set to a clone of the provided data.
- After each mutating operation (`mergeChanges`, `unset`, `replaceCurrentData`) it recomputes the dirty and removed column sets by comparing flattened snapshots element-by-element using `areEqual`.
- Protected state: `initialRaw`, `currentRaw`, `initialFlattened`, `currentFlattened` (Records); `dirtyColumns`, `removedColumns` (readonly Sets).

#### `constructor(data: Record<string, unknown>)` [lines 104-112]
- Clones `data` into both `initialRaw` and `currentRaw`.
- Flattens `initialRaw` into `initialFlattened`; shallow-copies it to `currentFlattened`.
- Calls `updateDirtyState()` to establish the baseline (always clean at construction).

#### `getDirtyColumns(): string[]` [lines 127-129]
- Returns an array of dot-notation column paths whose values differ from the initial snapshot.

#### `hasChanges(): boolean` [lines 148-150]
- Returns `true` if either `dirtyColumns` or `removedColumns` is non-empty; `false` otherwise.

#### `isDirty(column: string): boolean` [lines 155-157]
- Returns `true` if the specified dot-notation column path is present in the dirty set.

#### `getRemovedColumns(): string[]` [lines 174-176]
- Returns an array of dot-notation paths that existed in the initial snapshot but have since been deleted via `unset`.

#### `getDirtyColumnsWithValues(): Record<string, DirtyColumnValues>` [lines 194-208]
- Returns a map of each dirty column to `{ oldValue, newValue }` sourced from the flattened snapshots.
- `newValue` is `undefined` when the column has been removed from the current snapshot.

#### `replaceCurrentData(data: Record<string, unknown>): void` [lines 225-229]
- Clones `data` into `currentRaw`, re-flattens it into `currentFlattened`, then calls `updateDirtyState()`.
- Replaces the entire current snapshot without touching the initial baseline.

#### `mergeChanges(partial: Record<string, unknown>): void` [lines 247-251]
- Deep-merges `partial` into `currentRaw` via `mergeIntoRaw` (nested objects merged recursively; arrays and primitives are replaced).
- Re-flattens `currentRaw` into `currentFlattened`, then calls `updateDirtyState()`.

#### `unset(columns: string | string[]): void` [lines 268-277]
- Accepts a single column name or an array of dot-notation paths.
- Deletes each path from `currentRaw` via `deleteFromRaw`, then re-flattens and calls `updateDirtyState()`.

#### `reset(data?: Record<string, unknown>): void` [lines 299-309]
- Resets both initial and current snapshots to `data` (or `currentRaw` if omitted).
- Clears `dirtyColumns` and `removedColumns`, making the tracker report no changes.

#### `flattenData(data: Record<string, unknown>): FlatRecord` [lines 315-317]
- Delegates to the module-private `flatten` function.
- Intended as an extension point; subclasses can override to change flattening behavior.

#### `updateDirtyState(): void` [lines 328-352]
- Clears both sets, then iterates all keys present in either flattened snapshot.
- A key absent from `currentFlattened` but present in `initialFlattened` is added to `removedColumns`.
- A key whose current value differs from its initial value (via `areEqual`) is added to `dirtyColumns`.

#### `mergeIntoRaw(target: Record<string, unknown>, source: Record<string, unknown>): void` [lines 364-380]
- Recursively deep-merges `source` into `target`.
- Plain objects are merged recursively; arrays and primitives replace the target value (cloned via `cloneData`).

#### `deleteFromRaw(path: string): void` [lines 391-419]
- Splits `path` on `"."` and traverses `currentRaw` segment by segment using `resolveSegment`.
- On the last segment: removes array element via `splice` for numeric indices, or uses `delete` for object properties.
- Is a no-op if any intermediate segment does not exist or resolves to `null`/`undefined`.

#### `resolveSegment(container: unknown, segment: string): unknown` [lines 431-446]
- Returns the value at `segment` within `container`.
- Handles array index access (numeric string) and object property access.
- Returns `undefined` for non-existent or non-navigable segments.

#### `cloneData<T>(data: T): T` [lines 455-457]
- Thin wrapper around `clone` from `@mongez/reinforcements`.
- Used throughout to prevent shared references between snapshots.
