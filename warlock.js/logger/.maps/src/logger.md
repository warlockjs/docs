# logger

source: src/logger.ts
description: Main logger class providing multi-channel logging with debug, info, warn, error, success levels.
complexity: medium
first-mapped: 2026-04-17 06:06:13 AM
last-mapped: 2026-04-17 06:06:13 AM

## Imports
- `Random` from `@mongez/reinforcements`
- `LogChannel` type from `./log-channel`
- `Log`, `LoggingData`, `LogLevel`, `OmittedLoggingData` types from `./types`
- `clearMessage` from `./utils/clear-message`

## Exports
- `Logger` — Main logging class with channel management [line 6]
- `logger` — Default logger instance [line 169]
- `log` — Functional logging interface with bound methods [line 171]

## Classes

### Logger [lines 6-167]
Central logging orchestrator with multi-channel support.

**Properties:**
- `channels: LogChannel[]` — Active logging channels [line 10]
- `id: string` — Unique logger identifier [line 12]

**Public Methods:**
- `addChannel(channel: LogChannel): this` — Register new logging channel [lines 17-21]
- `configure(config: { channels: LogChannel[] }): this` — Set base configurations [lines 26-30]
- `setChannels(channels: LogChannel[]): this` — Replace all channels [lines 35-39]
- `debug(dataOrModule, action?, message?, context?): Promise<this>` — Log debug level [lines 87-95], throws: propagates channel errors
- `info(dataOrModule, action?, message?, context?): Promise<this>` — Log info level [lines 100-108], throws: propagates channel errors
- `warn(dataOrModule, action?, message?, context?): Promise<this>` — Log warn level [lines 113-121], throws: propagates channel errors
- `error(dataOrModule, action?, message?, context?): Promise<this>` — Log error level [lines 126-134], throws: propagates channel errors
- `success(dataOrModule, action?, message?, context?): Promise<this>` — Log success level [lines 139-148], throws: propagates channel errors
- `channel(name: string): LogChannel | undefined` — Find channel by name [lines 153-155]
- `log(data: LoggingData): Promise<this>` — Process logs through all channels [lines 73-82], side-effects: mutates message, channels I-O, throws: propagates channel errors
- `flushSync(): void` — Synchronously flush channel buffers [lines 160-166], side-effects: flushes buffered data

**Private Methods:**
- `normalizeLogData(dataOrModule, action?, message?, level?, context?): LoggingData` — Normalize input to LoggingData structure [lines 44-68]

## Constants
- `log: Log` — Functional logging interface with bound methods [lines 171-182], side-effects: binds logger methods
