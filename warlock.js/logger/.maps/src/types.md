# types
source: src/types.ts
description: Core logging type definitions and interfaces for the logger module.
complexity: simple
first-mapped: 2026-04-17 06:06:13 AM
last-mapped: 2026-04-17 06:06:13 AM

## Imports
- `LogChannel` from `./log-channel`
- `Logger` from `./logger`

## Exports
- `LogLevel` — Union of debug, info, warn, error, success levels [line 4]
- `DebugMode` — Union of daily, monthly, yearly, hourly rotation modes [line 6]
- `BasicLogConfigurations` — Configuration options for logging setup [line 8]
- `LogMessage` — Structured log message with metadata and context [line 32]
- `LogContract` — Interface for implementing custom log channels [line 43]
- `LoggingData` — Type for logging operation input data [line 70]
- `OmittedLoggingData` — LoggingData without type field [line 78]
- `Log` — Main logging interface with method overloads [line 80]

## Types & Interfaces

### LogLevel [line 4]
Union type: `"debug" | "info" | "warn" | "error" | "success"`

### DebugMode [line 6]
Union type: `"daily" | "monthly" | "yearly" | "hourly"`

### BasicLogConfigurations [line 8-30]
Optional configuration object for logger initialization.
- `levels?: LogLevel[]` — Filter logs by level [line 14]
- `dateFormat?: { date?: string; time?: string; }` — Custom date/time format [line 18-21]
- `filter?: (data: LoggingData) => boolean` — Conditional logging predicate [line 25]
- `context?: (data: LoggingData) => Promise<Record<string, any>>` — Async context enrichment [line 29]

### LogMessage [line 32-41]
Fully formatted log entry ready for output.
- `content: string` — Log message text [line 33]
- `level: LogLevel` — Severity level [line 34]
- `date: string` — Date portion [line 35]
- `module: string` — Source module identifier [line 36]
- `action: string` — Action/operation name [line 37]
- `stack?: string` — Stack trace if error [line 38]
- `context?: Record<string, any>` — Additional context data [line 39]
- `timestamp?: string` — ISO timestamp [line 40]

### LogContract [line 43-68]
Interface for custom channel implementations.
- `name: string` — Channel identifier [line 47]
- `description?: string` — Optional channel description [line 52]
- `terminal?: boolean` — Flag for terminal output [line 57]
- `log(data: LoggingData): void | Promise<void>` — Log data entry point [line 62]
- `flushSync?(): void` — Synchronous flush operation [line 67]

### LoggingData [line 70-76]
Input data structure for logging operations.
- `type: "info" | "debug" | "warn" | "error" | "success"` — Log level type [line 71]
- `module: string` — Source module [line 72]
- `action: string` — Action description [line 73]
- `message: any` — Log message content [line 74]
- `context?: Record<string, any>` — Contextual metadata [line 75]

### OmittedLoggingData [line 78]
Type alias for LoggingData without type field.

### Log [line 80-115]
Primary logging interface with overloaded methods.
- `(data: LoggingData): Promise<Logger>` — Main callable signature [line 81]
- `info(data: OmittedLoggingData): Promise<Logger>` — Info log variant [line 85]
- `info(module: string, action: string, message: any): Promise<Logger>` — Info shorthand [line 86]
- `debug(data: OmittedLoggingData): Promise<Logger>` — Debug log variant [line 90]
- `debug(module: string, action: string, message: any): Promise<Logger>` — Debug shorthand [line 91]
- `warn(data: OmittedLoggingData): Promise<Logger>` — Warn log variant [line 95]
- `warn(module: string, action: string, message: any): Promise<Logger>` — Warn shorthand [line 96]
- `error(data: OmittedLoggingData): Promise<Logger>` — Error log variant [line 100]
- `error(module: string, action: string, message: any): Promise<Logger>` — Error shorthand [line 101]
- `success(data: OmittedLoggingData): Promise<Logger>` — Success log variant [line 105]
- `success(module: string, action: string, message: any): Promise<Logger>` — Success shorthand [line 106]
- `channel(name: string): LogChannel | undefined` — Retrieve channel by name [line 110]
- `flushSync(): void` — Synchronous flush all logs [line 114]
