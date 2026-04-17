# types
source: types.ts
description: Shared TypeScript type aliases for model behaviour, migration defaults, and database conventions used across the cascade system.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
_(none)_

## Exports
- `StrictMode` — unknown-field handling mode union type  [line 19]
- `DeleteStrategy` — model deletion strategy union type  [line 45]
- `NamingConvention` — database column naming convention union type  [line 67]
- `ModelDefaults` — runtime model behaviour configuration object type  [lines 108-323]
- `UuidStrategy` — UUID generation strategy union type  [line 344]
- `MigrationDefaults` — DDL-level migration defaults configuration object type  [lines 370-413]

## Classes / Functions / Types / Constants

### Types
- `StrictMode` — "strip" | "fail" | "allow"  [line 19]
- `DeleteStrategy` — "trash" | "permanent" | "soft"  [line 45]
- `NamingConvention` — "camelCase" | "snake_case"  [line 67]
- `ModelDefaults` — optional fields controlling IDs, timestamps, deletion, validation  [lines 108-323]
- `UuidStrategy` — "v4" | "v7" for primary-key UUID generation  [line 344]
- `MigrationDefaults` — optional fields for UUID strategy and primary-key type  [lines 370-413]
