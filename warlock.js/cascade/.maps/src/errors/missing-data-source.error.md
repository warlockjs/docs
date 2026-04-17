# missing-data-source.error
source: errors/missing-data-source.error.ts
description: Error thrown when a requested data source is not found in the registry.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `Error` from builtin

## Exports
- `MissingDataSourceError` — Error class for missing data sources [line 9]

## Classes
### MissingDataSourceError [lines 9-31] — Represents missing data source error
extends: Error
fields:
- `dataSourceName?: string`  [line 13]
