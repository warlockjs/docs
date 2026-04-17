# json-file-log
source: src/channels/json-file-log.ts
description: Extends FileLog to write structured log messages to JSON files with optional grouping support.
complexity: medium
first-mapped: 2026-04-17 06:06:13 AM
last-mapped: 2026-04-17 06:06:13 AM

## Imports
- `@mongez/fs`: ensureDirectoryAsync, fileExistsAsync, getJsonFileAsync, putJsonFileAsync [lines 2-6]
- `dayjs`: dayjs [line 7]
- `fs`: Node.js filesystem module [line 8]
- `path`: Node.js path module [line 9]
- `../types`: LogContract, LogMessage, LoggingData [line 10]
- `./file-log`: FileLog base class [line 11]

## Exports
- `JSONFileLog` [line 13] — Main class extending FileLog

## Classes

### JSONFileLog extends FileLog implements LogContract [lines 13-192]
Logs messages to JSON files with optional directory grouping.

**Fields**
- `name` public [line 17] — Set to "fileJson"
- `extension` public getter [lines 22-24] — Returns "json"
- `initialFileContents` protected getter [lines 29-33] — Returns object with messages array

**Methods**
- `flushSync()` public void [lines 38-76]
  Synchronously write buffered messages to JSON file.
  side-effects: I-O (file write via fs.mkdirSync, fs.writeFileSync)

- `log(data: LoggingData)` public async [lines 81-109]
  Transform Error objects to strings, format timestamps, queue message.
  throws: possible exception from checkIfMessagesShouldBeWritten
  side-effects: mutates this.messages array

- `writeMessagesToFile()` protected async [lines 114-148]
  Write queued messages to single or grouped JSON files asynchronously.
  throws: caught errors logged to console
  side-effects: I-O (file read/write via async fs utilities, console.error)

- `writeGroupedMessagesToFile()` protected async [lines 153-191]
  Write grouped messages to separate directories, one file per group.
  throws: caught errors logged to console
  side-effects: I-O (directory creation, file read/write)
