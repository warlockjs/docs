# is-valid-date-value

source: utils/is-valid-date-value.ts
description: Validates date values using strict ISO format checking and numeric timestamps
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
None

## Exports
- `isValidDateValue` — Function to validate date values [lines 6-28]

## Classes / Functions / Types / Constants

### `isoRegex` [line 1]
- Regular expression pattern for matching ISO date strings (YYYY-MM-DD with optional time component)

#### `isValidDateValue(value: unknown): boolean` [lines 6-28]
- Validates if the given value is a valid date; accepts finite numbers as timestamps or strict ISO 8601 strings; prevents JavaScript auto-correction (e.g., Feb 31 -> Mar 3) by verifying parsed date components match input
