# clear-message
source: src/utils/clear-message.ts
description: Removes ANSI terminal escape codes from message strings.
complexity: simple
first-mapped: 2026-04-17 06:06:13 AM
last-mapped: 2026-04-17 06:06:13 AM

## Imports
None

## Exports
- `clearMessage` — function (exported)

## Functions

### clearMessage [line 4]
Strips terminal escape codes from string input.
- **params:**
  - `message` (any) — raw message, any type
- **returns:** cleaned string or original non-string value
