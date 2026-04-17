# model.types
source: model/model.types.ts
description: Type definitions for model scoping, schema, and class references
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `QueryBuilderContract` from `../contracts`
- `Model` from `./model`

## Exports
- `ScopeTiming` — Timing control for global scopes [lines 7-7]
- `GlobalScopeDefinition` — Global scope with callback and timing [lines 12-15]
- `LocalScopeCallback` — Local scope callback type [lines 20-20]
- `GlobalScopeOptions` — Options for adding global scopes [lines 25-27]
- `ModelSchema` — Generic schema representation [lines 32-32]
- `ChildModel` — Static side of model subclass [lines 49-113]

## Types

### `ScopeTiming` [lines 7-7]
- Union type: "before" | "after"
- Controls when global scope is applied relative to other scopes

### `GlobalScopeDefinition` [lines 12-15]
- `callback: (query: QueryBuilderContract) => void` — Scope callback
- `timing: ScopeTiming` — Whether scope applies before or after

### `LocalScopeCallback` [lines 20-20]
- `(query: QueryBuilderContract, ...args: any[]) => void` — Local scope callback signature

### `GlobalScopeOptions` [lines 25-27]
- `timing?: ScopeTiming` — Optional timing specification

### `ModelSchema` [lines 32-32]
- `Record<string, any>` — Flexible schema object structure

### `ChildModel<TModel extends Model>` [lines 49-113]
- Constructor type for model subclasses with static properties and methods
- Picks static members from Model class for proper type inference
- Enables typed static factory methods (find, create, query, etc)
- Includes relation, event, and scope management
