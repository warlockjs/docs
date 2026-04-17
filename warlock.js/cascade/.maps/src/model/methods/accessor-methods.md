# accessor-methods
source: model/methods/accessor-methods.ts
description: Field accessor methods with nested path support
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `get, merge, only, set, unset` from `@mongez/reinforcements`
- `Model` from `../model`

## Exports
- `getFieldValue` — Get field with optional default [lines 10-12]
- `setFieldValue` — Set field and mark as dirty [lines 14-23]
- `hasField` — Check if field exists (not just undefined) [lines 25-27]
- `incrementField` — Increment numeric field [lines 29-33]
- `decrementField` — Decrement numeric field [lines 35-39]
- `unsetFields` — Remove multiple fields [lines 41-46]
- `mergeFields` — Merge values and mark as dirty [lines 48-52]
- `getOnlyFields` — Get only specified fields [lines 54-56]
- `getStringField` — Type-safe string field getter [lines 58-60]
- `getNumberField` — Type-safe number field getter [lines 62-64]
- `getBooleanField` — Type-safe boolean field getter [lines 66-68]

## Classes / Functions / Types / Constants

### `getFieldValue(model: Model, field: string, defaultValue?: unknown): any` [lines 10-12]
- Gets field value with optional default using path notation

### `setFieldValue(model: Model, field: string, value: unknown): Model` [lines 14-23]
- Sets field value and tracks as dirty change; returns model for chaining

### `hasField(model: Model, field: string): boolean` [lines 25-27]
- Checks if field exists using MISSING_VALUE sentinel to distinguish undefined

### `incrementField(model: Model, field: string, amount?: number): Model` [lines 29-33]
- Increments numeric field by amount (default 1); returns model for chaining

### `decrementField(model: Model, field: string, amount?: number): Model` [lines 35-39]
- Decrements numeric field by amount (default 1); returns model for chaining

### `unsetFields(model: Model, ...fields: string[]): Model` [lines 41-46]
- Removes multiple fields from model; returns model for chaining

### `mergeFields(model: Model, values: Record<string, unknown>): Model` [lines 48-52]
- Merges values into model and marks all as dirty; returns model for chaining

### `getOnlyFields(model: Model, fields: string[]): Record<string, unknown>` [lines 54-56]
- Returns object with only specified fields

### `getStringField(model: Model, key: string, defaultValue?: string): string | undefined` [lines 58-60]
- Type-safe getter for string fields

### `getNumberField(model: Model, key: string, defaultValue?: number): number | undefined` [lines 62-64]
- Type-safe getter for number fields

### `getBooleanField(model: Model, key: string, defaultValue?: boolean): boolean | undefined` [lines 66-68]
- Type-safe getter for boolean fields
