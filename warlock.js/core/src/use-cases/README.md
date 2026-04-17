# Use Cases

Transport-agnostic use case pattern. A use case encapsulates a single business operation with a structured execution pipeline: guards → before middleware → handler → after middleware → after-effects. Supports retries, benchmarking, input validation, and lifecycle events.

## Key Files

| File                    | Purpose                                                                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `use-case.ts`           | `useCase()` factory — creates a use case function with full pipeline execution                                                                  |
| `types.ts`              | Extensive types: `UseCase`, `UseCaseGuard`, `UseCaseBeforeMiddleware`, `UseCaseAfterMiddleware`, `UseCaseResult`, `UseCaseConfigurations`, etc. |
| `use-case.errors.ts`    | Custom error classes for use case failures                                                                                                      |
| `use-cases-registry.ts` | Registry for tracking and discovering use cases                                                                                                 |
| `USE-CASES-DESIGN.md`   | Design document for the use case system                                                                                                         |
| `index.ts`              | Barrel export                                                                                                                                   |

## Key Exports

- `useCase(options)` — factory that returns an executable use case function
- `globalUseCasesEvents` — global lifecycle observers (`onExecuting`, `onCompleted`, `onError`)
- `useCasesRegistry` — registry singleton
- Types: `UseCase`, `UseCaseGuard`, `UseCaseBeforeMiddleware`, `UseCaseAfterMiddleware`, `UseCaseResult`, `UseCaseContext`, `UseCaseConfigurations`

## Dependencies

### Internal (within `core/src`)

- `../benchmark` — `measure()` for handler performance tracking
- `../config` — default use case configuration

### External

- `@warlock.js/seal` — `v` (validator) for input validation within use cases
- `@mongez/reinforcements` — `Random`, `except` utilities

## Used By

- Application-level use cases (e.g., `createUserUseCase`, `loginUseCase`)
- `restful/` — may delegate CRUD operations to use cases
- Any business logic that needs structured execution with observability
