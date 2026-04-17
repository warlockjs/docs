# database-seal-plugins
source: validation/database-seal-plugins.ts
description: Registers the embedValidator seal plugin as a side effect on import.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `registerPlugin` from `@warlock.js/seal`
- `embedValidator` from `./plugins/embed-validator-plugin`

## Exports
- `DatabaseSealPlugins` — type alias for embedValidator type  [line 15]

## Classes / Functions / Types / Constants

### Types
- `DatabaseSealPlugins` — union type of registered plugin types  [line 15]

### Side Effects
- side-effects: calls `registerPlugin(embedValidator)` on module load  [line 4]
