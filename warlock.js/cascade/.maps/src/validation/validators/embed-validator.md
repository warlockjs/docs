# embed-validator
source: validation/validators/embed-validator.ts
description: BaseValidator subclass wiring embed mutators, rules, and transformer together.
complexity: medium
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `arrayRule`, `BaseValidator` from `@warlock.js/seal`
- `Model`, `ChildModel` from `../../model/model`
- `databaseModelMutator`, `databaseModelsMutator` from `../mutators/embed-mutator`
- `databaseModelRule`, `databaseModelsRule` from `../rules/database-model-rule`
- `databaseModelTransformer` from `../transformers/embed-model-transformer`

## Exports
- `EmbedModelValidator` — validator for single/many embedded model fields  [lines 7-57]

## Classes / Functions / Types / Constants

### class `EmbedModelValidator` extends `BaseValidator`  [lines 7-57]
Configures seal pipeline for embedded database model validation.

- `matchesType(value: any): boolean` — true if value is Model, number, or Model array  [lines 11-17]
- `model(model: ChildModel<any> | string, errorMessage?: string): EmbedModelValidator` — adds single-model mutator and rule  [lines 22-30]
  - side-effects: registers `databaseModelMutator` and `databaseModelRule` on instance
- `models(model: ChildModel<any> | string, errorMessage?: string): EmbedModelValidator` — adds array mutator and rules  [lines 35-47]
  - side-effects: registers `databaseModelsMutator`, `arrayRule`, `databaseModelsRule` on instance
- `embed(embed?: string | string[]): EmbedModelValidator` — adds transformer for embed data extraction  [lines 52-56]
  - side-effects: registers `databaseModelTransformer` on instance
