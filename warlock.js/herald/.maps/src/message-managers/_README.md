# Message Managers
created: 2026-04-17 05:12:57 AM
updated: 2026-04-17 05:12:57 AM

> Provides the abstract base classes, factory functions, and types for publishing and consuming typed events through Herald brokers (RabbitMQ or Kafka).

## What lives here
- `event-consumer.ts` — abstract `EventConsumer` base class and `defineConsumer` factory for registering event consumers
- `event-message.ts` — abstract `EventMessage` base class and `defineEvent` factory for publishing typed events
- `prepare-consumer-subscription.ts` — builds a validated `MessageHandler` callback that routes incoming messages to an `EventConsumer`
- `types.ts` — `ConsumedEventMessage` and `EventConsumerClass` type contracts shared across the module

## Public API
- `EventConsumer<Payload>` — abstract base class; extend and implement `handle`
- `defineConsumer(eventName, options): EventConsumerClass` — creates registered consumer without a class
- `EventMessage<TPayload>` — abstract base class for all Herald events
- `defineEvent<IncomingData, OutgoingData>(eventName, options): EventMessageClass` — creates named EventMessage subclass inline
- `prepareConsumerSubscription(Consumer, onError?): MessageHandler<any>` — builds validated message handler for consumer class
- `ConsumedEventMessage` — Message envelope type with version, metadata, and payload
- `EventConsumerClass` — constructor contract type for event consumers

## How it fits together
`EventMessage` subclasses (or those produced by `defineEvent`) are instantiated and serialized before being handed to the broker layer for publishing. On the consumer side, `EventConsumer` subclasses (or those produced by `defineConsumer`) are wrapped by `prepareConsumerSubscription`, which builds the low-level `MessageHandler` callback that validates version bounds, runs schema validation, calls `handle`, and acknowledges or negatively-acknowledges the broker message. `ConsumedEventMessage` and `EventConsumerClass` from `types.ts` are the shared contracts that bind all three pieces together without circular imports.

## Working examples
```typescript
// Define and publish a typed event using defineEvent
import { defineEvent } from "@warlock.js/herald";

const UserCreatedEvent = defineEvent<{ id: number; name: string }>(
  "user.created",
  {
    toJSON: (data) => ({ id: data.id, name: data.name }),
  },
);

// Instantiate and serialize before publishing
const event = new UserCreatedEvent({ id: 42, name: "Alice" });
const envelope = event.serialize();
// envelope.eventName === "user.created"
// envelope.payload  === { id: 42, name: "Alice" }
```

```typescript
// Extend EventConsumer to handle a specific event
import { EventConsumer, ConsumedEventMessage } from "@warlock.js/herald";

class UserCreatedConsumer extends EventConsumer<{ id: number; name: string }> {
  public static eventName = "user.created";
  public static minVersion = 1;

  public async handle(payload: { id: number; name: string }, event: ConsumedEventMessage): Promise<void> {
    console.log("Received user.created:", payload.id, event.messageId);
  }
}
```

```typescript
// Use defineConsumer for inline registration without a class
import { defineConsumer } from "@warlock.js/herald";

const OrderPlacedConsumer = defineConsumer<{ orderId: string }>(
  "order.placed",
  {
    handle: async (payload, event) => {
      console.log("Order placed:", payload.orderId, "at", event.occurredAt);
    },
  },
);
```

```typescript
// Build a MessageHandler callback using prepareConsumerSubscription
import { prepareConsumerSubscription } from "@warlock.js/herald";

const handler = prepareConsumerSubscription(
  UserCreatedConsumer,
  (error, consumerName) => {
    console.error(`Consumer ${consumerName} failed:`, error);
  },
);
// Pass `handler` to the broker subscription layer
```

## DO NOT
- Do NOT call `new EventConsumer()` directly — it is abstract and must be subclassed or created via `defineConsumer`
- Do NOT call `serialize()` or `toJSON()` on a bare `EventMessage` without providing data — `toJSON()` throws `Error` when `data` is undefined
- Do NOT use `EventOptions` or `ConsumerOptions` directly in external code — they are internal types not exported from the module
- Do NOT manually acknowledge/nack broker messages when using `prepareConsumerSubscription` — it handles `ctx.ack()` and `ctx.nack()` internally based on validation and handler outcome
- Do NOT assume `consumerId` is stable across process restarts — it is a lazy UUID generated once per class per process lifetime via `static get consumerId`

## Internal (not for docs)
- `ConsumerOptions` — local options type used only inside `defineConsumer`; not exported
- `EventOptions` — local options type used only inside `defineEvent`; not exported
- `EventMessageClass` (in event-message.ts) — internal constructor type alias used as `defineEvent` return type; not exported from the module
