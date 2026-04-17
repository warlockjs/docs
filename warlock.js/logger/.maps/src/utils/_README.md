# utils
created: 2026-04-17 06:08:33 AM
updated: 2026-04-17 06:08:33 AM

> Utility functions that handle global error capture and terminal message cleaning for the logging system.

## What lives here
- `capture-unhandled-errors.ts` — Registers process listeners for unhandled promise rejections and uncaught exceptions.
- `clear-message.ts` — Strips ANSI terminal escape codes from message strings.

## Public API
- `captureAnyUnhandledRejection()` — Registers handlers for process errors.
- `clearMessage(message: any)` — Removes terminal codes from strings.

## How it fits together
The `capture-unhandled-errors` module handles global application error coverage by listening to unhandled promise rejections and exceptions, logging them via the logger module. The `clear-message` utility provides string sanitization for log messages by removing ANSI escape sequences. These utilities are foundational infrastructure—the error capture runs early in application startup, while message clearing supports the logging pipeline.

## Working examples
```typescript
// Initialize global error capture at application startup
import { captureAnyUnhandledRejection } from "./utils/capture-unhandled-errors";
captureAnyUnhandledRejection();

// Clean colored/formatted log output for plain text contexts
import { clearMessage } from "./utils/clear-message";
const rawMessage = "\u001b[31mError occurred\u001b[0m"; // Red colored text
const plain = clearMessage(rawMessage); // "Error occurred"
```

## DO NOT
- Do NOT call `captureAnyUnhandledRejection()` multiple times—it attaches duplicate listeners. Call once at application bootstrap.
- Do NOT pass non-string values to `clearMessage` expecting ANSI stripping—it returns non-strings unchanged, not cleaned.
- Do NOT rely on `clearMessage` to handle escape codes beyond ANSI terminal sequences (e.g., HTML entities or Unicode normalization).
