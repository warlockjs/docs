# serialization-methods
source: model/methods/serialization-methods.ts
description: Model JSON serialization with resource support
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `GenericObject` from `@mongez/reinforcements`
- `Model` from `../model`

## Exports
- `modelToJSON` — Serialize model to JSON object [lines 4-35]

## Classes / Functions / Types / Constants

### `modelToJSON(model: Model): Record<string, unknown>` [lines 4-35]
- Converts model to JSON using toJsonColumns or resource if defined; recursively serializes loaded relations
