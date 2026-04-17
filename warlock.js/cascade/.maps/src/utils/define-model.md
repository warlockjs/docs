# define-model
source: utils/define-model.ts
description: Provides defineModel, a declarative factory for creating typed Model subclasses with schema, strategies, and custom properties or statics.
complexity: complex
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `Infer`, `ObjectValidator` from `@warlock.js/seal`
- `ModelSchema` from `../model/model`
- `Model` from `../model/model`
- `registerModelInRegistry` from `../model/register-model`
- `DeleteStrategy`, `StrictMode` from `../types`

## Exports
- `DefineModelOptions` — configuration shape for defineModel  [lines 10-102]
- `defineModel` — factory returning a typed Model subclass  [lines 160-235]
- `ModelType` — type helper to extract schema type from defined model  [lines 254-260]

## Classes / Functions / Types / Constants

### `DefineModelOptions<TSchema>`
type  [lines 10-102]
Options bag: table, name, schema, deleteStrategy, strictMode, ID config, properties, statics.

### `defineModel`
function  [lines 160-235]
side-effects: optionally calls `registerModelInRegistry`; applies instance and static descriptors.
Creates and returns a typed `Model` subclass from options.

### `DefinedModel` (internal class)
class extends `Model<InferredSchema>`  [lines 174-209]
static `table`  [line 178]
static `schema`  [line 183]
static `deleteStrategy`  [line 188]
static `strictMode`  [line 193]
static `autoGenerateId`  [line 198]
static `randomIncrement`  [line 203]
static `initialId`  [line 208]

### `ModelType`
type  [lines 254-260]
Extracts inferred schema type from a `defineModel` return value.
