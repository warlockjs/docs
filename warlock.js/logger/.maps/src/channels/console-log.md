# console-log
source: src/channels/console-log.ts
description: Console output logging channel with color-coded formatted terminal logs.
complexity: simple
first-mapped: 2026-04-17 06:06:13 AM
last-mapped: 2026-04-17 06:06:13 AM

## Imports
- `colors` from @mongez/copper [line 1]
- `LogChannel` from ../log-channel [line 2]
- `BasicLogConfigurations`, `LoggingData` (types) from ../types [line 3]

## Exports
- `ConsoleLog` class (default export pattern)

## Classes

### ConsoleLog [lines 5-93]
Extends LogChannel<BasicLogConfigurations>. Outputs formatted colored logs to terminal console.

#### Fields
- `name` public [line 9]: string "console"
- `terminal` public readonly [line 14]: boolean true

#### Methods
- `log(data: LoggingData)` public [lines 19-92]
  Formats and outputs log entry with timestamp, module, action, level-specific icon and colors.
  side-effects: Writes to console.log with formatted colored output
