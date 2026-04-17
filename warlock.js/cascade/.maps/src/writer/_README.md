# Writer
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> Folder containing the database writer service that orchestrates the full model persistence pipeline including validation, event emission, ID generation, and driver execution.

## What lives here
- `database-writer.ts` — Orchestrates model save pipeline with validation, events, ID generation, and insert/update execution via driver.

## Public API
- `DatabaseWriter(model: Model)` — Initializes writer from model metadata and data source.
- `DatabaseWriter.save(options?: WriterOptions): Promise<WriterResult>` — Executes full save pipeline; throws `DatabaseWriterValidationError` on failure.
- `DatabaseWriter.generateNextId(): Promise<void>` — Generates and sets auto-incremented id on model when enabled.

## How it fits together
`DatabaseWriter` is instantiated with a `Model` instance and reads its constructor metadata (table, primaryKey, schema, strictMode, dataSource) to drive persistence. On `save()`, it runs a sequential pipeline: emit saving event, validate/cast via `@warlock.js/seal`, emit lifecycle events, execute insert or update through `DriverContract`, merge returned data back into the model, reset the dirty tracker, then fire post-save events and trigger sync via `@mongez/events`. It depends on `DataSource` for the driver and ID generator, `DatabaseWriterValidationError` for structured validation failures, and `getModelUpdatedEvent` from the sync layer for downstream sync notifications.

## Working examples
```typescript
import { DatabaseWriter } from "./database-writer";

// Insert a new record
const user = new User({ name: "Alice", email: "alice@example.com" });
const writer = new DatabaseWriter(user);
await writer.save();

console.log(user.get("id"));   // auto-generated integer id
console.log(user.get("_id"));  // driver-returned ObjectId

// Partial update — only dirty fields are sent to the driver
user.set("name", "Alice Smith");
await writer.save();

// Replace full document
await writer.save({ replace: true });

// Skip events and validation (e.g. seeding)
await writer.save({ skipEvents: true, skipValidation: true });

// Skip downstream sync after update
await writer.save({ skipSync: true });
```

## DO NOT
- Do NOT call `generateNextId()` manually before `save()` — `save()` invokes it internally during `performInsert` and calling it twice will skip generation if `id` is already set.
- Do NOT reuse a single `DatabaseWriter` instance across different model instances — the constructor captures model metadata once; create a new `DatabaseWriter` per model.
- Do NOT pass `skipValidation: true` in production insert flows — the schema cast via `@warlock.js/seal` is required for data integrity and strict-mode enforcement.
- Do NOT mutate `model.data` directly after `save()` to work around the dirty tracker — use `model.set()` so the tracker records changes for correct partial updates on the next `save()`.
