# channels
created: 2026-04-17 06:08:33 AM
updated: 2026-04-17 06:08:33 AM

> Logging output channels that format and transmit log entries to different destinations (console, file, JSON).

## What lives here
- `console-log.ts` — Color-coded console output with timestamps, modules, and severity icons
- `file-log.ts` — File-based buffered logger with rotation, chunking, and optional grouping
- `json-file-log.ts` — Extends FileLog to store logs as structured JSON with optional grouping

## Public API
- `ConsoleLog` — Terminal logger with color formatting by level
- `FileLog extends LogChannel<FileLogConfig> implements LogContract` — Disk-based buffered logger
- `JSONFileLog extends FileLog implements LogContract` — JSON file formatter extending FileLog
- `FileLogConfig = BasicLogConfigurations & {...}` — Configuration type with storage, rotation, grouping options
- `ConsoleLog.log(data: LoggingData): void` — Format and output colored log to terminal
- `FileLog.log(data: LoggingData): Promise<void>` — Buffer and conditionally flush log to disk
- `FileLog.flushSync(): void` — Write all buffered messages synchronously
- `JSONFileLog.flushSync(): void` — Synchronously write buffered messages to JSON
- `JSONFileLog.log(data: LoggingData): Promise<void>` — Transform Error objects, queue message for JSON write

## How it fits together
Each channel extends `LogChannel` and implements `LogContract` to provide a pluggable output destination. `ConsoleLog` directly formats and prints colored messages for terminal display. `FileLog` buffers messages and writes them periodically or on-demand via `flushSync()`, supporting chunking by time period and rotation when file size exceeds `maxFileSize`. `JSONFileLog` reuses FileLog's buffering and I/O logic but overrides write methods to serialize messages as JSON, optionally grouping output by level, module, or action into separate directories. All channels respect filters and log levels configured in `BasicLogConfigurations`.

## Working examples
```typescript
// Using ConsoleLog for terminal output with colors by level
import { ConsoleLog } from './channels/console-log';

const consoleLog = new ConsoleLog();
consoleLog.log({
  module: 'auth',
  action: 'login',
  message: 'User authenticated successfully',
  type: 'success'
});
// Outputs colored terminal message with ✓ icon
```

```typescript
// Using FileLog with buffering and daily rotation
import { FileLog } from './channels/file-log';

const fileLog = new FileLog({
  storagePath: './logs',
  name: 'app',
  chunk: 'daily',
  rotate: true,
  maxMessagesToWrite: 100,
  groupBy: ['level']
});

await fileLog.log({
  module: 'database',
  action: 'query',
  message: 'Connection pool exhausted',
  type: 'warn'
});
// Buffered; written when 100 messages accumulated or flushSync() called
```

```typescript
// Using JSONFileLog for structured JSON logs
import { JSONFileLog } from './channels/json-file-log';

const jsonLog = new JSONFileLog({
  storagePath: './json-logs',
  name: 'events',
  chunk: 'single',
  groupBy: ['module', 'level']
});

await jsonLog.log({
  module: 'api',
  action: 'endpoint',
  message: 'Request timeout',
  type: 'error'
});
// Writes {messages: [{...}]} to json-logs/api/error/events.json
```

## DO NOT
- Do NOT instantiate channels directly without setting `configurations` — the parent `LogChannel` base class requires it for level filtering and format defaults
- Do NOT call `writeMessagesToFile()` or `writeGroupedMessagesToFile()` directly — they are protected; use `log()` or `flushSync()` instead
- Do NOT modify `messages` or `groupedMessages` arrays directly — they are mutated internally by `log()`, `onSave()`, and write methods
- Do NOT assume synchronous writes in `FileLog.log()` — it is async and buffers; only `flushSync()` is synchronous
- Do NOT forget to `await` async `log()` methods in `FileLog` and `JSONFileLog`, or errors in `checkIfMessagesShouldBeWritten()` will be unhandled

## Internal (not for docs)
- `FileLog.messages` — Buffered LogMessage array before flush
- `FileLog.groupedMessages` — Internal Record<string, LogMessage[]> for grouped output
- `FileLog.checkAndRotateFile()` — Protected rotation check; called after write
- `FileLog.rotateLogFile()` — Protected rename with timestamp suffix
- `FileLog.initMessageFlush()` — Protected interval setup (5s periodic flush)
- `FileLog.onSave()` — Protected reset of buffers and flags post-write
- `JSONFileLog.initialFileContents` — Protected getter returning {messages: []} template
