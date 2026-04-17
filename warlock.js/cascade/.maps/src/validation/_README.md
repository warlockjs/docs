# validation
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> Entry point for cascade's database-aware validation layer, wiring seal plugins and exposing a structured error class for model write failures.

## What lives here
- `index.ts` — re-exports `DatabaseWriterValidationError` and side-effect-imports `database-seal-plugins`
- `database-seal-plugins.ts` — registers `embedValidator` seal plugin on module load; exports `DatabaseSealPlugins` type
- `database-writer-validation-error.ts` — custom `Error` subclass carrying structured per-field seal validation results

## Public API
- `DatabaseSealPlugins` — type alias for the `embedValidator` plugin type
- `DatabaseWriterValidationError` — error class for DB write validation failures
- `new DatabaseWriterValidationError(message: string, errors: ValidationResult["errors"])` — constructs error with per-field detail
- `DatabaseWriterValidationError#errors: ValidationResult["errors"]` — array of per-field seal errors
- `DatabaseWriterValidationError#getFieldErrors(fieldPath: string): ValidationResult["errors"]` — filters errors by dot-notation path
- `DatabaseWriterValidationError#hasFieldError(fieldPath: string): boolean` — checks if field has any errors
- `DatabaseWriterValidationError#toString(): string` — colored terminal-formatted error summary

## How it fits together
Importing `index.ts` triggers `database-seal-plugins.ts` as a side effect, which calls `registerPlugin(embedValidator)` so the `v.embed` and `v.embedMany` methods are available on the seal `v` factory from that point forward. When the cascade database writer runs model validation via seal and fails, it throws a `DatabaseWriterValidationError` populated with the seal `ValidationResult["errors"]` array. Callers can catch this error and inspect individual field failures without parsing free-form strings.

## Working examples
```typescript
import { DatabaseWriterValidationError } from "./validation";

try {
  await user.save();
} catch (error) {
  if (error instanceof DatabaseWriterValidationError) {
    if (error.hasFieldError("email")) {
      const emailErrors = error.getFieldErrors("email");
      console.log(emailErrors);
    }
    console.log(error.toString());
  }
}
```

## DO NOT
- Do NOT import `database-seal-plugins` multiple times expecting idempotent registration — `registerPlugin` is called once as a side effect on first import.
- Do NOT construct `DatabaseWriterValidationError` with an empty `errors` array when there are real failures — field-level helpers rely on a populated array.
- Do NOT read `error.message` for machine parsing — use `getFieldErrors` or `hasFieldError` instead, as `message` is a human-readable string.
- Do NOT skip importing `index.ts` (or `database-seal-plugins`) before using `v.embed` — the plugin must be registered first or `v.embed` will be undefined.
