# database-model-rule
source: validation/rules/database-model-rule.ts
description: Seal schema rules validating single and multiple Model instances.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `invalidRule`, `VALID_RULE`, `SchemaRule` from `@warlock.js/seal`
- `ChildModel`, `Model` from `../../model/model`
- `getModelFromRegistry` from `../../model/register-model`

## Exports
- `databaseModelRule` — validates value is a Model instance  [lines 5-16]
- `databaseModelsRule` — validates value is array of Model instances  [lines 18-35]

## Classes / Functions / Types / Constants

### Constants
- `databaseModelRule: SchemaRule` — async; name `"databaseModule"`, returns invalid if not `Model`  [lines 5-16]
  - side-effects: sets `context.attributesList.model` from options
- `databaseModelsRule: SchemaRule<{ model: ChildModel<any> | string }>` — async; name `"databaseModels"`, validates array of models  [lines 18-35]
  - side-effects: resolves string model name via registry; sets `context.attributesList.model`
