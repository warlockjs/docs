# message.types
source: src/types/message.types.ts
description: Core message types and handlers for broker event pub/sub system.
complexity: simple
first-mapped: 2026-04-17 04:25:18 AM
last-mapped: 2026-04-17 04:25:18 AM

## Exports
- `MessageMetadata` — Message identification and routing metadata [lines 1-10]
- `Message<TPayload>` — Wrapper containing metadata and payload [lines 12-16]
- `MessageContext` — Message processing control and responses [lines 18-24]
- `Subscription` — Subscription lifecycle management interface [lines 26-34]
- `MessageHandler<TPayload>` — Message processing callback function [lines 36-39]
- `ResponseHandler<TPayload, TResponse>` — Request-reply callback function [lines 41-44]

## Types & Interfaces

### MessageMetadata [lines 1-10] — Message identification and routing metadata
- `messageId: string` — Unique message identifier
- `correlationId?: string` — Correlate related messages
- `replyTo?: string` — Response routing channel
- `priority?: number` — Message processing priority
- `timestamp: Date` — Message creation timestamp
- `headers?: Record<string, string>` — Custom metadata headers
- `retryCount?: number` — Delivery attempt counter
- `originalChannel?: string` — Dead-letter original channel

### Message<TPayload> [lines 12-16] — Wrapper containing metadata and payload
- `readonly metadata: MessageMetadata`
- `readonly payload: TPayload` — Generic message body
- `readonly raw?: unknown` — Broker-native message object

### MessageContext [lines 18-24] — Message processing control and responses
- `ack(): Promise<void>` — Acknowledge successful processing
- `nack(requeue?: boolean): Promise<void>` — Reject with requeue option
- `reject(): Promise<void>` — Reject without requeue
- `reply<T>(payload: T): Promise<void>` — Send reply to requester
- `retry(delay?: number): Promise<void>` — Retry with optional delay

### Subscription [lines 26-34] — Subscription lifecycle management interface
- `readonly id: string` — Unique subscription identifier
- `readonly channel: string` — Subscribed channel name
- `readonly consumerTag?: string` — Broker consumer tag
- `unsubscribe(): Promise<void>` — Stop subscription
- `pause(): Promise<void>` — Pause message delivery
- `resume(): Promise<void>` — Resume message delivery
- `isActive(): boolean` — Check subscription status

### MessageHandler<TPayload> [lines 36-39] — Message processing callback function
- Generic handler for consuming messages, optional async

### ResponseHandler<TPayload, TResponse> [lines 41-44] — Request-reply callback function
- Generic handler for request-reply patterns, optional async
