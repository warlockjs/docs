# log-channel
source: src/log-channel.ts
description: Abstract base class for logging channels with configuration management and message filtering.
complexity: medium
first-mapped: 2026-04-17 06:06:13 AM
last-mapped: 2026-04-17 06:06:13 AM

## Imports
- `BasicLogConfigurations`, `LogContract`, `LoggingData` from "./types" [1]

## Exports
- `abstract class LogChannel<Options>` [3]

## Classes

### LogChannel [3-129]
Abstract base class implementing LogContract for logging channels.

**Generic**: `Options extends BasicLogConfigurations = BasicLogConfigurations`

**Properties**:
- `public name!: string` [10] — Channel identifier
- `public description?: string` [15] — Optional channel description
- `public terminal = false` [20] — Whether logging to terminal
- `protected defaultConfigurations: Options` [25]
- `protected channelConfigurations: Options` [30]
- `protected isInitialized = false` [35] — Initialization status flag

**Methods**:
- `public constructor(configurations?: Options)` [40] — Initialize channel with optional config; side-effects: async init scheduled via setTimeout
- `protected init?(): void | Promise<void>` [57] — Optional async initialization hook
- `protected config<K>(key: K): Options[K]` [62] — Retrieve config value with fallback
- `protected setConfigurations(configurations: Options): this` [71] — Merge configurations; side-effects: mutates channelConfigurations
- `protected shouldBeLogged(data: LoggingData): boolean` [83] — Determine if message matches log level and filter
- `public abstract log(data: LoggingData): void | Promise<void>` [102] — Abstract method to log message; throws: implementation-dependent
- `public flushSync?(): void` [107] — Optional synchronous flush operation
- `protected getDateAndTimeFormat()` [112] — Extract date and time format config with defaults
- `protected withBasicConfigurations(configurations: Partial<Options>): Options` [123] — Merge basic config factory function
