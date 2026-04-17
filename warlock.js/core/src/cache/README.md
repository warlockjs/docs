# Cache

Database-backed cache driver. Bridges `@warlock.js/cache` to the database layer by implementing a `CacheDriver` that stores cache entries in a database table.

On import, this module auto-registers the `"database"` driver with the cache manager.

## Key Files

| File                       | Purpose                                                                           |
| -------------------------- | --------------------------------------------------------------------------------- |
| `database-cache-driver.ts` | `DatabaseCacheDriver` — implements `CacheDriver` contract using database queries  |
| `index.ts`                 | Barrel export + auto-registers driver via `cache.registerDriver("database", ...)` |

## Key Exports

- `DatabaseCacheDriver` — class implementing the cache driver contract
- `DatabaseCacheOptions` — type for driver configuration

## Dependencies

### Internal (within `core/src`)

- None directly (uses database via `@warlock.js/cascade` contracts)

### External

- `@warlock.js/cache` — `cache` singleton, `CacheDriver` contract

## Used By

- `connectors/cache-connector` — starts the cache subsystem which may use this driver
- Any application configuring `"database"` as their cache backend
