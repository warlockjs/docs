# accessor-methods
source: model/methods/accessor-methods.ts
description: Field-level read/write/mutate helpers operating on a Model instance and its dirty tracker.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `get`, `merge`, `only`, `set`, `unset` from `@mongez/reinforcements`
- `Model` from `../model`

## Exports
- `getFieldValue` — get a field value with optional default  [lines 10-12]
- `setFieldValue` — set field, mark dirty tracker  [lines 14-23]
- `hasField` — check field existence via sentinel symbol  [lines 25-27]
- `incrementField` — increment numeric field by amount  [lines 29-33]
- `decrementField` — decrement numeric field by amount  [lines 35-39]
- `unsetFields` — remove fields, update dirty tracker  [lines 41-46]
- `mergeFields` — deep-merge values into model data  [lines 48-52]
- `getOnlyFields` — pick subset of fields from model  [lines 54-56]
- `getStringField` — typed string field accessor  [lines 58-60]
- `getNumberField` — typed number field accessor  [lines 62-64]
- `getBooleanField` — typed boolean field accessor  [lines 66-68]

## Classes / Functions / Types / Constants
### `MISSING_VALUE` [line 8]
- `const MISSING_VALUE: unique symbol` — sentinel distinguishing missing vs undefined field

### `getFieldValue(model, field, defaultValue?)` [lines 10-12]
- Returns field from `model.data` via `get`

### `setFieldValue(model, field, value)` [lines 14-23]
- side-effects: mutates `model.data`, calls `model.dirtyTracker.mergeChanges`

### `hasField(model, field)` [lines 25-27]
- Pure; uses `MISSING_VALUE` sentinel

### `incrementField(model, field, amount?)` [lines 29-33]
- side-effects: delegates to `setFieldValue`

### `decrementField(model, field, amount?)` [lines 35-39]
- side-effects: delegates to `setFieldValue`

### `unsetFields(model, ...fields)` [lines 41-46]
- side-effects: mutates `model.data`, calls `model.dirtyTracker.unset`

### `mergeFields(model, values)` [lines 48-52]
- side-effects: mutates `model.data`, calls `model.dirtyTracker.mergeChanges`

### `getOnlyFields(model, fields)` [lines 54-56]
- Pure; returns subset object

### `getStringField(model, key, defaultValue?)` [lines 58-60]
- Typed wrapper over `getFieldValue`

### `getNumberField(model, key, defaultValue?)` [lines 62-64]
- Typed wrapper over `getFieldValue`

### `getBooleanField(model, key, defaultValue?)` [lines 66-68]
- Typed wrapper over `getFieldValue`
