# validation/validators
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> Seal `BaseValidator` subclass that wires mutators, rules, and transformer into a complete embedded-model validation pipeline.

## What lives here
- `embed-validator.ts` — exports `EmbedModelValidator`, the central validator for single and multiple embedded model fields

## Public API
- `EmbedModelValidator` — `BaseValidator` subclass for embedded model field validation
- `EmbedModelValidator#matchesType(value: any): boolean` — true if value is Model, number, or Model array
- `EmbedModelValidator#model(model: ChildModel<any> | string, errorMessage?: string): EmbedModelValidator` — configures single-model mutator and rule
- `EmbedModelValidator#models(model: ChildModel<any> | string, errorMessage?: string): EmbedModelValidator` — configures array mutator, `arrayRule`, and array rule
- `EmbedModelValidator#embed(embed?: string | string[]): EmbedModelValidator` — adds transformer for embed data extraction

## How it fits together
`EmbedModelValidator` is the integration point for the entire `validation/` subsystem. It is instantiated by `v.embed` and `v.embedMany` (registered by `embed-validator-plugin`) and exposes a fluent API that composes mutators from `embed-mutator.ts`, rules from `database-model-rule.ts`, and the transformer from `embed-model-transformer.ts` onto seal's internal pipeline. Calling `.model()` sets up a single-model path; `.models()` adds `arrayRule` in addition to `databaseModelsRule` so seal also validates that the value is an array before checking each element. `.embed()` must be called last to attach the transformer that converts Model instances to storage-ready embed data.

## Working examples
```typescript
import { v } from "@warlock.js/seal";
import "../database-seal-plugins"; // ensure plugin is registered

// Single embedded model
const userField = v.embed(User).embed("embedData");

// Multiple embedded models with field subset
const postField = v.embedMany("Post", { embed: ["id", "title"] });

// Using EmbedModelValidator directly
import { EmbedModelValidator } from "./embed-validator";

const validator = new EmbedModelValidator()
  .model(User, "Must be a valid user")
  .embed(["id", "name"]);
```

## DO NOT
- Do NOT call `.models()` and `.model()` on the same instance — they configure mutually exclusive pipeline paths for single vs. array values.
- Do NOT omit `.embed()` if you need storage-ready data — without calling it, the transformer is not added and the full Model instance will be persisted.
- Do NOT pass a model name string to `.model()` or `.models()` without registering the model via `registerModel` first — `getModelFromRegistry` will throw.
- Do NOT instantiate `EmbedModelValidator` without registering the `embedValidator` plugin if using `v.embed` — the plugin must be registered before `v.embed` is defined.
