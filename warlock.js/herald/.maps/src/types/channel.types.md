# channel.types
source: src/types/channel.types.ts
description: Type definitions for channel configuration and statistics in message broker systems.
complexity: simple
first-mapped: 2026-04-17 04:25:18 AM
last-mapped: 2026-04-17 04:25:18 AM

## Imports
- `BaseValidator` from `@warlock.js/seal` [line 1]
- `DeadLetterOptions` from `./subscribe.types` [line 2]

## Exports
- `ChannelOptions` — generic type for broker channel configuration [lines 4-14]
- `ChannelStats` — type for channel message and consumer metrics [lines 16-20]

## Types & Interfaces

### ChannelOptions<TPayload = unknown>  [lines 4-14] — Broker channel configuration options
- `type?: "queue" | "topic" | "fanout"` — exchange/queue type
- `durable?: boolean` — persistence across broker restarts
- `autoDelete?: boolean` — remove when last consumer disconnects
- `exclusive?: boolean` — single connection only
- `deadLetter?: DeadLetterOptions` — dead-letter queue settings
- `maxMessageSize?: number` — maximum payload bytes
- `messageTtl?: number` — message time-to-live milliseconds
- `maxLength?: number` — maximum queued messages
- `schema?: BaseValidator` — payload validation schema

### ChannelStats  [lines 16-20] — Channel runtime statistics
- `messageCount: number` — current queued messages
- `consumerCount: number` — active consumer subscriptions
- `name: string` — channel or queue identifier
