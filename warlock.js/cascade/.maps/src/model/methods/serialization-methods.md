# serialization-methods
source: model/methods/serialization-methods.ts
description: Converts a model instance to a plain JSON object via resource or column config.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `GenericObject` from `@mongez/reinforcements`
- `Model` from `../model`

## Exports
- `modelToJSON` — serializes model to plain record using resource or columns  [lines 4-35]

## Classes / Functions / Types / Constants
### `modelToJSON`
[lines 4-35]
- Returns raw `model.data` when no resource/toJsonColumns configured; uses resource class when present; merges loaded relations recursively.
