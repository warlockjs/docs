# Connectors

Lifecycle management for all framework subsystems (HTTP server, database, cache, storage, communicator). Each connector wraps the startup/shutdown logic for one subsystem. The `ConnectorsManager` orchestrates them by priority.

## Key Files

| File                        | Purpose                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| `base-connector.ts`         | `BaseConnector` abstract class — name, priority, `start()`, `shutdown()`                   |
| `http-connector.ts`         | Starts the Fastify HTTP server                                                             |
| `database-connector.ts`     | Connects to the database via `@warlock.js/cascade`                                         |
| `cache-connector.ts`        | Initializes the cache subsystem via `@warlock.js/cache`                                    |
| `storage.connector.ts`      | Initializes file storage drivers                                                           |
| `communicator-connector.ts` | Connects to message brokers via `@warlock.js/herald`                                       |
| `connectors-manager.ts`     | `ConnectorsManager` — registers, starts, shuts down connectors; handles `SIGINT`/`SIGTERM` |
| `types.ts`                  | `Connector`, `ConnectorName` types                                                         |
| `index.ts`                  | Barrel export                                                                              |

## Key Exports

- `connectorsManager` — singleton `ConnectorsManager` instance
- `BaseConnector` — abstract base for custom connectors
- `HttpConnector`, `DatabaseConnector`, `CacheConnector`, `StorageConnector`, `CommunicatorConnector`
- `Connector`, `ConnectorName` types

## Dependencies

### Internal (within `core/src`)

- `../dev-server/dev-logger` — colored log output
- `../config` — reads subsystem-specific configuration
- `../http` — HTTP server instance
- `../router` — route scanning on HTTP start
- `../storage` — storage driver initialization

### External

- `@warlock.js/cache` — cache driver startup
- `@warlock.js/cascade` — database connection
- `@warlock.js/herald` — communicator connection

## Used By

- Application startup (`bootstrap` → `connectors.start()`)
- `dev-server/` — starts connectors during development
- `production/` — starts connectors during production build
- `tests/` — starts subset of connectors for test environment
