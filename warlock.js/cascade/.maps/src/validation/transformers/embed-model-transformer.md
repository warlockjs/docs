# embed-model-transformer
source: validation/transformers/embed-model-transformer.ts
description: Transforms embedded model data for persistence and serialization
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `TransformerCallback` from `@warlock.js/seal`
- `Model` from `../../model/model`

## Exports
- `databaseModelTransformer` — Callback function that transforms embedded model instances [lines 4-26]

## Functions

### `databaseModelTransformer(value, context)` [lines 4-26]
- Transforms model instances or arrays of models into embedded data format
- Uses `embed` option from context (defaults to "embedData") to extract specific fields
- Returns serialized data structure for database storage
- Supports both string field names and array-based field selection
