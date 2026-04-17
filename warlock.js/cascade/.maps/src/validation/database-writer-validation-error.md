# database-writer-validation-error
source: validation/database-writer-validation-error.ts
description: Custom Error subclass carrying structured seal validation results for DB writes.
complexity: medium
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `colors` from `@mongez/copper`
- `ValidationResult` from `@warlock.js/seal`

## Exports
- `DatabaseWriterValidationError` — error class for DB write validation failures  [lines 27-180]

## Classes / Functions / Types / Constants

### class `DatabaseWriterValidationError` extends `Error`  [lines 27-180]
Structured error for model validation failures during database writes.

- `readonly errors: ValidationResult["errors"]` — array of per-field seal errors  [line 37]
- `constructor(message: string, errors: ValidationResult["errors"])` — sets name, errors, stack trace  [lines 52-67]
  - side-effects: captures V8 stack trace; defines non-enumerable `inspect` property
- `[Symbol.for("nodejs.util.inspect.custom")](): string` — Node.js custom inspect hook  [lines 73-75]
- `toString(): string` — colored terminal-formatted error summary  [lines 94-145]
- `getFieldErrors(fieldPath: string): ValidationResult["errors"]` — filters errors by field path  [lines 160-162]
- `hasFieldError(fieldPath: string): boolean` — checks if field has any errors  [lines 177-179]
