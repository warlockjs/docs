# src
created: 2026-04-17
updated: 2026-04-17

> The core logging module providing multi-channel structured logging with five severity levels and pluggable channel architecture.

## What lives here
- `types.ts` — Core logging type definitions and interfaces for the logger module
- `logger.ts` — Main logger class providing multi-channel logging with debug, info, warn, error, success levels
- `log-channel.ts` — Abstract base class for logging channels with configuration management and message filtering

## Public API
- `Logger` — Main logging class with channel management
- `log(data: LoggingData): Promise<Logger>` — Functional logging interface (main entry point)
- `log.info(module, action, message): Promise<Logger>` — Log at info level
- `log.debug(module, action, message): Promise<Logger>` — Log at debug level
- `log.warn(module, action, message): Promise<Logger>` — Log at warn level
- `log.error(module, action, message): Promise<Logger>` — Log at error level
- `log.success(module, action, message): Promise<Logger>` — Log at success level
- `log.channel(name: string): LogChannel | undefined` — Retrieve channel by name
- `log.flushSync(): void` — Synchronously flush all buffered logs
- `LogLevel` — Union type of severity levels
- `LoggingData` — Input shape for logging calls
- `LogMessage` — Formatted log entry for output
- `LogChannel<Options>` — Abstract base class for custom channel implementations

## How it fits together
This module orchestrates logging across multiple channels using a functional interface bound to a default `Logger` instance. Each log call passes through all registered `LogChannel` implementations, which filter by level/custom predicates and format output. Channels extend the abstract `LogChannel` base class and implement the `LogContract` interface, allowing plugins (console, file, JSON) to be composed at runtime.

## Working examples

```typescript
// Basic usage with three levels
import { log } from "./logger";

await log.info("auth", "login", "User authenticated");
await log.warn("database", "connection", "Slow query detected");
await log.error("api", "request", "Invalid token");
```

```typescript
// Detailed logging with context
import { log } from "./logger";

await log.info({
  module: "payment",
  action: "process",
  message: "Payment completed",
  context: { orderId: "ORD-123", amount: 99.99 }
});
```

```typescript
// Adding custom logging channels
import { Logger } from "./logger";
import { LogChannel } from "./log-channel";

class CustomChannel extends LogChannel {
  public name = "custom";
  
  public async log(data) {
    if (this.shouldBeLogged(data)) {
      // Custom logging logic
    }
  }
}

const logger = new Logger();
logger.addChannel(new CustomChannel());
await logger.info("module", "action", "message");
```

## DO NOT
- Do NOT instantiate `Logger` directly without channels — it will accept logs but not output anywhere
- Do NOT forget to call `log.flushSync()` at application shutdown if using buffered channels like `FileLog` — logs may be lost
- Do NOT pass raw objects to message field expecting serialization — use JSON.stringify() explicitly first
- Do NOT rely on async channel operations completing before the promise resolves if channels are intentionally fire-and-forget

## Internal (not for docs)
- `normalizeLogData()` — Private method converting overloaded method signatures to standard LoggingData structure
- `clearMessage()` — Internal utility that strips ANSI codes from messages when channel.terminal === false
