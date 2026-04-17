# missing-data-source.error

source: errors/missing-data-source.error.ts
description: Error thrown when a requested data source is not found in registry
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
None

## Exports
- `MissingDataSourceError` — Custom error class for missing data sources [lines 9-31]

## Classes / Functions / Types / Constants

### `MissingDataSourceError` [lines 9-31]
- Error thrown when a requested data source is not found in the registry; occurs when retrieving non-existent named sources, default source before registration, or context overrides referencing unregistered sources

#### `dataSourceName?: string` [line 13]
- Optional name of the data source that was not found

#### `constructor(message: string, dataSourceName?: string)` [lines 21-30]
- Creates a new MissingDataSourceError with descriptive message and optional data source name; sets error name and captures stack trace
