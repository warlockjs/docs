# embed-mutator
source: validation/mutators/embed-mutator.ts
description: Seal mutators that resolve raw values or IDs into Model instances.
complexity: medium
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `Mutator` from `@warlock.js/seal`
- `ChildModel`, `Model` from `../../model/model`
- `getModelFromRegistry` from `../../model/register-model`

## Exports
- `databaseModelMutator` — resolves single value to Model instance  [lines 9-32]
- `databaseModelsMutator` — resolves array of values to Model instances  [lines 34-56]

## Classes / Functions / Types / Constants

### Types
- `DatabaseModelMutatorOptions` — `{ model: ChildModel<any> | string }`  [lines 5-7]

### Constants
- `databaseModelMutator: Mutator<DatabaseModelMutatorOptions>` — async; resolves id/object to model via `ModelClass.find`  [lines 9-32]
  - throws: `Error` if model not found in registry
  - side-effects: queries database via `ModelClass.find(value)`
- `databaseModelsMutator: Mutator<DatabaseModelMutatorOptions>` — async; resolves id array to models via `whereIn`  [lines 34-56]
  - throws: `Error` if model not found in registry
  - side-effects: queries database via `ModelClass.query().whereIn(...).get()`
