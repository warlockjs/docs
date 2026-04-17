# database-writer-validation-error
source: validation/database-writer-validation-error.ts
description: Custom Error subclass thrown when model validation fails during a database write operation
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- `colors` from `@mongez/copper`
- `ValidationResult` from `@warlock.js/seal`

## Exports
- `DatabaseWriterValidationError` — Error class carrying all seal validation errors with colored terminal formatting  [lines 27-180]

## Classes / Functions / Types / Constants

### `DatabaseWriterValidationError` [lines 27-180]
- Extends native `Error`.
- Captures V8 stack trace at construction via `Error.captureStackTrace` when available.
- Defines a non-enumerable `inspect` property pointing to `toString()` for Node.js compatibility.
- Overrides `[Symbol.for("nodejs.util.inspect.custom")]` so `console.log` and the Node.js inspector use the formatted output.

#### `constructor(message: string, errors: ValidationResult["errors"])` [lines 52-67]
- Sets `this.name = "DatabaseWriterValidationError"` and stores `errors` as `public readonly`.
- Calls `Error.captureStackTrace(this, DatabaseWriterValidationError)` in V8 environments.
- Defines a non-enumerable `inspect` property (value: `() => this.toString()`).

#### `[Symbol.for("nodejs.util.inspect.custom")](): string` [lines 73-75]
- Node.js custom inspect hook; delegates to `this.toString()` to produce colored output in `console.log` and debuggers.

#### `toString(): string` [lines 94-145]
- Builds a multi-line colored terminal string grouping errors by field (`err.input`).
- Extracts model name from `this.message` via regex (`/\[(\w+)\s+Model\]/`); defaults to `"Model"`.
- Detects operation (`"Insert"` or `"Update"`) from the message string.
- For each field: prints field name (yellow), error message (white), value if present (gray, JSON-stringified), rule type if present (cyan). Fields are separated by blank lines.
- Returns all lines joined with `"\n"`.

#### `getFieldErrors(fieldPath: string): ValidationResult["errors"]` [lines 160-162]
- Filters `this.errors` to those where `err.input === fieldPath` and returns the subset array.

#### `hasFieldError(fieldPath: string): boolean` [lines 177-179]
- Returns `true` if at least one entry in `this.errors` has `err.input === fieldPath`.

## Properties

### `errors` [line 37]
- `public readonly errors: ValidationResult["errors"]`
- Array of seal validation error objects. Each contains at minimum `input` (field path/name), `error` (human-readable message), and `type` (rule that failed). May also carry `value`.
