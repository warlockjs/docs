# Manifest

Manages the `commands.json` manifest file stored in `.warlock/`. This manifest caches CLI command metadata (names, options, sources) so the CLI can display commands quickly without re-scanning all source files.

## Key Files

| File                  | Purpose                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest-manager.ts` | `ManifestManager` class — load, save, add, clear command metadata; singleton `manifestManager` |

## Key Exports

- `manifestManager` — singleton instance
- `ManifestManager` — class with `loadCommands()`, `saveCommands()`, `addCommandToList()`, `clearCommandsCache()`
- `ManifestCommandData`, `ManifestCommandOption` — types

## Dependencies

### Internal (within `core/src`)

- `../utils` — `warlockPath()` to resolve `.warlock/commands.json`

### External

- `@mongez/fs` — JSON file read/write

## Used By

- `cli/` — loads cached commands for fast CLI startup, saves after discovery
- `dev-server/` — has its own `manifest-manager.ts` for dev-specific manifest tracking
