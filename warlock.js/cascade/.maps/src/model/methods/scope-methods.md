# scope-methods
source: model/methods/scope-methods.ts
description: Helpers to add and remove global and local query scopes on a model class.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `QueryBuilderContract` from `../../contracts`
- `GlobalScopeOptions`, `LocalScopeCallback`, `ChildModel`, `Model` from `../model`

## Exports
- `addGlobalModelScope` — registers named global scope on model class  [lines 4-14]
- `removeGlobalModelScope` — deletes named global scope from model class  [lines 16-18]
- `addLocalModelScope` — registers named local scope on model class  [lines 20-26]
- `removeLocalModelScope` — deletes named local scope from model class  [lines 28-30]

## Classes / Functions / Types / Constants
### `addGlobalModelScope`
[lines 4-14]
- side-effects: mutates `ModelClass.globalScopes` map

### `removeGlobalModelScope`
[lines 16-18]
- side-effects: mutates `ModelClass.globalScopes` map

### `addLocalModelScope`
[lines 20-26]
- side-effects: mutates `ModelClass.localScopes` map

### `removeLocalModelScope`
[lines 28-30]
- side-effects: mutates `ModelClass.localScopes` map
