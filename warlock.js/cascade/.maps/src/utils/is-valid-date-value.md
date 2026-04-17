# is-valid-date-value
source: utils/is-valid-date-value.ts
description: Exports a pure guard function that validates numeric timestamps and strict ISO 8601 date strings, rejecting JS auto-corrected dates.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports

## Exports
- `isValidDateValue` — returns true for valid date numbers or ISO strings  [lines 6-28]

## Classes / Functions / Types / Constants

### `isoRegex`
constant  [line 1]
Regex matching ISO 8601 date and optional time strings.

### `isValidDateValue`
function  [lines 6-28]
Validates numeric timestamps and strict ISO strings; rejects JS-corrected dates.
