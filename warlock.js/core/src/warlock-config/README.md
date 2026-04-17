# Warlock Config

Manages the `warlock.config.ts` file — a project-level configuration file separate from the `src/config/` directory. The `WarlockConfigManager` lazily compiles `warlock.config.ts` via esbuild, caches the result in `.warlock/cache/`, and provides dot-notation key access.

> **Not to be confused with** `../config/` which handles `src/config/*.ts` files. This module specifically handles the root-level `warlock.config.ts`.

## Key Files

| File                        | Purpose                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `warlock-config.manager.ts` | `WarlockConfigManager` — `load()`, `get()`, `lazyGet()`, `reload()`, `compile()`; singleton `warlockConfigManager` |
| `define-config.ts`          | `defineConfig()` — helper for type-safe config definition in `warlock.config.ts`                                   |
| `default-configurations.ts` | Default config values                                                                                              |
| `types.ts`                  | `WarlockConfig` type definition (server, CLI, plugins, etc.)                                                       |
| `index.ts`                  | Barrel export                                                                                                      |

## Key Exports

- `warlockConfigManager` — singleton instance
- `defineConfig()` — config definition helper
- `WarlockConfig` — type

## Dependencies

### Internal (within `core/src`)

- `../dev-server/transpile-file` — compiles `warlock.config.ts` to JS via esbuild
- `../dev-server/dev-logger` — warning logs
- `../utils` — `rootPath()`, `warlockPath()` for file resolution

### External

- `@mongez/fs` — file read/write
- `@mongez/reinforcements` — `get()` for dot-notation access

## Used By

- `cli/` — loads custom CLI commands from config
- `dev-server/` — reads dev server settings, reloads on HMR
- `connectors/` — may read connector config
- Application startup — loaded early in bootstrap
