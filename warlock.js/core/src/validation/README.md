# Validation

Validation bridge layer. Integrates the framework-agnostic `@warlock.js/seal` validation library with framework-specific features: database validation rules (unique, exists), file validators, and auto-initialization of validation plugins.

## Key Files

| File             | Purpose                                                                          |
| ---------------- | -------------------------------------------------------------------------------- |
| `init.ts`        | Auto-initializes validation — registers Seal plugins for database and file rules |
| `validateAll.ts` | `validateAll()` — validates a full input object against a schema                 |
| `types.ts`       | Framework-specific validation types                                              |
| `database/`      | Database validation rules (`unique`, `exists`, etc.) using `@warlock.js/cascade` |
| `file/`          | File validation rules (size, mime type, dimensions)                              |
| `plugins/`       | Seal plugins that bridge database/file rules                                     |
| `validators/`    | Additional framework-specific validators                                         |
| `index.ts`       | Barrel export                                                                    |

## Key Exports

- `validateAll()` — full-object validation
- Database validators (`unique`, `exists`)
- File validators
- Framework-specific validation types

## Dependencies

### Internal (within `core/src`)

- `../config` — validation configuration

### External

- `@warlock.js/seal` — core validation library (rules, validators, `v` object)
- `@warlock.js/cascade` — database queries for `unique`/`exists` rules

## Used By

- `http/` — validates request input
- `router/` — route-level validation schemas
- `use-cases/` — input validation within use case pipeline
- `restful/` — CRUD input validation
- Application-level validation logic
