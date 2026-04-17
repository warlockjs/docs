# define-model
source: utils/define-model.ts
description: Factory function that creates a typed Model subclass from a declarative options object, reducing boilerplate and enabling full schema type inference.
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- `Infer`, `ObjectValidator` from `@warlock.js/seal`
- `ModelSchema` from `../model/model`
- `Model` from `../model/model`
- `registerModelInRegistry` from `../model/register-model`
- `DeleteStrategy`, `StrictMode` from `../types`

## Exports
- `DefineModelOptions` — Configuration type for `defineModel`  [lines 10-102]
- `defineModel` — Factory function returning a fully typed Model subclass  [lines 160-235]
- `ModelType` — Utility type that extracts the inferred schema type from a `defineModel` result  [lines 254-260]

## Classes / Functions / Types / Constants

### `DefineModelOptions<TSchema extends ModelSchema>` [lines 10-102]
- Object type capturing all model configuration options:
  - `table: string` — database table/collection name (required).
  - `name?: string` — optional registry name; triggers `registerModelInRegistry` when provided.
  - `schema: ObjectValidator` — validation schema built with `v.object()` from `@warlock.js/seal` (required).
  - `deleteStrategy?: DeleteStrategy` — `"hard"` | `"soft"` | `"disable"` (defaults to `"trash"` inside `defineModel`).
  - `strictMode?: StrictMode` — `"strip"` | `"fail"` (defaults to `"strip"` inside `defineModel`).
  - `autoGenerateId?: boolean` — auto-generate numeric IDs (default `false`).
  - `randomIncrement?: boolean` — random ID increments (default `false`).
  - `initialId?: number` — starting ID value (default `1`).
  - `properties?: ThisType<Model<TSchema>> & Record<string, any>` — instance getters/setters/methods mixed into the prototype via `Object.defineProperties`.
  - `statics?: Record<string, any>` — static methods mixed into the class via `Object.defineProperties`.

### `defineModel<TSchema, TSchemaValidator, TProperties, TStatics>(options): ReturnType` [lines 160-235]
- Creates an anonymous `DefinedModel` class extending `Model<InferredSchema>` with static fields.
- Applies `options.properties` to `DefinedModel.prototype` via `Object.defineProperties` with full descriptor copying (supports getters/setters/methods).
- Calls `registerModelInRegistry(options.name, DefinedModel)` when `options.name` is provided.
- Applies `options.statics` to the class itself via `Object.defineProperties`.
- Returns the class cast to a composite type preserving full TypeScript inference for both instance and static sides: `{ new(initialData?: Partial<InferredSchema>): DefinedModel & TProperties } & Omit<typeof DefinedModel, "new"> & TStatics`.

#### Internal `DefinedModel` static fields [lines 174-209]
- `static table = options.table`  [line 178]
- `static schema = options.schema`  [line 183]
- `static deleteStrategy: DeleteStrategy = options.deleteStrategy || "trash"`  [line 188]
- `static strictMode = options.strictMode || "strip"`  [line 193]
- `static autoGenerateId = options.autoGenerateId || false`  [line 198]
- `static randomIncrement = options.randomIncrement || false`  [line 203]
- `static initialId = options.initialId || 1`  [line 208]

### `ModelType<T extends ReturnType<typeof defineModel>>` [lines 254-260]
- Conditional utility type: extracts `S` from `Model<S>` when `T` is a constructable class that produces a `Model<S>` instance.
- Returns `never` if the type does not match the expected structure.
- Usage: `type UserSchema = ModelType<typeof User>`.
