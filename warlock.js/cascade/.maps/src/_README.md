# src
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> Root entry layer of the cascade package, exporting the dirty-tracking classes and shared TypeScript types that every other subsystem depends on.

## What lives here
- `database-dirty-tracker.ts` — change-tracking class that diffs initial and current snapshots using dot-notation flattening
- `sql-database-dirty-tracker.ts` — SQL-aware subclass that preserves nested JSON column structure instead of decomposing it
- `types.ts` — shared union types and configuration object types for model behaviour and migration defaults

## Public API
- `DatabaseDirtyTracker(data)` — initialises dirty tracking from a plain-object snapshot
- `DatabaseDirtyTracker#getDirtyColumns(): string[]` — returns modified dot-notation column paths
- `DatabaseDirtyTracker#hasChanges(): boolean` — true if any column was modified or removed
- `DatabaseDirtyTracker#isDirty(column: string): boolean` — checks whether a specific column is dirty
- `DatabaseDirtyTracker#getRemovedColumns(): string[]` — returns columns removed since baseline
- `DatabaseDirtyTracker#getDirtyColumnsWithValues(): Record<string, { oldValue, newValue }>` — maps each dirty column to old/new pair
- `DatabaseDirtyTracker#replaceCurrentData(data): void` — replaces current snapshot and recomputes diff
- `DatabaseDirtyTracker#mergeChanges(partial): void` — deep-merges partial data into current snapshot
- `DatabaseDirtyTracker#unset(columns): void` — removes one or more columns from current snapshot
- `DatabaseDirtyTracker#reset(data?): void` — resets both snapshots, clears dirty sets
- `SqlDatabaseDirtyTracker(data)` — SQL-aware tracker; inherits full DatabaseDirtyTracker API
- `StrictMode` — `"strip" | "fail" | "allow"` unknown-field handling union
- `DeleteStrategy` — `"trash" | "permanent" | "soft"` model deletion strategy union
- `NamingConvention` — `"camelCase" | "snake_case"` database column naming union
- `ModelDefaults` — runtime model behaviour configuration object type
- `UuidStrategy` — `"v4" | "v7"` UUID generation strategy union
- `MigrationDefaults` — DDL-level migration defaults configuration object type

## How it fits together
`types.ts` has no imports and is the pure-type foundation consumed by every other layer (model, migration, data-source, drivers). `database-dirty-tracker.ts` imports only from external packages (`@mongez/reinforcements`, `@mongez/supportive-is`) and is used by the model layer to track field mutations before persistence. `sql-database-dirty-tracker.ts` extends `DatabaseDirtyTracker` and is wired in by SQL drivers that need whole-column JSON comparison. Nothing inside this folder imports from subdirectories; subdirectories import upward from here.

## Working examples
```typescript
// Track field changes on a model record
const tracker = new DatabaseDirtyTracker({ name: "Alice", age: 30 });
tracker.mergeChanges({ age: 31 });
console.log(tracker.hasChanges()); // true
console.log(tracker.getDirtyColumns()); // ["age"]
console.log(tracker.getDirtyColumnsWithValues());
// { age: { oldValue: 30, newValue: 31 } }

// Remove a field and inspect removed columns
tracker.unset("age");
console.log(tracker.getRemovedColumns()); // ["age"]

// Reset to current state as the new baseline
tracker.reset();
console.log(tracker.hasChanges()); // false
```

```typescript
// SQL tracker keeps JSON columns intact (no dot-notation decomposition)
const sqlTracker = new SqlDatabaseDirtyTracker({
  name: "Bob",
  meta: { role: "admin", level: 2 },
});
sqlTracker.mergeChanges({ meta: { role: "editor", level: 2 } });
console.log(sqlTracker.getDirtyColumns()); // ["meta"]  — whole column, not "meta.role"
```

```typescript
// Use shared types in model configuration
import type { StrictMode, DeleteStrategy, NamingConvention, ModelDefaults } from "@warlock.js/cascade";

const defaults: ModelDefaults = {
  namingConvention: "snake_case",
  deleteStrategy: "soft",
  strictMode: "fail",
  timestamps: true,
};
```

```typescript
// Configure migration defaults per data source
import type { MigrationDefaults, UuidStrategy } from "@warlock.js/cascade";

const migrationDefaults: MigrationDefaults = {
  uuidStrategy: "v7",
  primaryKey: "uuid",
};
```

## DO NOT
- Do NOT call `updateDirtyState()` directly — it is a protected internal method called automatically by all mutating public methods.
- Do NOT use `SqlDatabaseDirtyTracker` for MongoDB or document databases — it disables dot-notation flattening, so nested field changes will be tracked only at the top-level key.
- Do NOT pass already-flattened dot-notation objects to `DatabaseDirtyTracker` — the constructor expects raw nested objects and flattens them internally; double-flattening produces incorrect dirty paths.
- Do NOT read `dirtyColumns` or `removedColumns` directly as Sets — use `getDirtyColumns()` and `getRemovedColumns()` which return plain arrays.
- Do NOT assume `reset()` with no argument resets to the original construction data — it resets to the current snapshot, making current state the new baseline.
