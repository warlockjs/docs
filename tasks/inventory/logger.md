# @warlock.js/logger — Inventory

## Package Info

- Version: 4.0.165
- Type: Standalone Package
- Dependencies: None (@mongez/* dependencies only)

## Directory Tree

```
src/
├── channels/
│   ├── console-log.ts
│   ├── file-log.ts
│   ├── index.ts
│   └── json-file-log.ts
├── index.ts
├── log-channel.ts
├── logger.ts
├── types.ts
└── utils/
    ├── capture-unhandled-errors.ts
    ├── clear-message.ts
    └── index.ts
```

## Exports by File

### src/log-channel.ts
*Defines the abstract base class for all logging channels, handling configuration and filtering.*

- **Abstract Class** `LogChannel<Options extends BasicLogConfigurations = BasicLogConfigurations> implements LogContract`
  - `public name: string`
  - `public description?: string`
  - `public terminal: boolean`
  - `public constructor(configurations?: Options)`
  - `protected init?(): void | Promise<void>`
  - `protected config<K extends keyof Options>(key: K): Options[K]`
  - `protected setConfigurations(configurations: Options): this`
  - `protected shouldBeLogged(data: LoggingData): boolean`
  - `public abstract log(data: LoggingData): void | Promise<void>`
  - `public flushSync?(): void`
  - `protected getDateAndTimeFormat(): { date: string, time: string }`
  - `protected withBasicConfigurations(configurations: Partial<Options>): Options`

### src/logger.ts
*Orchestrates log message dispatching across multiple registered channels.*

- **Class** `Logger`
  - `public channels: LogChannel[]`
  - `public id: string`
  - `public addChannel(channel: LogChannel): this`
  - `public configure(config: { channels: LogChannel[] }): this`
  - `public setChannels(channels: LogChannel[]): this`
  - `public async log(data: LoggingData): Promise<this>`
  - `public debug(dataOrModule: LoggingData | string, action?: string, message: any): Promise<this>`
  - `public info(dataOrModule: OmittedLoggingData | string, action?: string, message: any): Promise<this>`
  - `public warn(dataOrModule: LoggingData | string, action?: string, message: any): Promise<this>`
  - `public error(dataOrModule: LoggingData | string, action?: string, message: any): Promise<this>`
  - `public success(dataOrModule: LoggingData | string, action?: string, message: any): Promise<this>`
  - `public channel(name: string): LogChannel | undefined`
  - `public flushSync(): void`
- **Constant** `logger: Logger`
- **Constant** `log: Log`

### src/types.ts
*Contains types, interfaces, and contracts for the logging system.*

- **Type** `LogLevel`
- **Type** `DebugMode`
- **Type** `BasicLogConfigurations`
- **Type** `LogMessage`
- **Interface** `LogContract`
- **Type** `LoggingData`
- **Type** `OmittedLoggingData`
- **Interface** `Log`

### src/channels/console-log.ts
*Implements logging output to the terminal with color-coded levels and icons.*

- **Class** `ConsoleLog extends LogChannel<BasicLogConfigurations>`
  - `public name: string`
  - `public terminal: boolean`
  - `public log(data: LoggingData): void`

### src/channels/file-log.ts
*Provides persistent logging to the filesystem with support for rotation and buffering.*

- **Type** `FileLogConfig`
- **Class** `FileLog extends LogChannel<FileLogConfig> implements LogContract`
  - `public name: string`
  - `public get filePath(): string`
  - `public get fileName(): string`
  - `public get extension(): string`
  - `public get storagePath(): string`
  - `public flushSync(): void`
  - `public async log(data: LoggingData): Promise<void>`

### src/channels/json-file-log.ts
*Stores log messages in structured JSON files for better machine readability.*

- **Class** `JSONFileLog extends FileLog implements LogContract`
  - `public name: string`
  - `public get extension(): string`
  - `public flushSync(): void`
  - `public async log(data: LoggingData): Promise<void>`

### src/utils/capture-unhandled-errors.ts
*Registers process-level listeners to catch and log unhandled rejections and exceptions.*

- **Function** `captureAnyUnhandledRejection(): void`

### src/utils/clear-message.ts
*Strips ANSI escape codes and terminal styling from log messages.*

- **Function** `clearMessage(message: any): any`

### src/channels/index.ts & src/utils/index.ts
*Barrel files for channels and utilities.*

- **Re-exports**: All child files.

### src/index.ts
*Main entry point re-exporting all logger functionality.*

- **Re-exports**: All internal components.
