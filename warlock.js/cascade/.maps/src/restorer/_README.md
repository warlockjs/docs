# restorer
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> Implements the full model restoration pipeline for trash and soft-delete strategies.

## What lives here
- `database-restorer.ts` — orchestrates model restoration with conflict resolution and event emission

## Public API
- `DatabaseRestorer(modelClass: typeof Model)` — constructs restorer bound to a model class (static context)
- `DatabaseRestorer.restore(id: string | number, options?: RestorerOptions): Promise<RestorerResult>` — restores single deleted record; handles ID conflict and events
- `DatabaseRestorer.restoreAll(options?: RestorerOptions): Promise<RestorerResult>` — restores all deleted records for the model table

## How it fits together
`DatabaseRestorer` is the counterpart to `DatabaseRemover` and operates at the model-class level rather than instance level. It resolves the active strategy via `options.strategy` → `Model.deleteStrategy` → `DataSource.defaultDeleteStrategy` and rejects `"permanent"` upfront since those records are unrecoverable. For `"trash"` strategy it reads from the resolved trash table, re-inserts into the original table, and deletes the trash row. For `"soft"` strategy it issues a `$unset` on the `deletedAt` column without re-inserting (the row was never removed). ID conflicts during bulk restoration are resolved according to `onIdConflict` — either throwing (`"fail"`) or stripping the primary key so the database assigns a new one (`"assignNew"`).

## Working examples
```typescript
import { DatabaseRestorer } from "./database-restorer";

// Restore a single trash-deleted record by ID
const restorer = new DatabaseRestorer(User);
const result = await restorer.restore(123);
console.log(result.success);        // true
console.log(result.strategy);       // "trash" | "soft"
console.log(result.restoredRecord); // Model instance with isNew = false

// Restore a single soft-deleted record, fail on ID conflict
const softResult = await restorer.restore(42, {
  strategy: "soft",
  onIdConflict: "fail",
});

// Restore all trash-deleted records, reassign IDs on conflict
const bulkRestorer = new DatabaseRestorer(Post);
const bulkResult = await bulkRestorer.restoreAll({ onIdConflict: "assignNew" });
console.log(bulkResult.restoredCount); // number of successfully restored records
console.log(bulkResult.conflicts);     // array of { id, reason } for reassigned IDs

// Skip lifecycle events for a silent bulk restore
await bulkRestorer.restoreAll({ skipEvents: true });
```

## DO NOT
- Do NOT attempt to restore records deleted with the `"permanent"` strategy — `restore()` and `restoreAll()` both throw immediately when the resolved strategy is `"permanent"`.
- Do NOT pass a model *instance* to the constructor — `DatabaseRestorer` expects a model *class* (`typeof Model`), not a hydrated instance; use `DatabaseRemover` for instance-level deletion.
- Do NOT set `onIdConflict: "fail"` in `restoreAll()` unless you are certain there are no ID collisions — a single conflict aborts the entire bulk operation with an error.
- Do NOT assume `restoredRecord.isNew` is `true` after restoration — the restorer explicitly sets `model.isNew = false` on every successfully restored record.
