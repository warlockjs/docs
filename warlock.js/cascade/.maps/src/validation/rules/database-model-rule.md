# database-model-rule
source: validation/rules/database-model-rule.ts
description: Validation rules for database model instances and collections
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `invalidRule, VALID_RULE, SchemaRule` from `@warlock.js/seal`
- `ChildModel, Model` from `../../model/model`
- `getModelFromRegistry` from `../../model/register-model`

## Exports
- `databaseModelRule` — Validation rule for single model instances [lines 5-16]
- `databaseModelsRule` — Validation rule for collections of model instances [lines 18-35]

## Rules

### `databaseModelRule` [lines 5-16]
- Validates that a value is an instance of the Model class
- Sets model name in context attributes list
- Returns error if value is not a valid Model instance

### `databaseModelsRule` [lines 18-35]
- Validates that a value is an array of Model instances
- Supports both model class references and string-based lookups via registry
- Sets model name in context attributes list
- Verifies all array items are Model instances
