# remover
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> Implements the full model deletion pipeline supporting trash, soft, and permanent strategies.

## What lives here
- `database-remover.ts` — orchestrates model deletion with strategy routing, event emission, and post-deletion sync

## Public API
- `DatabaseRemover(model: Model)` — constructs remover bound to a model instance
- `DatabaseRemover.destroy(options?: RemoverOptions): Promise<RemoverResult>` — executes deletion pipeline; resolves strategy, validates, emits events

## How it fits together
`DatabaseRemover` receives a saved `Model` instance and resolves the active delete strategy via the priority chain: `options.strategy` → `Model.deleteStrategy` → `DataSource.defaultDeleteStrategy` → `"permanent"`. It delegates the actual write to `DriverContract` (insert to trash table, hard delete, or soft `$set` of `deletedAt`). After a successful deletion it emits `deleting`/`deleted` lifecycle events through the model and fires a fire-and-forget sync via `@mongez/events` so downstream sync operations are notified without blocking the caller.

## Working examples
```typescript
import { DatabaseRemover } from "./database-remover";

// Permanent delete (default when no strategy configured)
const user = await User.find(1);
const remover = new DatabaseRemover(user);
const result = await remover.destroy();
console.log(result.success);   // true
console.log(result.strategy);  // "permanent"

// Trash strategy (moves record to trash table before deleting)
const post = await Post.find(42);
const trashRemover = new DatabaseRemover(post);
const trashResult = await trashRemover.destroy({ strategy: "trash" });
console.log(trashResult.trashRecord); // { ...originalData, deletedAt, originalTable }

// Soft delete (stamps deletedAt column, record stays in table)
const comment = await Comment.find(7);
const softRemover = new DatabaseRemover(comment);
await softRemover.destroy({ strategy: "soft", skipSync: true });
```

## DO NOT
- Do NOT call `destroy()` on a model where `isNew === true` — it will throw because the record has never been saved to the database.
- Do NOT use the `"soft"` strategy unless `Model.deletedAtColumn` is configured — the remover throws explicitly if the column is `false` or `undefined`.
- Do NOT rely on `model.isNew` to stay `false` after a `"trash"` or `"permanent"` deletion — the remover resets it to `true` as part of post-deletion cleanup; only soft-deleted models retain `isNew = false`.
- Do NOT construct `DatabaseRemover` with a model class (static reference) — it requires a hydrated model *instance*; use `DatabaseRestorer` for class-level operations.
