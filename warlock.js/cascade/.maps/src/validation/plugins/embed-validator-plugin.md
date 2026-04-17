# embed-validator-plugin
source: validation/plugins/embed-validator-plugin.ts
description: Seal plugin that injects `v.embed` and `v.embedMany` factory methods.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `SealPlugin` from `@warlock.js/seal`
- `v` from `@warlock.js/seal`
- `ChildModel` from `../../model/model`
- `EmbedModelValidator` from `../validators/embed-validator`

## Exports
- `embedValidator` — SealPlugin object registering embed validation  [lines 27-39]

## Classes / Functions / Types / Constants

### Types
- `EmbedOptions` — `{ errorMessage?: string; embed?: string | string[] }`  [lines 12-15]

### Module Augmentation
- `ValidatorV.embed(model, options?)` — returns `EmbedModelValidator`  [line 19]
- `ValidatorV.embedMany(model, options?)` — returns `EmbedModelValidator`  [line 20]

### Constants
- `embedValidator: SealPlugin` — name `"embed"`, version `"1.0.0"`  [lines 27-39]
  - `install()` — side-effects: assigns `v.embed` and `v.embedMany` on the seal `v` factory  [lines 32-38]
