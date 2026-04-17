# embed-validator-plugin
source: validation/plugins/embed-validator-plugin.ts
description: Seal plugin that adds model embedding validation methods
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `SealPlugin` from `@warlock.js/seal`
- `v` from `@warlock.js/seal`
- `ChildModel` from `../../model/model`
- `EmbedModelValidator` from `../validators/embed-validator`

## Exports
- `embedValidator` — Seal plugin that adds embed() and embedMany() methods [lines 27-39]

## Types

### `EmbedOptions` [lines 12-15]
- `errorMessage?: string` — Custom error message
- `embed?: string | string[]` — Field(s) to embed in the document

## Plugins

### `embedValidator` [lines 27-39]
- Installs `v.embed()` method for single model validation
- Installs `v.embedMany()` method for array of models validation
- Integrates with Seal validation factory
