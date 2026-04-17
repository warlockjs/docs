# database-writer.utils

source: utils/database-writer.utils.ts
description: Utility for transforming model data before database persistence
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `TransformerCallback` from `@warlock.js/seal` (type)
- `Model` from `../model/model` (type)

## Exports
- `ModelTransformCallback` — Type for model transformation callbacks [line 12]
- `useModelTransformer` — Function to create model transformer callbacks [lines 17-28]

## Classes / Functions / Types / Constants

### `transformCallbackOptions` [lines 4-10]
- Object type containing model transformation context: model, column, value, isChanged, isNew

### `ModelTransformCallback` [line 12]
- Type alias for a transformation callback that receives options and returns a transformed string value

#### `useModelTransformer(callback: ModelTransformCallback): TransformerCallback` [lines 17-28]
- Creates a transformer callback that applies the given model transformation callback before saving values to the database; extracts model context, column name, and change state
