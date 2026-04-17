# model-sync
source: sync/model-sync.ts
description: ModelSync facade providing a clean API for registering and managing model sync operations with HMR-safe scoped cleanup
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- `ChildModel`, `Model` from `../model/model`
- `ModelSyncOperation` from `./model-sync-operation`
- `ModelSyncContract`, `ModelSyncOperationContract` from `./types`

## Exports
- `modelSync` — Global singleton instance of `ModelSyncFacade` for registering sync operations  [lines 204-204]

## Classes / Functions / Types / Constants

### `ModelSyncFacade` (internal class, not directly exported) [lines 30-188]
- Implements `ModelSyncContract`. Maintains a global `operations: ModelSyncOperation[]` array and a `registrationStack: ModelSyncOperation[][]` for scoped cleanup. The class itself is not exported; only the singleton `modelSync` is.

#### `sync(source: ChildModel<Model>, target: ChildModel<Model>, field: string): ModelSyncOperationContract` [lines 68-76]
- Creates a `ModelSyncOperation` with `isMany = false`, calls `trackOperation()` to add it to the global list and any active registration scope, and returns the operation for fluent chaining.

#### `syncMany(source: ChildModel<Model>, target: ChildModel<Model>, field: string): ModelSyncOperationContract` [lines 95-103]
- Creates a `ModelSyncOperation` with `isMany = true`, calls `trackOperation()`, and returns the operation for fluent chaining.

#### `register(callback: () => void): () => void` [lines 125-150]
- Pushes a new empty scoped array onto `registrationStack`, executes `callback()` (during which all `sync`/`syncMany` calls are also tracked in that scope via `trackOperation()`), pops the scope from the stack, and returns a closure that calls `operation.unsubscribe()` for each scoped operation and removes them from the global `operations` array.

#### `clear(): void` [lines 156-161]
- Calls `unsubscribe()` on all active operations and empties `operations` array; useful for testing or complete reset.

#### `get count(): number` [lines 167-169]
- Getter returning the number of currently active (registered) sync operations in the global `operations` array.

### `modelSync` [lines 204-204]
- Exported singleton instance of `ModelSyncFacade`. Primary entry point for all sync registrations across the application. Import from `@warlock.js/cascade`.
