# database-seal-plugins

source: validation/database-seal-plugins.ts
description: Registers database-related seal plugins as a side effect
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `registerPlugin` from `@warlock.js/seal`
- `embedValidator` from `./plugins/embed-validator-plugin`

## Exports
- `DatabaseSealPlugins` — Type alias for embedValidator plugin type [line 15]

## Classes / Functions / Types / Constants

### `DatabaseSealPlugins` [line 15]
- Type representing the embedded validator seal plugin for database validation
