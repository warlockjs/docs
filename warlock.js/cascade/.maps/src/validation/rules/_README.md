# validation/rules

Seal schema rules that run after mutators and assert that a validated value is a proper `Model` instance (single) or an array of `Model` instances (collection). By the time these rules execute, the mutators should have already resolved raw IDs into model instances; if resolution failed the rules return `invalidRule` with the model name interpolated into the error message.

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [database-model-rule.md](./database-model-rule.md) — databaseModelRule and databaseModelsRule seal SchemaRule objects for validating Model instances
