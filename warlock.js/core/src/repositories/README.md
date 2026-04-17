# Repositories

ORM-agnostic data access layer using the Repository pattern. The `RepositoryManager` provides a rich API for CRUD, filtering, pagination (page-based and cursor-based), caching, and chunked iteration — all delegated to a pluggable adapter.

## Key Files

| File                    | Purpose                                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `repository.manager.ts` | `RepositoryManager` — base class with `find()`, `list()`, `create()`, `update()`, `delete()`, pagination, caching, filtering |
| `adapters/`             | Adapter implementations (e.g., `CascadeAdapter` for `@warlock.js/cascade`)                                                   |
| `contracts/`            | `RepositoryAdapterContract` and related interfaces                                                                           |
| `index.ts`              | Barrel export                                                                                                                |

## Key Exports

- `RepositoryManager` — base repository class to extend
- `CascadeAdapter` — adapter bridging to `@warlock.js/cascade` models
- `RepositoryAdapterContract` — interface for custom adapters
- Types: `RepositoryOptions`, `FilterRules`, `PaginationResult`, `CursorPaginationResult`, etc.

## Dependencies

### Internal (within `core/src`)

- `../config` — reads repository/adapter config

### External

- `@warlock.js/cache` — `cache` singleton for query result caching
- `@warlock.js/cascade` — `CascadeAdapter` wraps Cascade models

## Used By

- Application-level repositories (e.g., `UsersRepository extends RepositoryManager`)
- `restful/` — the RESTful controller uses repositories for CRUD operations
