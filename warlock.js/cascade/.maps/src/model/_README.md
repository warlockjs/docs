# model

Defines the abstract `Model` base class, the supporting type definitions for scopes and schemas, and the global model registry with its `@RegisterModel` decorator. The `Model` class is a thin orchestration layer that delegates almost all method logic to the pure helper functions in the `methods/` subdirectory, keeping each concern independently testable.

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [model.md](./model.md) — Abstract Model base class with data access, dirty tracking, query helpers, lifecycle events, relations, and serialization
- [model.types.md](./model.types.md) — ScopeTiming, GlobalScopeDefinition, LocalScopeCallback, GlobalScopeOptions, ModelSchema, and ChildModel type definitions
- [register-model.md](./register-model.md) — Global model registry and @RegisterModel decorator for string-based model resolution

## Subdirectories

- [methods/](./methods/_README.md) — Single-responsibility helper modules implementing every Model behaviour
