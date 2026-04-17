# decorators

created: 2026-04-17 04:56:56 AM
updated: 2026-04-17 04:56:56 AM

> This folder holds decorator utilities for registering event consumer classes with message brokers.

## What lives here

- `consumable.ts` — Provides the @Consumable decorator factory that registers event consumer classes with a broker, deferring subscription if the broker is not yet connected.
- `index.ts` — Re-exports all exports from the consumable module.

## Public API

- `type ConsumableOptions` — `{ broker?: string }` — Optional configuration type specifying which named broker to register a consumer with.
- `const pendingSubscribers: Set<{ Consumer: EventConsumerClass; options?: ConsumableOptions }>` — Set of deferred consumer registrations awaiting broker connection.
- `function Consumable(options?: ConsumableOptions): (target: EventConsumerClass) => void` — Decorator factory that registers event consumer classes with a broker; subscribes immediately if broker is connected, otherwise defers to `pendingSubscribers`.

## How it fits together

The decorators folder imports `brokerRegistry` from `communicators` to access registered broker instances and their connection state, and imports `EventConsumerClass` type from `message-managers/types` to enforce type safety on consumer classes. It is imported by `message-managers/event-consumer.ts` which applies @Consumable internally to wrap consumer creation, and by application code that uses the decorator directly. The `brokerRegistry.on("connected", ...)` handler in consumable.ts drains the `pendingSubscribers` queue when brokers become available.

## Working examples

```typescript
// Example 1: Basic consumer registration with default broker
@Consumable()
class OrderEventConsumer {
  async handle(event: OrderCreated) {
    // process event
  }
}

// Example 2: Register with a named broker
@Consumable({ broker: "notifications" })
class NotificationConsumer {
  async handle(event: UserSignedUp) {
    // send notification
  }
}

// Example 3: Deferred registration when broker not yet connected
// If "analytics" broker hasn't connected yet, the consumer
// is added to pendingSubscribers and subscribed when the
// "connected" event fires from brokerRegistry
@Consumable({ broker: "analytics" })
class AnalyticsEventConsumer {
  async handle(event: PageViewed) {
    // log analytics
  }
}
```

## DO NOT

- Do NOT use @Consumable on non-EventConsumerClass classes — the decorator expects a class matching the EventConsumerClass interface and will fail type checking otherwise.
- Do NOT assume @Consumable automatically calls broker.connect() — the broker connection must be initiated separately; the decorator only subscribes once a broker is already connected.
- Do NOT access or mutate pendingSubscribers directly in application code — it is internal state managed by the decorator and the brokerRegistry event handler.
- Do NOT apply @Consumable multiple times to the same class — each application will add duplicate entries to pendingSubscribers and may cause multiple subscriptions.
- Do NOT expect subscription to happen synchronously if the broker is not yet registered — subscription is deferred and will occur when brokerRegistry fires its "connected" event.

## Internal (not for docs)

- brokerRegistry event listener registered at line 38-46 of consumable.ts — handles draining `pendingSubscribers` on broker connection; iterates all pending entries and conditionally subscribes based on broker name matching.
