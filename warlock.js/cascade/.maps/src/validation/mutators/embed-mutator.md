# embed-mutator
source: validation/mutators/embed-mutator.ts
description: Mutators that convert IDs and objects to model instances
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `Mutator` from `@warlock.js/seal`
- `ChildModel, Model` from `../../model/model`
- `getModelFromRegistry` from `../../model/register-model`

## Exports
- `databaseModelMutator` — Converts IDs/objects to single model instance [lines 9-32]
- `databaseModelsMutator` — Converts arrays of IDs/objects to model instances [lines 34-56]

## Types

### `DatabaseModelMutatorOptions` [lines 5-7]
- `model: ChildModel<any> | string` — Target model class or registry name

## Mutators

### `databaseModelMutator(value, context)` [lines 9-32]
- Resolves model class from options (supports string registry names)
- Returns Model instances unchanged
- Converts ID objects to numeric values and fetches from database
- Throws error if model class not found

### `databaseModelsMutator(value, context)` [lines 34-56]
- Processes array values, returning unchanged if not an array
- Resolves model class from options
- Returns Model instances unchanged if all items are models
- Extracts IDs from array items and fetches matching models via query
