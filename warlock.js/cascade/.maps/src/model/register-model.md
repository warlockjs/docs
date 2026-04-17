# register-model
source: model/register-model.ts
description: Model registry and decorator for string-based model references without circular dependencies.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `ChildModel` from `./model`
- `Model` from `./model`

## Exports
- `RegisterModelOptions` — Options for the RegisterModel decorator [line 6]
- `RegisterModel` — Class decorator that registers models in global registry [line 52]
- `registerModelInRegistry` — Manually register a model by name [line 76]
- `getModelFromRegistry` — Get a model class by name from registry [line 94]
- `getAllModelsFromRegistry` — Get all registered models as Map [line 111]
- `cleanupModelsRegistery` — Clear all models from registry [line 118]
- `removeModelFromRegistery` — Delete a model from registry by name [line 122]
- `resolveModelClass` — Convert string or class to ChildModel [line 126]

## Types & Interfaces
### RegisterModelOptions [lines 6-18] — Options for RegisterModel decorator
- `name?: string` — Custom registry name, defaults to class name

## Functions
### RegisterModel [line 52] — Class decorator for model registration
- Parameter: `options?: RegisterModelOptions`
- Returns: Decorator function targeting `ChildModel<Model>`
- Behavior: Registers model by name, warns on overwrite

### registerModelInRegistry [line 76] — Manual model registration
- Parameters: `name: string`, `model: ChildModel<Model>`
- Registers model directly without decorator

### getModelFromRegistry [line 94] — Retrieve model by name
- Parameter: `name: string`
- Returns: `ChildModel<Model> | undefined`

### getAllModelsFromRegistry [line 111] — Export all models
- Returns: `Map<string, ChildModel<Model>>`
- Creates new Map copy of registry

### cleanupModelsRegistery [line 118] — Clear registry
- Clears entire modelsRegistry Map

### removeModelFromRegistery [line 122] — Remove single model
- Parameter: `name: string`
- Deletes model from registry

### resolveModelClass [line 126] — Convert string or class reference
- Parameter: `model: ChildModel<Model> | string`
- Returns: `ChildModel<Model>`
- String resolves via registry, class returned as-is
