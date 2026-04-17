# Logger

Thin wrapper around `@warlock.js/logger`. Re-exports a core logger instance and related types for use within the core package.

## Key Files

| File        | Purpose                                   |
| ----------- | ----------------------------------------- |
| `logger.ts` | Core logger instance and helper functions |
| `types.ts`  | Logger type definitions                   |
| `index.ts`  | Barrel export                             |

## Key Exports

- Logger instance / helper functions
- Logger types

## Dependencies

### Internal (within `core/src`)

- None

### External

- `@warlock.js/logger` — full logging implementation (channels, file/console output)

## Used By

- `dev-server/` — dev mode logging
- `connectors/` — startup/shutdown logging
- `http/` — request/response logging
- `database/` — migration logging
- Broadly used across the framework
