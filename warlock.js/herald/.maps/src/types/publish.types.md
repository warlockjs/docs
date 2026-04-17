# publish.types
source: src/types/publish.types.ts
description: Defines message publishing and request-reply option types for Herald broker.
complexity: simple
first-mapped: 2026-04-17 04:25:18 AM
last-mapped: 2026-04-17 04:25:18 AM

## Exports
- `PublishOptions` — Message publishing configuration with routing and delivery settings [lines 1–9]
- `RequestOptions` — PublishOptions extended with request-reply timeout [lines 11–13]

## Types & Interfaces

### PublishOptions  [lines 1–9] — Message publishing configuration options
- `priority?: number` — Message priority level for broker processing
- `ttl?: number` — Time-to-live in milliseconds before expiration
- `delay?: number` — Delivery delay in milliseconds
- `headers?: Record<string, string>` — Custom message headers
- `persistent?: boolean` — Whether message survives broker restart
- `correlationId?: string` — Unique identifier linking related messages
- `expiration?: number` — Message expiration time in milliseconds

### RequestOptions  [lines 11–13] — Request-reply pattern with timeout
- extends `PublishOptions`
- `timeout?: number` — Maximum wait time for response in milliseconds
