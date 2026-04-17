# utils

created: 2026-04-17 04:56:56 AM
updated: 2026-04-17 04:56:56 AM

> User-facing connection and convenience functions that simplify broker setup and message publishing/subscription without direct access to internal communicators and registries.

## What lives here

- `connect-to-broker.ts` — Driver selection, broker registration, and five convenience functions for message broker interaction (connectToBroker, herald, heraldChannel, publishEvent, subscribeConsumer)
- `index.ts` — Re-exports all public API functions from connect-to-broker

## Public API

- `connectToBroker(options: ConnectionOptions): Promise<Broker>` — Create and register message broker connection
- `herald(name?: string): Broker` — Get broker by name or default instance
- `heraldChannel(name: string, options?: ChannelOptions): ChannelContract` — Get channel from default broker
- `publishEvent(event: EventMessage): Promise<void>` — Publish event message to default broker
- `subscribeConsumer(Consumer: EventConsumerClass): Promise<() => void>` — Subscribe consumer class to default broker

## How it fits together

The utils layer is the user-facing entry point for Herald; applications should interact with the package exclusively through these five functions. Internally, these functions delegate to the Broker and brokerRegistry from the communicators layer, the ChannelContract from contracts, EventMessage and EventConsumerClass from message-managers, and ConnectionOptions/ChannelOptions from types. This abstraction shields users from low-level registry and driver details.

## Working examples

```typescript
// Connect to RabbitMQ
import { connectToBroker } from '@warlock.js/herald';

const broker = await connectToBroker({
  driver: 'rabbitmq',
  host: 'localhost',
  port: 5672,
  username: 'guest',
  password: 'guest',
});
```

```typescript
// Publish an event using EventMessage
import { publishEvent } from '@warlock.js/herald';

class UserCreatedEvent extends EventMessage {
  channel = 'user.created';
  payload: { userId: number };
}

await publishEvent(new UserCreatedEvent({ userId: 123 }));
```

```typescript
// Get a channel and publish directly
import { heraldChannel } from '@warlock.js/herald';

const channel = heraldChannel('order.placed');
await channel.publish({ orderId: 456, amount: 99.99 });
```

```typescript
// Subscribe a consumer class
import { subscribeConsumer } from '@warlock.js/herald';

class OrderPlacedConsumer extends EventConsumer {
  channel = 'order.placed';
  async handle(message, ctx) {
    console.log('Order placed:', message.payload);
    await ctx.ack();
  }
}

await subscribeConsumer(OrderPlacedConsumer);
```

```typescript
// Register multiple brokers and use by name
import { connectToBroker, herald } from '@warlock.js/herald';

await connectToBroker({
  driver: 'rabbitmq',
  name: 'notifications',
  isDefault: true,
  host: 'rabbitmq1.local',
});

await connectToBroker({
  driver: 'rabbitmq',
  name: 'analytics',
  host: 'rabbitmq2.local',
});

// Use default broker
await herald().channel('notify').publish({ message: 'Hello' });

// Use specific broker
await herald('analytics').channel('events').publish({ event: 'signup' });
```

## DO NOT

- Do NOT import Broker or brokerRegistry directly from ../communicators — use connectToBroker() and herald() instead
- Do NOT call herald() before connectToBroker() — throws MissingBrokerError if no broker is registered
- Do NOT pass a plain object to publishEvent() — it must be an EventMessage instance with a channel and payload
- Do NOT omit await on connectToBroker() — it is async and must resolve before publishing or subscribing
- Do NOT use heraldChannel() or publishEvent() without first connecting a broker — they delegate to the default broker which may not exist
