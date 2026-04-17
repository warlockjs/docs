# meta-methods
source: model/methods/meta-methods.ts
description: Model metadata configuration and atomic operations
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `DatabaseWriter` from `../../writer/database-writer`
- `Model` from `../model`

## Exports
- `applyDefaultsToModel` — Apply configuration defaults to model class [lines 4-61]
- `generateModelNextId` — Generate next ID using DatabaseWriter [lines 63-67]
- `performAtomicUpdate` — Perform atomic update operations [lines 69-74]
- `performAtomicIncrement` — Atomically increment field [lines 76-87]
- `performAtomicDecrement` — Atomically decrement field [lines 89-100]

## Classes / Functions / Types / Constants

### `applyDefaultsToModel(ModelClass: any, defaults: any): void` [lines 4-61]
- Applies class defaults (ID generation, timestamps, deletion, validation) only if not already defined on class; handles function-based trashTable

### `generateModelNextId(model: Model): Promise<number | string>` [lines 63-67]
- Generates and assigns next ID using DatabaseWriter

### `performAtomicUpdate(model: Model, operations: Record<string, unknown>): Promise<number>` [lines 69-74]
- Performs atomic database update with model's id as filter

### `performAtomicIncrement<T extends string>(model: Model, field: T, amount = 1): Promise<number>` [lines 76-87]
- Atomically increments field in database and updates local model

### `performAtomicDecrement<T extends string>(model: Model, field: T, amount = 1): Promise<number>` [lines 89-100]
- Atomically decrements field in database and updates local model
