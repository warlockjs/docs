---
name: herald-internals
description: How to develop, maintain, and extend the @warlock.js/herald package — architecture, conventions, and driver authoring guide.
---

# @warlock.js/herald — Package Internals

This skill is for agents **modifying the Herald package itself** (fixing bugs, adding drivers, refactoring internals). For using Herald in an application, see the project-level `herald-usage` skill instead.

---

## Package Structure

```
@warlock.js/herald/src/
├── index.ts                     # Public API — re-exports everything
├── types/                       # Shared TypeScript types (split by domain)
│   ├── index.ts                 # Re-exports all types (backward-compat barrel)
│   ├── message.types.ts         # Message, MessageMetadata, MessageContext, MessageHandler, Subscription
│   ├── publish.types.ts         # PublishOptions, RequestOptions
│   ├── subscribe.types.ts       # RetryOptions, DeadLetterOptions, SubscribeOptions
│   ├── channel.types.ts         # ChannelOptions, ChannelStats
│   ├── driver.types.ts          # BrokerDriverType, BrokerEvent, BrokerEventListener, HealthCheckResult
│   ├── connection.types.ts      # RabbitMQ/Kafka connection options, BrokerConfigurations
│   └── registry.types.ts        # BrokerRegistryEvent, BrokerRegistryListener
├── contracts/
│   ├── channel.contract.ts      # ChannelContract<TPayload> — all channel drivers implement this
│   ├── broker-driver.contract.ts  # BrokerDriverContract — all drivers implement this
│   └── index.ts
├── communicators/               # NOTE: directory still named "communicators" (legacy)
│   ├── broker.ts                # Broker class (wraps driver + name + isDefault)
│   ├── broker-registry.ts       # BrokerRegistry singleton + MissingBrokerError
│   └── index.ts
├── drivers/
│   └── rabbitmq/
│       ├── rabbitmq-driver.ts   # RabbitMQDriver implements BrokerDriverContract
│       ├── rabbitmq-channel.ts  # RabbitMQChannel implements ChannelContract
│       └── index.ts
├── message-managers/
│   ├── event-message.ts         # EventMessage base class + defineEvent() factory
│   ├── event-consumer.ts        # EventConsumer base class + defineConsumer() factory
│   ├── prepare-consumer-subscription.ts  # Bridges EventConsumer → MessageHandler
│   ├── types.ts                 # ConsumedEventMessage, EventConsumerClass
│   └── index.ts
├── decorators/
│   ├── consumable.ts            # @Consumable() decorator + pendingSubscribers queue
│   └── index.ts
└── utils/
    ├── connect-to-broker.ts     # connectToBroker(), herald(), heraldChannel(), publishEvent(), subscribeConsumer()
    └── index.ts
```

---

## Architecture — How The Pieces Fit

```
User code
  │
  ├─ connectToBroker(options)     ← creates driver + Broker, registers in BrokerRegistry
  │
  ├─ herald()                     ← returns Broker from BrokerRegistry.get()
  │     │
  │     ├─ .channel("name")       ← returns ChannelContract (lazy-created, cached per Broker)
  │     │     ├─ .publish()
  │     │     ├─ .subscribe()
  │     │     └─ .stopConsuming()
  │     │
  │     ├─ .subscribe(Consumer)   ← uses prepareConsumerSubscription to bridge
  │     └─ .publish(EventMessage) ← delegates to driver.publish()
  │
  └─ @Consumable()                ← defers subscription until "connected" event fires
        │
        └─ brokerRegistry.on("connected", ...)
```

### Key design decisions

1. **Registry pattern** — `BrokerRegistry` is a singleton that holds all named brokers. `herald()` is a convenience accessor that calls `brokerRegistry.get()`.

2. **Lazy channel creation** — Calling `broker.channel("x")` creates and caches a `RabbitMQChannel`. Subsequent calls return the same instance. This is why `publish()` must use `this.channel()` and never look up the Map directly.

