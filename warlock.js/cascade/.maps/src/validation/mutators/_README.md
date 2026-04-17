# validation/mutators

Seal mutators that coerce raw IDs, plain objects, or already-resolved Model instances into fully-loaded `Model` objects before validation rules run. `databaseModelMutator` handles a single value; `databaseModelsMutator` handles an array, fetching all matching records in one `whereIn` query.

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [embed-mutator.md](./embed-mutator.md) — databaseModelMutator and databaseModelsMutator seal mutators for resolving IDs/objects to Model instances
