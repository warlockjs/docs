# Application

Static utility class providing global application metadata: environment detection, directory paths, uptime, and framework version.

## Key Files

| File                          | Purpose                                                                 |
| ----------------------------- | ----------------------------------------------------------------------- |
| `application.ts`              | `Application` static class with getters for env, paths, uptime, version |
| `application-config-types.ts` | TypeScript types for application configuration                          |
| `index.ts`                    | Barrel export                                                           |

## Key Exports

- `Application` — static class; primary access point for `environment`, `isProduction`, `isDevelopment`, `isTest`, `rootPath`, `srcPath`, `appPath`, `storagePath`, `uploadsPath`, `publicPath`, `uptime`, `version`

## Dependencies

### Internal (within `core/src`)

- `../utils/environment` — `environment()`, `setEnvironment()`
- `../utils/framework-vesion` — `getFrameworkVersion()`
- `../utils/paths` — all path helper functions (`rootPath`, `srcPath`, etc.)

### External

- None

## Used By

- Any module needing env checks or resolved directory paths
- `connectors/` — checks environment during startup
- `http/` — uses paths for static file serving
- `storage/` — resolves upload/storage directories