3. **Dynamic driver imports** — `connectToBroker()` uses `await import(...)` to load `RabbitMQDriver` on demand. This avoids requiring `amqplib` for users who don't use RabbitMQ.

4. **Error propagation via events** — Consumer errors are emitted as `"error"` events on the driver (not logged to console). The `prepareConsumerSubscription` function accepts an `onError` callback for this.

5. **Boot-order handling** — `@Consumable()` stores pending consumers and subscribes them when `brokerRegistry.on("connected")` fires. This solves the race condition where consumer classes are imported before the broker connects.

6. **`consumerId` lazy static getter** — Each `EventConsumer` subclass gets a unique UUID generated on first access via a static getter. This avoids the old collision bug where all subclasses shared the base class's UUID.

---

## Conventions When Modifying Code

### Do

- Use driver event emitter for errors — never `console.log/error/warn`
- Add new types to the appropriate file under `types/` — don't dump everything in one file
- Add `stopConsuming()` to any new channel implementation — it's part of `ChannelContract`
- Use `this.channel()` inside drivers for channel access — never access the channels Map directly
- Test with `yarn tsc` after every change

### Don't

- Don't add `console.*` calls anywhere in the package
- Don't create eager static fields on `EventConsumer` subclasses — use lazy getters
- Don't use optional chaining on channel lookups in publish paths — it causes silent drops
- Don't import `amqplib` or `kafkajs` at the top level — always use dynamic `import()`

---

## Adding a New Driver (e.g. Kafka)

### Step 1 — Create the driver class

File: `src/drivers/kafka/kafka-driver.ts`

Must implement `BrokerDriverContract`:

```typescript
import type { BrokerDriverContract } from "../../contracts";

export class KafkaDriver implements BrokerDriverContract {
  readonly name = "kafka" as const;
  // Implement all methods from BrokerDriverContract
}
```

Required methods (from `BrokerDriverContract`):
- `connect()` / `disconnect()` — lifecycle
- `on()` / `off()` — event listeners (`connected`, `disconnected`, `error`, `reconnecting`)
- `subscribe(Consumer)` / `unsubscribe(Consumer)` — EventConsumer registration
- `publish(event)` — must use `this.channel()` for auto-creation
- `channel(name, options?)` — lazy-create and cache `KafkaChannel` instances
- `startConsuming()` / `stopConsuming()` — batch lifecycle
- `healthCheck()` — returns `{ healthy, latency?, error? }`
- `getChannelNames()` / `closeChannel(name)` — channel management

### Step 2 — Create the channel class

File: `src/drivers/kafka/kafka-channel.ts`

Must implement `ChannelContract<TPayload>`:

```typescript
import type { ChannelContract } from "../../contracts";

export class KafkaChannel<TPayload> implements ChannelContract<TPayload> {
  // Implement all methods from ChannelContract
}
```

Required methods:
- `publish()` / `publishBatch()` — message sending
- `subscribe()` — returns `Subscription` with `unsubscribe()`
- `unsubscribeById()` — cancel specific consumer
- `request()` / `respond()` — RPC pattern
- `stats()` / `purge()` / `exists()` / `delete()` / `assert()` — channel management
- `stopConsuming()` — cancel all subscriptions gracefully

### Step 3 — Register the driver

1. Export from `src/drivers/kafka/index.ts`
2. Add to `src/drivers/index.ts`
3. Add `"kafka"` to `BrokerDriverType` union in `types/driver.types.ts`
4. Add a `case "kafka":` block in `connect-to-broker.ts` (use dynamic import like RabbitMQ does)

### Step 4 — Verify

```bash
yarn tsc  # must pass with zero errors
```

---

## Debugging Tips

- `brokerRegistry.getAll()` — list all registered brokers
- `broker.driver.getChannelNames()` — list cached channels
- `broker.driver.on("error", console.error)` — catch consumer errors (in app code only)
- Check `pendingSubscribers` set (exported from `decorators/consumable.ts`) — are consumers stuck waiting?
