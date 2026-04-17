# register-model
source: model/register-model.ts
description: Model registry system for string-based model references
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `ChildModel, Model` from `./model`

## Exports
- `RegisterModelOptions` — Options for model registration [lines 6-18]
- `RegisterModel` — Class decorator function [lines 52-74]
- `registerModelInRegistry` — Function to register model by name [lines 76-78]
- `getModelFromRegistry` — Function to retrieve registered model [lines 94-96]
- `getAllModelsFromRegistry` — Function to get all registered models [lines 111-113]
- `cleanupModelsRegistery` — Function to clear all registrations [lines 118-120]
- `removeModelFromRegistery` — Function to remove specific model [lines 122-124]
- `resolveModelClass` — Function to resolve model from class or string [lines 126-128]

## Types

### `RegisterModelOptions` [lines 6-18]
- `name?: string` — Custom registry name (defaults to class name)

## Functions

### `RegisterModel(options?: RegisterModelOptions)` [lines 52-74]
- Class decorator that registers model in global registry
- Uses custom name from options or class name
- Warns if model name already registered
- Returns decorator function for target class
- Throws error if model name cannot be determined

### `registerModelInRegistry(name: string, model: ChildModel<Model>)` [lines 76-78]
- Manually registers a model class by name
- Used for programmatic registration

### `getModelFromRegistry(name: string)` [lines 94-96]
- Retrieves model class by registry name
- Returns undefined if not found

### `getAllModelsFromRegistry()` [lines 111-113]
- Returns Map of all registered models
- Creates copy for safe iteration

### `cleanupModelsRegistery()` [lines 118-120]
- Clears all registered models
- Useful for testing and cleanup

### `removeModelFromRegistery(name: string)` [lines 122-124]
- Removes specific model from registry

### `resolveModelClass(model: ChildModel<Model> | string)` [lines 126-128]
- Converts string references to model classes
- Returns model class unchanged if already a class reference
