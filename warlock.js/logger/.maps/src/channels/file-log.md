# file-log
source: src/channels/file-log.ts
description: File-based log channel with buffering, rotation, and grouping.
complexity: complex
first-mapped: 2026-04-17 06:06:13 AM
last-mapped: 2026-04-17 06:06:13 AM

## Imports
- `ensureDirectoryAsync` from `@mongez/fs`
- `dayjs` from `dayjs`
- `fs` from `fs`
- `EOL` from `os`
- `path` from `path`
- `LogChannel` from `../log-channel`
- type `BasicLogConfigurations, LogContract, LoggingData, LogLevel, LogMessage` from `../types`

## Exports
- type `FileLogConfig` [line 17]
- class `FileLog` [line 84]

## Types & Interfaces
- type `FileLogConfig = BasicLogConfigurations & {...}` [lines 17-82] — file channel configuration options
  - `storagePath?: string`
  - `name?: string` — file name without extension
  - `chunk?: "single" | "daily" | "hourly"` = `"single"`
  - `rotate?: boolean` = `true`
  - `extension?: string` = `"log"`
  - `rotateFileName?: string` = `"DD-MM-YYYY"`
  - `maxFileSize?: number` = `10MB`
  - `maxMessagesToWrite?: number` = `100`
  - `groupBy?: ("level" | "module" | "action")[]`
  - `levels?: LogLevel[]`
  - `dateFormat?: { date?: string; time?: string }`

## Classes

### `FileLog extends LogChannel<FileLogConfig> implements LogContract` [lines 84-423] — writes buffered logs to files
- public `name = "file"` [line 88]
- protected `messages: LogMessage[] = []` [line 93] — buffered messages pending flush
- protected `groupedMessages: Record<string, LogMessage[]> = {}` [line 98]
- protected `defaultConfigurations: FileLogConfig` [lines 103-119] — default channel configuration
- protected `lastWriteTime = Date.now()` [line 124]
- protected `isWriting = false` [line 129] — write-in-progress guard
- protected async `checkAndRotateFile(filePath = this.filePath)` [lines 134-150] — rotates when file exceeds max size
  - throws: logs `ENOENT`/other errors to console (swallowed)
  - side-effects: stat I/O, may call `rotateLogFile`, console output
- protected async `rotateLogFile()` [lines 155-165] — renames current file with timestamp suffix
  - side-effects: renames file on disk, console.error on failure
- protected `initMessageFlush()` [lines 170-179] — starts periodic flush interval
  - side-effects: registers `setInterval` (5s)
- public get `filePath` [lines 184-190] — computed full log file path
- protected get `maxMessagesToWrite(): number` [lines 195-197]
- public get `fileName(): string` [lines 202-214] — name derived from chunk mode
- public get `extension(): string` [lines 219-221]
- protected get `content` [lines 226-228] — joined buffered message content
- public get `storagePath(): string` [lines 233-235]
- protected async `init()` [lines 240-246] — ensures directory and starts flush
  - side-effects: creates directory, starts interval
- public `flushSync(): void` [lines 251-269] — synchronously writes buffered messages
  - side-effects: mkdir + appendFile sync I/O, calls `onSave`
- public async `log(data: LoggingData)` [lines 274-310] — formats and buffers a log entry
  - side-effects: pushes to `messages`, may trigger write
- protected async `checkIfMessagesShouldBeWritten()` [lines 315-319] — flushes when threshold reached
  - side-effects: may call `writeMessagesToFile`
- protected `onSave()` [lines 324-329] — resets buffers and state after write
  - side-effects: clears `messages`, `groupedMessages`, updates flags
- protected get `messagedShouldBeGrouped(): boolean` [lines 334-336]
- protected async `writeMessagesToFile()` [lines 341-360] — writes buffered messages to disk
  - throws: catches write errors and logs via `console.error`
  - side-effects: file I/O, rotation check, resets `isWriting`
- protected async `writeGroupedMessagesToFile(): Promise<void>` [lines 365-390] — writes messages grouped by keys
  - side-effects: creates directories, writes per-group files, console.error on failure
- protected `prepareGroupedMessages(): void` [lines 395-404] — buckets messages by groupBy keys
  - side-effects: mutates `groupedMessages`
- protected async `write(filePath: string, content: string)` [lines 409-422] — appends content via write stream
  - throws: rejects with stream error
  - side-effects: creates append write stream, writes to disk
