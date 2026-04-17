# writer

Contains the `DatabaseWriter` service that orchestrates the full model persistence pipeline. On `save()` it runs a sequential pipeline: emit saving event, validate and cast via `@warlock.js/seal`, generate a next ID for new NoSQL records, execute insert or update through the driver, merge driver-returned data back into the model, reset the dirty tracker, emit post-save events, and fire a non-blocking sync notification.

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [database-writer.md](./database-writer.md) — DatabaseWriter class orchestrating validation, ID generation, driver insert/update, events, and sync
