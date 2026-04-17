# validation/transformers
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> Seal transformer that extracts embed data from validated Model instances before they are persisted to the database.

## What lives here
- `embed-model-transformer.ts` — exports `databaseModelTransformer` as a `TransformerCallback`

## Public API
- `databaseModelTransformer: TransformerCallback` — extracts embed field(s) from a single Model or array of Models

## How it fits together
Transformers run at the end of the seal pipeline, after mutators and rules have passed. `EmbedModelValidator.embed()` registers `databaseModelTransformer` via `addTransformer`. The transformer reads `context.options.embed` (defaulting to `"embedData"`) and uses it to extract storage-ready data from each Model: a string embed key accesses the property directly (`value[embed]`), while an array of keys calls `value.only(embed)` to pick a subset. Non-Model, non-array values are returned unchanged so the transformer is safe to apply even when the field is optional.

## Working examples
```typescript
import { databaseModelTransformer } from "./embed-model-transformer";

// Used internally by EmbedModelValidator — shown for reference:
// validator.addTransformer(databaseModelTransformer, { embed: "embedData" });
// validator.addTransformer(databaseModelTransformer, { embed: ["id", "name"] });

// Result when value is a User model instance with embedData property:
// => user.embedData

// Result when value is an array of Post models with embed: ["id", "title"]:
// => posts.map(p => p.only(["id", "title"]))
```

## DO NOT
- Do NOT pass `embed: []` (empty array) — `value.only([])` will return an empty object, silently dropping all embed data.
- Do NOT register this transformer before the rule phase — it expects the value to already be a resolved Model instance.
- Do NOT assume the default embed key `"embedData"` exists on all models — ensure the model defines the property or pass an explicit `embed` option.
- Do NOT use this transformer outside the seal pipeline context — it relies on `context.options.embed` being set by the pipeline.
