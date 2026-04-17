# Logger Documentation Gap Report

## Existing Pages (3 total)
- `introduction.mdx` — High-level overview of the logger: basic usage, five log levels, `LoggingData` structured input, error logging, channels overview, and a utilities section covering `captureAnyUnhandledRejection` and `flushSync`
- `channels.mdx` — Per-channel reference for `ConsoleLog`, `FileLog`, and `JSONFileLog`; custom channel authoring via `LogChannel`; `clearMessage` utility; `LogChannel` API reference table
- `configurations.mdx` — `LogConfigurations` schema (`enabled`, `channels`, environment overrides, per-channel `levels`, `filter`, `dateFormat`)

---

## Coverage by Map-Documented Symbol

| Symbol / Feature | Map source | Status |
|---|---|---|
| `LogLevel` (union type) | `src/types.ts` | ⚠️ Partial — used implicitly in every example but never named or shown as an importable type |
| `DebugMode` (union type) | `src/types.ts` | ❌ Missing — not mentioned anywhere in any doc page |
| `BasicLogConfigurations` (type) | `src/types.ts` | ⚠️ Partial — `channels.mdx` names it in one sentence ("ConsoleLog accepts the full `BasicLogConfigurations` shape") but never shows the interface definition or explains the `context` async-enrichment field |
| `BasicLogConfigurations.context` (async enrichment field) | `src/types.ts` | ❌ Missing — the `context?: (data: LoggingData) => Promise<Record<string, any>>` field is entirely undocumented |
| `LogMessage` (type) | `src/types.ts` | ❌ Missing — the fully formatted output shape is not documented |
| `LogContract` (interface) | `src/types.ts` | ❌ Missing — the interface (name, description, terminal, log, flushSync) is never shown; readers who want to implement a raw channel without extending `LogChannel` have no reference |
| `LoggingData` (type) | `src/types.ts` | ✅ Covered — defined in full in `introduction.mdx` |
| `OmittedLoggingData` (type) | `src/types.ts` | ❌ Missing — not mentioned anywhere |
| `Log` (interface) | `src/types.ts` | ⚠️ Partial — the `log` constant and its five shorthand methods are covered; `log.channel(name)` is absent (see below) |
| `Logger` class — `addChannel()` | `src/logger.ts` | ❌ Missing — no doc explains how to add a channel to the `logger` singleton imperatively at runtime |
| `Logger` class — `configure()` | `src/logger.ts` | ❌ Missing — the programmatic configuration method is never shown |
| `Logger` class — `setChannels()` | `src/logger.ts` | ❌ Missing — not documented |
| `Logger` class — `channel(name)` | `src/logger.ts` | ❌ Missing — neither `logger.channel()` nor `log.channel()` is documented |
| `Logger` class — `log(data)` | `src/logger.ts` | ✅ Covered — demonstrated via `await log(entry)` in `introduction.mdx` |
| `Logger` class — `flushSync()` | `src/logger.ts` | ✅ Covered — documented in `channels.mdx` under "Flushing before process exit" |
| `logger` singleton (named export) | `src/logger.ts` | ❌ Missing — the `logger` named export is never mentioned; docs only show the `log` functional interface |
| `log` functional interface | `src/logger.ts` | ✅ Covered |
| `LogChannel` abstract class — general | `src/log-channel.ts` | ✅ Covered — `channels.mdx` has a full API reference table |
| `LogChannel.shouldBeLogged()` | `src/log-channel.ts` | ✅ Covered — table in `channels.mdx` |
| `LogChannel.config()` | `src/log-channel.ts` | ✅ Covered — table in `channels.mdx` |
| `LogChannel.getDateAndTimeFormat()` | `src/log-channel.ts` | ✅ Covered — table in `channels.mdx` |
| `LogChannel.init()` hook | `src/log-channel.ts` | ✅ Covered — `channels.mdx` shows the async init pattern |
| `LogChannel.flushSync()` (optional) | `src/log-channel.ts` | ✅ Covered — table in `channels.mdx` |
| `LogChannel.withBasicConfigurations()` | `src/log-channel.ts` | ❌ Missing — protected factory helper not documented |
| `LogChannel.setConfigurations()` | `src/log-channel.ts` | ❌ Missing — not documented |
| `LogChannel.defaultConfigurations` property | `src/log-channel.ts` | ❌ Missing — not mentioned; relevant for custom channel authors who need to set defaults |
| `ConsoleLog` | `src/channels/console-log.ts` | ✅ Covered |
| `FileLog` | `src/channels/file-log.ts` | ✅ Covered |
| `FileLogConfig` (type) | `src/channels/file-log.ts` | ⚠️ Partial — all fields are shown inline in a code block in `channels.mdx`, but the type is not exported/imported by name as a standalone type in the narrative (it is shown correctly in one import example: `import { FileLog, type FileLogConfig }`) |
| `FileLog.filePath` (getter) | `src/channels/file-log.ts` | ❌ Missing — the public `filePath` computed getter is not documented |
| `FileLog.fileName` (getter) | `src/channels/file-log.ts` | ❌ Missing — not documented |
| `FileLog.storagePath` (getter) | `src/channels/file-log.ts` | ❌ Missing — not documented |
| `FileLog.extension` (getter) | `src/channels/file-log.ts` | ❌ Missing — not documented |
| `FileLogConfig.chunk` — `"monthly"` / `"yearly"` values | `src/channels/file-log.ts` | ❌ Missing — `DebugMode` (and by extension `FileLogConfig.chunk`) supports `"monthly"` and `"yearly"`, but the docs only show `"single"`, `"daily"`, and `"hourly"` |
| `JSONFileLog` | `src/channels/json-file-log.ts` | ✅ Covered |
| `JSONFileLog.name` = `"fileJson"` | `src/channels/json-file-log.ts` | ❌ Missing — the channel's internal name (`"fileJson"`, not `"json"`) is not disclosed; matters when using `log.channel("fileJson")` |
| `captureAnyUnhandledRejection()` | `src/utils/capture-unhandled-errors.ts` | ⚠️ Partial — mentioned in `introduction.mdx` with a usage example; no detail about which Node.js events are hooked or what the logged error entry looks like |
| `clearMessage(message)` | `src/utils/clear-message.ts` | ✅ Covered — documented in `channels.mdx` with signature and example |

