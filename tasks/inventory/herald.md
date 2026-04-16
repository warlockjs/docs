# @warlock.js/herald — Inventory

## Package Info

- Version: 4.0.165
- Type: Standalone Package (Message Bus Utility)
- Dependencies: @warlock.js/logger, @warlock.js/seal

## Directory Tree

```
src/
├── communicators/
│   ├── communicator-registry.ts
│   ├── communicator.ts
│   └── index.ts
├── contracts/
│   ├── channel.contract.ts
│   ├── communicator-driver.contract.ts
│   └── index.ts
├── decorators/
│   ├── consumable.ts
│   └── index.ts
├── drivers/
│   ├── index.ts
│   └── rabbitmq/
│       ├── index.ts
│       ├── rabbitmq-channel.ts
│       └── rabbitmq-driver.ts
├── message-managers/
│   ├── event-consumer.ts
│   ├── event-message.ts
│   ├── index.ts
│   ├── prepare-consumer-subscription.ts
│   └── types.ts
├── utils/
│   ├── connect-to-communicator.ts
│   └── index.ts
├── index.ts
└── types.ts
```

## Exports by File

### src/index.ts
- **Barrel File**: Re-exports everything from `./types`, `./contracts`, `./communicators`, `./drivers`, `./utils`, `./message-managers`, and `./decorators`.
- **Purpose**: Main entry point for the `@warlock.js/herald` package.

### src/types.ts
- **Type** `MessageMetadata`
- **Type** `Message<TPayload = unknown>`
- **Type** `PublishOptions`
- **Type** `RetryOptions`
- **Type** `DeadLetterOptions`
- **Type** `SubscribeOptions`
- **Type** `RequestOptions`
- **Type** `MessageContext`
- **Type** `Subscription`
- **Type** `MessageHandler<TPayload = unknown>`
- **Type** `ResponseHandler<TPayload = unknown, TResponse = unknown>`
- **Type** `ChannelOptions<TPayload = unknown>`
- **Type** `ChannelStats`
- **Type** `CommunicatorDriverType`
- **Type** `CommunicatorEvent`
- **Type** `CommunicatorEventListener`
- **Type** `HealthCheckResult`
- **Type** `BaseConnectionOptions`
- **Type** `RabbitMQSocketOptions`
- **Type** `RabbitMQClientOptions`
- **Type** `RabbitMQConnectionOptions<TClientOptions extends RabbitMQClientOptions = RabbitMQClientOptions>`
- **Type** `KafkaClientOptions`
- **Type** `KafkaConnectionOptions<TClientOptions extends KafkaClientOptions = KafkaClientOptions>`
- **Type** `ConnectionOptions`
- **Type** `CommunicatorConfigurations<TClientOptions = any>`
- **Type** `CommunicatorRegistryEvent`
- **Type** `CommunicatorRegistryListener`
- **Purpose**: Centralized type definitions for message structures, options, and communicator configurations.

### src/contracts/channel.contract.ts
- **Interface** `ChannelContract<TPayload = unknown>`
- **Purpose**: Defines the contract for interacting with a specific message channel (publish, subscribe, RPC).

### src/contracts/communicator-driver.contract.ts
- **Interface** `CommunicatorDriverContract`
- **Purpose**: Defines the contract for communicator drivers (RabbitMQ, Kafka, etc.) to implement.

### src/contracts/index.ts
- **Barrel File**: Re-exports from `./channel.contract` and `./communicator-driver.contract`.
- **Purpose**: Centralized access to communicator contracts.

### src/communicators/communicator.ts
- **Class** `Communicator`
- **Purpose**: Wrapper around a driver that provides a high-level API for channel management and connection control.

### src/communicators/communicator-registry.ts
- **Class** `CommunicatorRegistry`
- **Constant** `communicatorRegistry: CommunicatorRegistry`
- **Purpose**: Manages multiple communicator instances and allows setting a default one.

### src/communicators/index.ts
- **Barrel File**: Re-exports from `./communicator` and `./communicator-registry`.
- **Purpose**: Centralized access to communicators.

### src/decorators/consumable.ts
- **Decorator** `@Consumable(options?: SubscribeOptions)`
- **Purpose**: Registers an event consumer with a communicator and automatically subscribes it when the communicator is connected.

### src/decorators/index.ts
- **Barrel File**: Re-exports from `./consumable`.
- **Purpose**: Centralized access to decorators.

### src/drivers/rabbitmq/rabbitmq-driver.ts
- **Class** `RabbitMQDriver` implements `CommunicatorDriverContract`
- **Purpose**: Implementation of the communicator driver for RabbitMQ using `amqplib`.

### src/drivers/rabbitmq/rabbitmq-channel.ts
- **Class** `RabbitMQChannel<TPayload = unknown>` implements `ChannelContract<TPayload>`
- **Purpose**: Implementation of the channel contract for RabbitMQ, handling queues, topics, and message flow.

### src/drivers/rabbitmq/index.ts
- **Barrel File**: Re-exports from `./rabbitmq-driver` and `./rabbitmq-channel`.
- **Purpose**: Centralized access to RabbitMQ driver.

### src/drivers/index.ts
- **Barrel File**: Re-exports from `./rabbitmq`.
- **Purpose**: Centralized access to all available communicator drivers.

### src/message-managers/event-consumer.ts
- **Class** `EventConsumer<Payload = Record<string, any>>`
- **Function** `defineConsumer<Payload = Record<string, any>>(eventName: string, options: ConsumerOptions<Payload>): EventConsumerClass`
- **Purpose**: Base class and utility for defining message consumers that process specific events.

### src/message-managers/event-message.ts
- **Class** `EventMessage<TPayload = unknown>`
- **Function** `defineEvent<IncomingData = unknown, OutcomingData = unknown>(eventName: string, options?: EventOptions<IncomingData>): EventMessageClass`
- **Purpose**: Base class and utility for defining structured event messages with payload transformation.

### src/message-managers/prepare-consumer-subscription.ts
- **Function** `prepareConsumerSubscription(Consumer: EventConsumerClass): void`
- **Purpose**: Internal helper to prepare and register a consumer subscription with its communicator.

### src/message-managers/types.ts
- **Type** `ConsumedEventMessage`
- **Type** `EventConsumerClass<P = Record<string, any>>`
- **Type** `ConsumerOptions<Payload>`
- **Type** `EventOptions<IncomingData>`
- **Purpose**: Type definitions for event-based messaging and consumer management.

### src/message-managers/index.ts
- **Barrel File**: Re-exports from `./event-consumer`, `./event-message`, and `./types`.
- **Purpose**: Centralized access to message management utilities.

### src/utils/connect-to-communicator.ts
- **Function** `connectToCommunicator(options: ConnectionOptions): Promise<CommunicatorDriverContract>`
- **Function** `communicators(name?: string): Communicator`
- **Function** `communicatorChannel<TPayload = unknown>(name: string, options?: ChannelOptions<TPayload>, communicatorName?: string): ChannelContract<TPayload>`
- **Function** `publishEvent<TPayload = Record<string, any>>(event: EventMessage<TPayload>): Promise<void>`
- **Function** `subscribeConsumer<TPayload = Record<string, any>>(Consumer: EventConsumerClass<TPayload>): Promise<() => void>`
- **Purpose**: High-level utility functions for connecting to brokers, accessing communicators, and managing event flow.

### src/utils/index.ts
- **Barrel File**: Re-exports from `./connect-to-communicator`.
- **Purpose**: Centralized access to communicator utilities.

