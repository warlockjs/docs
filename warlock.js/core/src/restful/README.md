# RESTful

RESTful resource controller. Generates standard CRUD route handlers (list, get, create, update, patch, delete, bulk delete) that work with the repository and resource layers.

## Key Files

| File         | Purpose                                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `restful.ts` | `Restful` base class — provides `list()`, `get()`, `create()`, `update()`, `patch()`, `delete()`, `bulkDelete()` handlers |
| `index.ts`   | Barrel export                                                                                                             |

## Key Exports

- `Restful` — base class to extend for RESTful endpoints

## Dependencies

### Internal (within `core/src`)

- `../http` — `Request`, `Response` objects
- `../repositories` — `RepositoryManager` for data access
- `../resource` — `Resource` for serializing responses
- `../validation` — validates request input

### External

- `@warlock.js/cascade` — model types

## Used By

- `router/` — `router.restfulResource(path, resource)` creates routes backed by a `Restful` controller
- Application-level RESTful resources
