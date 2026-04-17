# validation/rules
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> Seal schema rules that assert a validated value is a proper Model instance or an array of Model instances.

## What lives here
- `database-model-rule.ts` — exports `databaseModelRule` (single) and `databaseModelsRule` (array) seal `SchemaRule` objects

## Public API
- `databaseModelRule: SchemaRule` — async rule; name `"databaseModule"`; rejects if value is not a `Model` instance
- `databaseModelsRule: SchemaRule<{ model: ChildModel<any> | string }>` — async rule; name `"databaseModels"`; rejects if value is not an array of `Model` instances

## How it fits together
Rules run after mutators in the seal pipeline. By the time these rules execute, `databaseModelMutator` or `databaseModelsMutator` should have already resolved raw IDs into Model instances. If the mutator could not resolve a valid model (e.g. record not found), the value will not be a `Model` instance and these rules will return `invalidRule`. Both rules write to `context.attributesList.model` so seal can interpolate the model name into the `:model` placeholder in the default error message.

## Working examples
```typescript
import { databaseModelRule, databaseModelsRule } from "./database-model-rule";

// Used internally by EmbedModelValidator — shown for reference:
// Single model rule is added via:
//   validator.addRule(databaseModelRule, errorMessage, { model: User });

// Array rule is added via:
//   validator.addMutableRule(databaseModelsRule, errorMessage, { model: "Post" });
```

## DO NOT
- Do NOT use `databaseModelRule` for array fields — it only checks `value instanceof Model` for a single value.
- Do NOT use `databaseModelsRule` without first passing a `model` option — the rule reads `context.options.model` and will throw if it is absent.
- Do NOT rely on the rule name `"databaseModule"` (note the typo vs `"databaseModel"`) being corrected — it matches the source exactly.
- Do NOT invoke these rules before the mutator phase has run — they validate Model instances, not raw IDs or plain objects.
