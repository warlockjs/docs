# validation/mutators
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> Seal mutators that coerce raw IDs or plain objects into fully-loaded Model instances before validation rules run.

## What lives here
- `embed-mutator.ts` — exports `databaseModelMutator` (single) and `databaseModelsMutator` (array) seal mutators

## Public API
- `databaseModelMutator: Mutator<DatabaseModelMutatorOptions>` — resolves single id/object to Model via `ModelClass.find`
- `databaseModelsMutator: Mutator<DatabaseModelMutatorOptions>` — resolves id array to Model instances via `whereIn`
- `DatabaseModelMutatorOptions` — `{ model: ChildModel<any> | string }` options type

## How it fits together
These mutators sit in the seal pipeline before the rule phase. `EmbedModelValidator` registers them via `addMutator` when `.model()` or `.models()` is called. A caller may pass a raw numeric ID, a plain object with an `id` field, or already-resolved Model instances; the mutators normalise all three forms by querying the database so downstream rules always receive `Model` instances. The `model` option accepts either a class reference or a string name resolved through `getModelFromRegistry`.

## Working examples
```typescript
import { databaseModelMutator, databaseModelsMutator } from "./embed-mutator";

// Used internally by EmbedModelValidator — not typically called directly.
// Shown here for reference:
const singleMutated = await databaseModelMutator(42, {
  options: { model: User },
  attributesList: {},
} as any);

const manyMutated = await databaseModelsMutator([1, 2, 3], {
  options: { model: "User" },
  attributesList: {},
} as any);
```

## DO NOT
- Do NOT pass a model name string without first registering that model via `registerModel` — `getModelFromRegistry` will throw if the name is unknown.
- Do NOT assume `databaseModelMutator` handles arrays — use `databaseModelsMutator` for array fields.
- Do NOT call these mutators without a `model` option in context — both will throw `Error` if `ModelClass` resolves to falsy.
- Do NOT rely on `databaseModelsMutator` preserving input order when values are mixed IDs and objects — results come from a `whereIn` database query.
