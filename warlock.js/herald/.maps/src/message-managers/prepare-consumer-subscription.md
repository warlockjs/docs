# prepare-consumer-subscription
source: src/message-managers/prepare-consumer-subscription.ts
description: Builds a reusable MessageHandler callback that validates, versions, and dispatches incoming messages to an EventConsumer instance.
complexity: medium
first-mapped: 2026-04-17 04:25:18 AM
last-mapped: 2026-04-17 04:25:18 AM

## Imports
- `MessageHandler` from `../types`
- `EventConsumerClass` from `./types`

## Exports
- `prepareConsumerSubscription` — builds validated message handler callback  [lines 4-50]

## Functions / Classes / Types

### prepareConsumerSubscription  [lines 4-50] — creates message handler for consumer class
- params: `Consumer: EventConsumerClass`, `onError?: (error: unknown, consumerName: string) => void`
- returns: `MessageHandler<any>` (async callback)
- side-effects: calls `ctx.ack()` on success or skipped version, `ctx.nack()` on validation failure, `ctx.nack(true)` on handler error; invokes `onError` if provided
- throws: catches internally; forwards errors to `onError` callback
