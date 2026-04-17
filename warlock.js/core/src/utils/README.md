# Utils

Shared utility functions used across the entire framework. Provides path resolution, environment detection, logging helpers, async queue, sleep, slugification, and more.

## Key Files

| File                    | Purpose                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `paths.ts`              | `rootPath()`, `srcPath()`, `appPath()`, `storagePath()`, `uploadsPath()`, `publicPath()`, `warlockPath()` — resolve standard project directories |
| `environment.ts`        | `environment()`, `setEnvironment()` — detect and set current env (`development`, `production`, `test`)                                           |
| `framework-vesion.ts`   | `getFrameworkVersion()` — reads version from `package.json`                                                                                      |
| `queue.ts`              | `Queue` — async task queue with concurrency control                                                                                              |
| `sleep.ts`              | `sleep(ms)` — promise-based delay                                                                                                                |
| `sluggable.ts`          | `sluggable(text)` — URL-safe slug generation                                                                                                     |
| `get-localized.ts`      | `getLocalized()` — extracts localized value for current locale                                                                                   |
| `to-json.ts`            | `toJSON()` — safe JSON serialization                                                                                                             |
| `promise-all-object.ts` | `promiseAllObject()` — `Promise.all` for an object of promises                                                                                   |
| `download-file.ts`      | `downloadFile()` — downloads a file from a URL                                                                                                   |
| `cleanup-temp-files.ts` | Cleans up temporary files                                                                                                                        |
| `app-log.ts`            | Application-level log helper                                                                                                                     |
| `database-log.ts`       | Database operation log helper                                                                                                                    |
| `internal.ts`           | Internal utility functions                                                                                                                       |
| `urls.ts`               | URL construction helpers                                                                                                                         |
| `types.ts`              | Shared utility types                                                                                                                             |
| `index.ts`              | Barrel export                                                                                                                                    |

## Key Exports

- Path functions: `rootPath`, `srcPath`, `appPath`, `storagePath`, `uploadsPath`, `publicPath`, `warlockPath`
- `environment()` / `setEnvironment()`
- `getFrameworkVersion()`
- `Queue`, `sleep`, `sluggable`, `getLocalized`, `toJSON`, `promiseAllObject`, `downloadFile`

## Dependencies

### Internal (within `core/src`)

- None (leaf module — depended upon by everything else)

### External

- `@mongez/dotenv` — `env()` for reading `.env` values
- `@mongez/reinforcements` — general utilities

## Used By

- Nearly every other module in `core/src` — this is the foundational utility layer