---

## Errors in Existing Docs

### 1. `flushSync` shown as a standalone top-level export — INCORRECT (`introduction.mdx`, lines 102–113)

The utilities section imports `flushSync` directly from `@warlock.js/logger`:

```ts
import {
  captureAnyUnhandledRejection,
  flushSync,         // ← this import
} from "@warlock.js/logger";

process.on("beforeExit", () => {
  flushSync();       // ← called as a free function
});
```

According to the source map (`src/logger.ts`, `src/types.ts`), `flushSync` is **not** a standalone exported function. It is:
- A method on the `Logger` class: `logger.flushSync()`
- A method on the `Log` interface: `log.flushSync()`
- An optional method on individual `LogChannel` instances: `channel.flushSync()`

The correct pattern (which `channels.mdx` gets right) is:

```ts
process.on("beforeExit", () => {
  log.flushSync();   // ← method on the log interface
});
```

The standalone `import { flushSync }` in `introduction.mdx` documents an API that does not exist and will cause a runtime error.

### 2. `captureAnyUnhandledRejection` description is incomplete (`introduction.mdx`, lines 115–117)

The description says it hooks "Node.js's `unhandledRejection` and `uncaughtException` events", which is accurate, but it does not mention what the resulting log entry looks like (module, action, level). This is minor but misleading for readers trying to interpret captured errors in their log files.

### 3. `channels.mdx` custom channel example imports `LogConfigurations` from `@warlock.js/core`, not `@warlock.js/logger`

```ts title="src/config/log.ts"
import type { LogConfigurations } from "@warlock.js/core";
```

This is intentional (the type lives in `@warlock.js/core`), but the source map for `@warlock.js/logger` does not include `LogConfigurations`. There is no error here per se, but neither `channels.mdx` nor `configurations.mdx` explains this cross-package dependency, which may confuse readers who search for `LogConfigurations` inside `@warlock.js/logger` and find nothing.

---

## Action Plan

### New Pages to Write

1. **`api-reference.mdx`** (or a dedicated section within an existing page)
   - Document the `Logger` class public API: `addChannel()`, `configure()`, `setChannels()`, `channel()`, `log()`, `flushSync()`, plus the `logger` named singleton export
   - Document the `log.channel(name)` method on the `Log` interface
   - Document the `LogContract` interface with its full shape
   - Document `LogMessage` type with all fields
   - Document `OmittedLoggingData` type

2. **`types.mdx`** (or append to `introduction.mdx`)
   - `LogLevel` union — show as importable type
   - `DebugMode` union — currently completely undocumented; especially important because `FileLogConfig.chunk` silently supports `"monthly"` and `"yearly"` but the docs only show three values
   - `BasicLogConfigurations` — full interface with the `context` async enrichment field explained and demonstrated
   - `LoggingData` — already in `introduction.mdx`; move here for consolidation
   - `OmittedLoggingData` — note it as a convenience type for shorthand calls

### Existing Pages to Update (including bug fixes)

#### `introduction.mdx`
- **Bug fix (critical):** Remove the `import { flushSync }` example in the Utilities section. Replace the standalone `flushSync()` call with `log.flushSync()`. Add a note that `flushSync` is a method on `log` (and on individual channel instances), not a package-level export.
- Add a mention of the `logger` named singleton alongside `log`, and explain the difference (class instance vs. functional interface).
- Expand `captureAnyUnhandledRejection` description to state which process events are hooked (`unhandledRejection`, `uncaughtException`) and the level/module/action the captured entry is logged under.

#### `channels.mdx`
- Add `FileLogConfig.chunk` values `"monthly"` and `"yearly"` to the option table and comments.
- Expose `JSONFileLog`'s internal channel name (`"fileJson"`) so readers know how to retrieve it via `log.channel("fileJson")`.
- Add `LogChannel.defaultConfigurations` to the API reference table — it is the standard way custom channel authors provide default option values.
- Mention `LogChannel.withBasicConfigurations()` as the protected helper for merging defaults in custom channels.
- Expand `BasicLogConfigurations` description to include the `context` async enrichment callback (currently missing entirely).

#### `configurations.mdx`
- Add a brief explanation that `LogConfigurations` is imported from `@warlock.js/core`, not `@warlock.js/logger`, and why (architectural split between the framework config type and the logger package).
- Add an example showing the `Logger` singleton's programmatic API (`logger.addChannel()`, `logger.setChannels()`, `logger.configure()`) as an alternative to the config-file approach, for users who configure logging in code rather than via the file convention.
