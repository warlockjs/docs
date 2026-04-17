# embed-model-transformer
source: validation/transformers/embed-model-transformer.ts
description: Seal transformer extracting embed data from Model instances for storage.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `TransformerCallback` from `@warlock.js/seal`
- `Model` from `../../model/model`

## Exports
- `databaseModelTransformer` — transforms Model(s) to embed data  [lines 4-26]

## Classes / Functions / Types / Constants

### Constants
- `databaseModelTransformer: TransformerCallback` — extracts embed field(s) from single or array Model value  [lines 4-26]
  - Reads `context.options.embed` (default `"embedData"`)
  - Returns raw value unchanged if not a Model or array
  - For arrays: maps each item using string embed key or `item.only(embed)`
  - For single Model: returns `value[embed]` or `value.only(embed)`
