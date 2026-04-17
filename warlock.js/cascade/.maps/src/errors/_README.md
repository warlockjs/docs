# errors

Custom error classes for the two most critical failure modes in Cascade: inability to resolve a named data source and an explicit transaction rollback. Both classes extend native `Error`, capture V8 stack traces, and carry typed fields so callers can inspect failure context programmatically rather than parsing message strings.

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [missing-data-source.error.md](./missing-data-source.error.md) — Error thrown when a requested data source cannot be found in the registry
- [transaction-rollback.error.md](./transaction-rollback.error.md) — Error used as a control-flow signal to roll back an in-progress transaction
