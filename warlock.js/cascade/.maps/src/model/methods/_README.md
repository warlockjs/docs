# model/methods

Single-responsibility helper modules that implement every behaviour a `Model` instance or class can perform. The `Model` class delegates almost all of its public method bodies to the corresponding function here, keeping the class declaration clean and each concern independently testable. Modules cover field access and dirty tracking, write operations, query execution, event emission, scope management, serialization, hydration, deletion, restoration, and atomic updates.

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [accessor-methods.md](./accessor-methods.md) — Field-level get/set/merge/unset and typed-read helpers operating on model data and the dirty tracker
- [delete-methods.md](./delete-methods.md) — Async single-instance and bulk delete helpers wrapping DatabaseRemover
- [dirty-methods.md](./dirty-methods.md) — Pure delegates exposing dirty-tracker state (hasChanges, isDirty, dirty columns)
- [hydration-methods.md](./hydration-methods.md) — Model construction from raw data, snapshot round-trips, cloning, and data replacement
- [instance-event-methods.md](./instance-event-methods.md) — Emit and subscribe to per-instance lifecycle events across instance, class, and global buses
- [meta-methods.md](./meta-methods.md) — Static defaults application, ID generation, and atomic increment/decrement via DatabaseWriter
- [query-methods.md](./query-methods.md) — Static query helpers: build queries with scopes, find, paginate, count, upsert, atomic updates
- [restore-methods.md](./restore-methods.md) — Async helpers to restore soft-deleted records via DatabaseRestorer
- [scope-methods.md](./scope-methods.md) — Add and remove named global and local query scopes on a model class
- [serialization-methods.md](./serialization-methods.md) — Converts a model instance to a plain JSON object via resource or column configuration
- [static-event-methods.md](./static-event-methods.md) — Per-class and global model event subscription registry
- [write-methods.md](./write-methods.md) — Async create, save, upsert, findOrCreate, and createMany record helpers
