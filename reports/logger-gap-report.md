# Logger Documentation Gap Report

## Existing Pages (5 total)

1. `docs/logger/introduction.mdx` — overview, basic usage, log levels, channels overview, utilities
2. `docs/logger/configurations.mdx` — LogConfigurations schema, environment overrides, programmatic config
3. `docs/logger/channels.mdx` — ConsoleLog, FileLog, JSONFileLog, custom channels, LogChannel API
4. `docs/logger/api-reference.mdx` — Logger class table, log interface, logger singleton, LogContract, LogMessage, OmittedLoggingData
5. `docs/logger/types.mdx` — all public types: LogLevel, DebugMode, LoggingData, OmittedLoggingData, BasicLogConfigurations, LogMessage, LogContract, Log

## Coverage by Map-Documented Symbol

| Symbol / Feature | Map source | Status |
|---|---|---|
| `Logger` class | `src/logger.md` | ✅ Covered |
| `Logger.addChannel()` | `src/logger.md` | ✅ Covered |
| `Logger.configure()` | `src/logger.md` | ✅ Covered |
| `Logger.setChannels()` | `src/logger.md` | ✅ Covered |
| `Logger.log()` | `src/logger.md` | ✅ Covered |
| `Logger.debug/info/warn/error/success()` | `src/logger.md` | ✅ Covered |
| `Logger.channel()` | `src/logger.md` | ✅ Covered |
| `logger` singleton | `src/logger.md` | ✅ Covered |
| `log` functional interface | `src/logger.md` | ✅ Covered |
| `log.channel()` | `src/logger.md` | ✅ Covered |
| `LogChannel` abstract class | `src/log-channel.md` | ✅ Covered |
| `LogChannel.terminal` field | `src/log-channel.md` | ✅ Covered |
| `LogChannel.shouldBeLogged()` | `src/log-channel.md` | ✅ Covered |
| `LogChannel.config()` | `src/log-channel.md` | ✅ Covered |
| `LogChannel.init()` hook | `src/log-channel.md` | ✅ Covered |
| `LogChannel.withBasicConfigurations()` | `src/log-channel.md` | ⚠️ Partial (in API table only, no explanation of when to use) |
| `ConsoleLog` | `src/channels/console-log.md` | ✅ Covered |
| `FileLog` | `src/channels/file-log.md` | ✅ Covered |
| `FileLog.groupBy` config | `src/channels/file-log.md` | ✅ Covered |
| `FileLog.chunk` variants | `src/channels/file-log.md` | ⚠️ Partial — docs list monthly/yearly but source only implements single/daily/hourly |
| `FileLog` rotation | `src/channels/file-log.md` | ✅ Covered |
| `JSONFileLog` | `src/channels/json-file-log.md` | ✅ Covered |
| `JSONFileLog` name = "fileJson" | `src/channels/json-file-log.md` | ✅ Covered |
| `captureAnyUnhandledRejection()` | `src/utils/capture-unhandled-errors.md` | ✅ Covered |
| `clearMessage()` | `src/utils/clear-message.md` | ✅ Covered |
| `LogLevel` type | `src/types.md` | ✅ Covered |
| `DebugMode` type | `src/types.md` | ✅ Covered |
| `LoggingData` type | `src/types.md` | ✅ Covered |
| `OmittedLoggingData` type | `src/types.md` | ✅ Covered |
| `BasicLogConfigurations` interface | `src/types.md` | ✅ Covered |
| `LogMessage` type | `src/types.md` | ✅ Covered |
| `LogContract` interface | `src/types.md` | ✅ Covered |
| `Log` interface | `src/types.md` | ✅ Covered |

## Errors in Existing Docs

### introduction.mdx
1. **Invented API — `log.flushSync()`**: Not bound to the `log` object in source (source binds only info, debug, warn, error, success, channel). Remove all references including the `beforeExit` pattern.

### channels.mdx
2. **Invented type — `FileLogConfig`**: `import { FileLog, type FileLogConfig }` — no such named export.
3. **Invented API — `flushSync()` on FileLog**: The "Flushing before process exit" subsection (FileLog and log.flushSync) does not exist in source.
4. **Invented `context` enrichment on `BasicLogConfigurations`**: The `context` async callback field is not in the source type (which only has levels, dateFormat, filter). Remove "Context enrichment" subsection from ConsoleLog.
5. **Invented `LogChannel.flushSync()`** in API reference table: Does not exist. Remove row.
6. **`FileLog.chunk`** — docs list `"monthly"` and `"yearly"` but source `fileName` getter only handles single/daily/hourly.

### configurations.mdx
7. **Invented API — `log.flushSync()`** and **`fileChannel.flushSync?.()`**: Remove both code blocks.

### api-reference.mdx
8. **Invented method — `flushSync` in Logger class table**: Does not exist on Logger.
9. **Invented method — `flushSync()` in Log interface definition**: Not bound.
10. **Wrong signatures — `context?` as 4th param**: All level methods show `(dataOrModule, action?, message?, context?)` — actual signature is `(dataOrModule, action?, message?)`.
11. **Invented `LogMessage.timestamp`**: Not in the source type.

### types.mdx
12. **Invented `BasicLogConfigurations.context`** async field: Not in source. Remove field and its usage example.
13. **Invented `LogMessage.timestamp`**: Not in source type. Remove.
14. **Invented `Log.flushSync()`**: Not bound. Remove from Log interface definition.

## Action Plan

### New Pages to Write
None — all exported symbols are already documented.

### Existing Pages to Update (including bug fixes)

1. **`introduction.mdx`** — Remove `log.flushSync()` (2 occurrences), rewrite utilities section around `captureAnyUnhandledRejection()` and `clearMessage()` only
2. **`channels.mdx`** — Remove: `FileLogConfig` import, both `flushSync()` subsection and LogChannel table row, "Context enrichment" subsection from ConsoleLog, `"monthly"`/`"yearly"` chunk values
3. **`configurations.mdx`** — Remove `log.flushSync()` call and `fileChannel.flushSync?.()` block
4. **`api-reference.mdx`** — Remove: `flushSync` from Logger table, `flushSync` from Log interface, `context?` 4th param from all level signatures, `timestamp` from LogMessage table
5. **`types.mdx`** — Remove: `BasicLogConfigurations.context` field + full example, `LogMessage.timestamp`, `Log.flushSync()` from interface
