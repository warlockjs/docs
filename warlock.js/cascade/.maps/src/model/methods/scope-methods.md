# scope-methods
source: model/methods/scope-methods.ts
description: Global and local model scope management
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `QueryBuilderContract` from `../../contracts`
- `GlobalScopeOptions, LocalScopeCallback, ChildModel, Model` from `../model`

## Exports
- `addGlobalModelScope` — Register global query scope [lines 4-14]
- `removeGlobalModelScope` — Remove global query scope [lines 16-18]
- `addLocalModelScope` — Register local query scope [lines 20-26]
- `removeLocalModelScope` — Remove local query scope [lines 28-30]

## Classes / Functions / Types / Constants

### `addGlobalModelScope(ModelClass: ChildModel<any>, name: string, callback: (query: QueryBuilderContract) => void, options: GlobalScopeOptions = {}): void` [lines 4-14]
- Registers a named global scope with optional timing control (before/after)

### `removeGlobalModelScope(ModelClass: ChildModel<any>, name: string): void` [lines 16-18]
- Removes a global scope by name

### `addLocalModelScope(ModelClass: ChildModel<any>, name: string, callback: LocalScopeCallback): void` [lines 20-26]
- Registers a named local scope with callback

### `removeLocalModelScope(ModelClass: ChildModel<any>, name: string): void` [lines 28-30]
- Removes a local scope by name
