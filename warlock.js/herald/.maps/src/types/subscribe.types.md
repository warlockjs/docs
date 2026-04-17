# subscribe.types
source: src/types/subscribe.types.ts
description: Type definitions for subscription configuration, retry, and dead-letter options.
complexity: simple
first-mapped: 2026-04-17 04:25:18 AM
last-mapped: 2026-04-17 04:25:18 AM

## Exports
- `RetryOptions` — Define retry behavior configuration [lines 1-4]
- `DeadLetterOptions` — Configure dead letter queue handling [lines 6-9]
- `SubscribeOptions` — Consumer subscription configuration [lines 11-19]

## Types & Interfaces

### RetryOptions [lines 1-4] — Maximum retry attempts and delay strategy
- `maxRetries: number`
- `delay: number | ((attempt: number) => number)` — Static or dynamic delay per attempt

### DeadLetterOptions [lines 6-9] — Dead letter queue destination settings
- `channel: string`
- `preserveOriginal?: boolean`

### SubscribeOptions [lines 11-19] — Message subscription configuration options
- `consumerId?: string`
- `group?: string`
- `prefetch?: number`
- `autoAck?: boolean`
- `retry?: RetryOptions`
- `deadLetter?: DeadLetterOptions`
- `exclusive?: boolean`
