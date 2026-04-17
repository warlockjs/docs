# capture-unhandled-errors
source: src/utils/capture-unhandled-errors.ts
description: Registers handlers for unhandled promise rejections and exceptions.
complexity: simple
first-mapped: 2026-04-17 06:06:13 AM
last-mapped: 2026-04-17 06:06:13 AM

## Imports
- `log` from `../logger` [line 1]

## Exports
- `captureAnyUnhandledRejection()` (function)

## Functions

### captureAnyUnhandledRejection [lines 3-15]
Registers process listeners for unhandled rejections and exceptions.
side-effects: Attaches event listeners to process object; logs errors via log.error()
