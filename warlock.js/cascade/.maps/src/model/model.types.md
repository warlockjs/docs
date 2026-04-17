# model.types
source: model/model.types.ts
description: Type definitions for model scoping, schema, and static method signatures.
complexity: medium
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `QueryBuilderContract` from `../contracts`
- `Model` from `./model`

## Exports
- `ScopeTiming` — Timing control for global scopes [line 7]
- `GlobalScopeDefinition` — Global scope definition with callback and timing [line 12]
- `LocalScopeCallback` — Local scope callback function [line 20]
- `GlobalScopeOptions` — Options for adding global scopes [line 25]
- `ModelSchema` — Generic schema type representing model data [line 32]
- `ChildModel` — Static side of model subclass for this-typed methods [line 49]

## Types & Interfaces
### ScopeTiming [line 7] — Timing control for global scopes
- Union type: `"before" | "after"`

### GlobalScopeDefinition [lines 12-15] — Global scope with callback and timing
- `callback: (query: QueryBuilderContract) => void` — Query modification function
- `timing: ScopeTiming` — When to apply scope relative to execution

### LocalScopeCallback [line 20] — Local scope callback function
- Signature: `(query: QueryBuilderContract, ...args: any[]) => void`

### GlobalScopeOptions [lines 25-27] — Options for adding global scopes
- `timing?: ScopeTiming` — Optional timing control, defaults to "before"

### ModelSchema [line 32] — Generic schema type representing model data
- Type alias: `Record<string, any>`

### ChildModel [lines 49-113] — Static side of model subclass
- Constructor: `(new (...args: any[]) => TModel)`
- Static methods: query, find, first, last, all, latest, count, where
- Event methods: on, once, off, events, globalEvents
- Data mutation: create, createMany, update, delete, deleteOne
- Lifecycle: createdAtColumn, updatedAtColumn, deletedAtColumn
- Configuration: table, primaryKey, dataSource, schema, strictMode
- 40+ static properties and methods for type-safe subclass handling
