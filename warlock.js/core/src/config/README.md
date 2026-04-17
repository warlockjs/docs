# Config

Configuration loading and access system. Loads config from TypeScript files, provides a `config()` getter with dot-notation key access, and supports special handlers for specific config keys.

## Key Files

| File                         | Purpose                                                         |
| ---------------------------- | --------------------------------------------------------------- |
| `config-getter.ts`           | `config(key, defaultValue?)` — primary config accessor          |
| `config-handlers.ts`         | Registers handlers that react when specific config keys are set |
| `config-loader.ts`           | Loads config files from `src/config/` directory                 |
| `config-manager.ts`          | Low-level config store                                          |
| `config-special-handlers.ts` | Built-in special handlers (e.g., locale setup)                  |
| `load-config-files.ts`       | File discovery for config directory                             |
| `types.ts`                   | Config type definitions                                         |
| `index.ts`                   | Barrel export                                                   |

## Key Exports

- `config(key, defaultValue?)` — get config value by dot-notation key
- `setConfig(key, value)` — set a config value
- `loadConfigFiles()` — discover and load all `src/config/*.ts` files

## Dependencies

### Internal (within `core/src`)

- `../utils` — path resolution for config directory

### External

- `@mongez/reinforcements` — `get()` for deep dot-notation access

## Used By

- Nearly every module reads config — `http/`, `mail/`, `storage/`, `connectors/`, `repositories/`, `router/`, `validation/`, etc.
- `warlock-config/` is a separate, parallel config system for `warlock.config.ts`
