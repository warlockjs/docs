# embed-validator
source: validation/validators/embed-validator.ts
description: Validator class for model embedding with rules, mutators, and transformers
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `arrayRule, BaseValidator` from `@warlock.js/seal`
- `Model, ChildModel` from `../../model/model`
- `databaseModelMutator, databaseModelsMutator` from `../mutators/embed-mutator`
- `databaseModelRule, databaseModelsRule` from `../rules/database-model-rule`
- `databaseModelTransformer` from `../transformers/embed-model-transformer`

## Exports
- `EmbedModelValidator` — Class that validates and transforms embedded models [lines 7-57]

## Classes

### `EmbedModelValidator extends BaseValidator` [lines 7-57]

#### `matchesType(value: any): boolean` [lines 11-16]
- Returns true if value is a Model instance or array of Model instances
- Used for type validation

#### `model(model: ChildModel<any> | string, errorMessage?: string): EmbedModelValidator` [lines 22-30]
- Adds mutator to convert value to model instance
- Adds validation rule with optional error message
- Supports both model class and registry string references
- Returns self for chaining

#### `models(model: ChildModel<any> | string, errorMessage?: string): EmbedModelValidator` [lines 35-47]
- Validates array of model instances
- Adds array rule and models rule
- Supports both model class and registry references
- Returns self for chaining

#### `embed(embed?: string | string[]): EmbedModelValidator` [lines 52-56]
- Configures field extraction for embedded document
- Accepts string field name or array of field names
- Returns self for chaining
