# Herald — src

created: 2026-04-17 04:56:56 AM
updated: 2026-04-17 04:56:56 AM

> The src folder contains the main public API and architectural layers of the Herald message bus library, re-exporting core types, contracts, brokers, drivers, utilities, message managers, and decorators to form a unified interface.

## Package structure

- `communicators/` — Broker wrapper and registry singleton for managing named broker instances
- `contracts/` — Core interfaces defining the contracts for channel operations and broker driver implementations
- `decorators/` — Class decorator for automatically registering event consumers with brokers
- `drivers/` — Driver implementations (RabbitMQ) that implement the BrokerDriverContract
- `message-managers/` — EventMessage and EventConsumer classes for publishing and consuming messages
- `types/` — Centralized TypeScript type definitions for channels, connections, drivers, messages, and subscriptions

## Main entry-point exports

From `src/index.ts`, the following symbols are exported:

- `Broker` — Named driver wrapper with lifecycle methods (from `communicators/broker.ts`)
- `BrokerOptions` — Configuration interface for broker constructor (from `communicators/broker.ts`)
- `BrokerRegistry` — Registry managing named broker instances (from `communicators/broker-registry.ts`)
- `MissingBrokerError` — Error class thrown when broker is not found (from `communicators/broker-registry.ts`)
- `brokerRegistry` — Global singleton BrokerRegistry instance (from `communicators/broker-registry.ts`)
- `ChannelContract` — Interface defining channel publishing and subscribing operations (from `contracts/channel.contract.ts`)
- `BrokerDriverContract` — Interface defining broker driver requirements (from `contracts/broker-driver.contract.ts`)
- `Consumable` — Class decorator for registering event consumers (from `decorators/consumable.ts`)
- `ConsumableOptions` — Configuration type for the Consumable decorator (from `decorators/consumable.ts`)
- `RabbitMQDriver` — RabbitMQ implementation of BrokerDriverContract (from `drivers/rabbitmq/`)
- `EventMessage` — Wrapper for message payloads with metadata (from `message-managers/event-message.ts`)
- `EventConsumer` — Base class for defining event handlers (from `message-managers/event-consumer.ts`)
- `connectToBroker` — Utility to create, configure, and register a broker connection (from `utils/connect-to-broker.ts`)
- `herald` — Retrieve broker instance by name or get the default broker (from `utils/connect-to-broker.ts`)
- `heraldChannel` — Get a channel from the default broker (from `utils/connect-to-broker.ts`)
- `publishEvent` — Publish an EventMessage to the default broker (from `utils/connect-to-broker.ts`)
- `subscribeConsumer` — Subscribe an EventConsumer class to the default broker (from `utils/connect-to-broker.ts`)
- Multiple TypeScript types from `types/` including ChannelOptions, ConnectionOptions, RabbitMQConnectionOptions, and others

## Typical usage flow

First, connect to a message broker using `connectToBroker()` with driver and connection options to establish and register the broker. Then, use `herald()` to access the default broker instance, call `.channel()` to get a named channel, and either publish events via `.publish()` or subscribe using `.subscribe()` with an EventConsumer class. Finally, call `.disconnect()` when shutting down to gracefully close the connection.

## Working examples

```typescript
// Example 1: Basic connection and publish
import { connectToBroker, herald } from '@warlock.js/herald';

await connectToBroker({
  driver: 'rabbitmq',
  host: 'localhost',
  port: 5672,
});

const broker = herald();
const channel = broker.channel('user.created');
await channel.publish({ userId: 123, email: 'user@example.com' });
```

```typescript
// Example 2: Subscribe with EventConsumer class
import { herald, EventConsumer } from '@warlock.js/herald';

class UserCreatedConsumer extends EventConsumer {
  public channel = 'user.created';

  public async handle(payload: any, context: any) {
    console.log('New user:', payload.userId);
    await context.ack();
  }
}

const broker = herald();
await broker.subscribe(UserCreatedConsumer);
```

```typescript
// Example 3: Using the Consumable decorator
import { Consumable, connectToBroker } from '@warlock.js/herald';

@Consumable({ broker: 'default' })
class OrderProcessedConsumer extends EventConsumer {
  public channel = 'order.processed';

  public async handle(payload: any, context: any) {
    console.log('Order processed:', payload.orderId);
    await context.ack();
  }
}

await connectToBroker({ driver: 'rabbitmq', host: 'localhost' });
// OrderProcessedConsumer is automatically subscribed
```

## DO NOT

- Do NOT call methods on `Broker` or `ChannelContract` before calling `connectToBroker()` and `await broker.connect()` — the driver must be connected before operations.
- Do NOT import directly from subfolders like `src/communicators/broker` in application code — always import from the barrel exports (`src/communicators` or `src/index.ts`) to maintain stable public API boundaries.
- Do NOT assume broker instances are connected by default — always check `broker.isConnected` or explicitly await `broker.connect()` before publishing or subscribing.
- Do NOT mix EventConsumer subclasses and raw functions for the same channel — always use the EventConsumer class pattern with the `handle()` method to ensure consistent error handling, acknowledgment, and lifecycle management across all message consumers.
- Do NOT register multiple brokers with the same name — `brokerRegistry.register()` will overwrite the existing broker with that name; use `brokerRegistry.has(name)` to check first if needed.
