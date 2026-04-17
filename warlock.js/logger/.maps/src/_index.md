# Logger Source Map Index
generated: 2026-04-17 06:06:13 AM

## Types

- `LogLevel` — `src/types.ts` — union of five severity levels: debug, info, warn, error, success
- `DebugMode` — `src/types.ts` — union of file rotation modes: daily, monthly, yearly, hourly
- `BasicLogConfigurations` — `src/types.ts` — shared config shape: levels, dateFormat, filter, context
- `LogMessage` — `src/types.ts` — fully formatted log entry with metadata ready for output
- `LoggingData` — `src/types.ts` — input shape for a logging call (type, module, action, message, context)
- `OmittedLoggingData` — `src/types.ts` — LoggingData without the `type` field
- `FileLogConfig` — `src/channels/file-log.ts` — config extending BasicLogConfigurations for file channels

## Interfaces / Contracts

- `LogContract` — `src/types.ts` — interface every log channel must implement (name, log, flushSync)
- `Log` — `src/types.ts` — callable logging interface with overloaded level methods (info, debug, warn, error, success)

## Classes

- `LogChannel<Options>` — `src/log-channel.ts` — abstract base with config merging, level filtering, date formatting
- `ConsoleLog` — `src/channels/console-log.ts` — colorized terminal output, one line per entry
- `FileLog` — `src/channels/file-log.ts` — buffered plain-text file logging with rotation and groupBy
- `JSONFileLog` — `src/channels/json-file-log.ts` — structured JSON file logging, extends FileLog

## Functions

- `captureAnyUnhandledRejection()` — `src/utils/capture-unhandled-errors.ts` — hooks process unhandledRejection and uncaughtException
- `clearMessage(message)` — `src/utils/clear-message.ts` — strips ANSI escape codes from strings

## Constants

- `logger` — `src/logger.ts` — default Logger singleton instance
- `log` — `src/logger.ts` — functional `Log` interface bound to the default logger
