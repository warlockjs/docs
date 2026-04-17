# Bootstrap

Framework initialization. Loads environment variables, initializes dayjs, and captures unhandled promise rejections.

> **Note:** The root-level `bootstrap.ts` (in `core/src/bootstrap.ts`) calls `loadEnv()`, `initializeDayjs()`, and `captureAnyUnhandledRejection()`. The `setup.ts` inside this folder provides the `displayEnvironmentMode()` helper.

## Key Files

| File       | Purpose                                                                           |
| ---------- | --------------------------------------------------------------------------------- |
| `setup.ts` | `displayEnvironmentMode()` — logs current env mode to console with colored output |

The sibling `../bootstrap.ts` at `core/src/bootstrap.ts` is the actual bootstrap entry point.

## Key Exports

- `displayEnvironmentMode()` — prints colored environment mode on startup

## Dependencies

### Internal (within `core/src`)

- `../utils` — `environment()` for detecting current env

### External

- `@mongez/copper` — terminal colors
- `@mongez/dotenv` — `loadEnv()` (used by parent `bootstrap.ts`)
- `@mongez/time-wizard` — `initializeDayjs()`
- `@warlock.js/logger` — `captureAnyUnhandledRejection()` (used by parent `bootstrap.ts`)

## Used By

- Application startup sequence — called before connectors start
- `dev-server/` — invokes bootstrap during development mode
