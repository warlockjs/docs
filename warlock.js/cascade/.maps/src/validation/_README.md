# validation

Entry point for Cascade's database-aware validation layer. Importing `index.ts` side-effect-loads `database-seal-plugins.ts`, which registers the `embedValidator` seal plugin so that `v.embed` and `v.embedMany` become available globally. When model validation fails during a write, `DatabaseWriterValidationError` is thrown carrying structured per-field seal validation results with colored terminal formatting.

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [database-seal-plugins.md](./database-seal-plugins.md) — Registers database-related seal plugins as a side effect on import
- [database-writer-validation-error.md](./database-writer-validation-error.md) — Custom Error subclass carrying structured per-field validation results with colored terminal output
- [index.md](./index.md) — Barrel re-exporting DatabaseWriterValidationError with side-effect plugin registration

## Subdirectories

- [mutators/](./mutators/_README.md) — Seal mutators coercing raw IDs or objects to fully-loaded Model instances
- [plugins/](./plugins/_README.md) — Seal plugin adding v.embed and v.embedMany to the validation factory
- [rules/](./rules/_README.md) — Seal rules asserting values are proper Model instances
- [transformers/](./transformers/_README.md) — Seal transformer extracting embed data from validated Model instances
- [validators/](./validators/_README.md) — EmbedModelValidator wiring mutators, rules, and transformer into a complete pipeline
