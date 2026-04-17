# database-writer.utils
source: utils/database-writer.utils.ts
description: Provides a factory that wraps a model-aware callback into a seal TransformerCallback for pre-save value transformation.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `TransformerCallback` from `@warlock.js/seal`
- `Model` from `../model/model`

## Exports
- `ModelTransformCallback` — callback type receiving model transform options  [line 12]
- `useModelTransformer` — wraps model callback into seal TransformerCallback  [lines 17-28]

## Classes / Functions / Types / Constants

### `ModelTransformCallback`
type  [line 12]
Function signature for model-aware value transformer callbacks.

### `useModelTransformer`
function  [lines 17-28]
Adapts a `ModelTransformCallback` to seal's `TransformerCallback` shape.
