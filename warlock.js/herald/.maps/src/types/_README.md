# types

created: 2026-04-17 04:56:56 AM
updated: 2026-04-17 04:56:56 AM

> Shared TypeScript type definitions for Herald's broker, channel, message, and connection configurations.

## What lives here

- **channel.types.ts** — Channel configuration options and runtime statistics for queues and topics
- **connection.types.ts** — Connection configuration for RabbitMQ and Kafka brokers with socket and authentication options
- **driver.types.ts** — Broker driver types, lifecycle events, and health check response shapes
- **message.types.ts** — Message wrappers, metadata, message context, and message handler function signatures
- **publish.types.ts** — Message publishing and request-reply pattern options
- **registry.types.ts** — Broker registry events and registration listener callbacks
- **subscribe.types.ts** — Subscription configuration including retry, dead-letter queue, and consumer options

## Public API — grouped by file

### channel.types.ts

- **ChannelOptions\<TPayload = unknown\>** — Broker channel configuration options
  - `type?: "queue" | "topic" | "fanout"`
  - `durable?: boolean`
  - `autoDelete?: boolean`
  - `exclusive?: boolean`
  - `deadLetter?: DeadLetterOptions`
  - `maxMessageSize?: number`
  - `messageTtl?: number`
  - `maxLength?: number`
  - `schema?: BaseValidator`

- **ChannelStats** — Channel runtime statistics
  - `messageCount: number`
  - `consumerCount: number`
  - `name: string`

### connection.types.ts

- **BaseConnectionOptions** — Base connection metadata
  - `name?: string`
  - `isDefault?: boolean`

- **RabbitMQSocketOptions** — Socket-level security settings
  - `keepAlive?: boolean | number`
  - `noDelay?: boolean`
  - `timeout?: number`
  - `ca?: string | Buffer | Array<string | Buffer>`
  - `cert?: string | Buffer`
  - `key?: string | Buffer`
  - `passphrase?: string`
  - `servername?: string`
  - `rejectUnauthorized?: boolean`

- **RabbitMQClientOptions** — RabbitMQ protocol options
  - `frameMax?: number`
  - `channelMax?: number`
  - `locale?: string`
  - `socket?: RabbitMQSocketOptions`

- **RabbitMQConnectionOptions\<TClientOptions extends RabbitMQClientOptions = RabbitMQClientOptions\>** — Full RabbitMQ configuration
  - `driver: "rabbitmq"` (literal)
  - `host?: string`
  - `port?: number`
  - `username?: string`
  - `password?: string`
  - `vhost?: string`
  - `uri?: string`
  - `heartbeat?: number`
  - `connectionTimeout?: number`
  - `reconnect?: boolean`
  - `reconnectDelay?: number`
  - `prefetch?: number`
  - `clientOptions?: TClientOptions`
  - *Extends:* `BaseConnectionOptions`

- **KafkaClientOptions** — Kafka library options
  - `retry?: { initialRetryTime?, retries?, maxRetryTime?, factor?, multiplier? }`
  - `logLevel?: number`
  - `logCreator?: any`

- **KafkaConnectionOptions\<TClientOptions extends KafkaClientOptions = KafkaClientOptions\>** — Full Kafka configuration
  - `driver: "kafka"` (literal)
  - `brokers: string[]`
  - `clientId?: string`
  - `connectionTimeout?: number`
  - `requestTimeout?: number`
  - `ssl?: boolean | object`
  - `sasl?: { mechanism, username, password }`
  - `clientOptions?: TClientOptions`
  - *Extends:* `BaseConnectionOptions`

- **ConnectionOptions** — Driver-agnostic connection config
  - Union: `RabbitMQConnectionOptions | KafkaConnectionOptions`

- **BrokerConfigurations\<TClientOptions = any\>** — Generic broker configuration supporting conditional client options
  - Conditional union of RabbitMQ or Kafka configurations

### driver.types.ts

- **BrokerDriverType** — Supported broker driver names
  - Union: `"rabbitmq" | "kafka" | "redis-streams" | "sqs"`

- **BrokerEvent** — Broker lifecycle events
  - Union: `"connected" | "disconnected" | "error" | "reconnecting"`

- **BrokerEventListener** — Event handler callback signature
  - `(...args: unknown[]) => void`

- **HealthCheckResult** — Broker health status information
  - `healthy: boolean`
  - `latency?: number`
  - `error?: string`
  - `details?: Record<string, unknown>`

### message.types.ts

- **MessageMetadata** — Message identification and routing metadata
  - `messageId: string`
  - `correlationId?: string`
  - `replyTo?: string`
  - `priority?: number`
  - `timestamp: Date`
  - `headers?: Record<string, string>`
  - `retryCount?: number`
  - `originalChannel?: string`

- **Message\<TPayload = unknown\>** — Wrapper containing metadata and payload
  - `readonly metadata: MessageMetadata`
  - `readonly payload: TPayload`
  - `readonly raw?: unknown`

- **MessageContext** — Message processing control and responses
  - `ack(): Promise<void>`
  - `nack(requeue?: boolean): Promise<void>`
  - `reject(): Promise<void>`
  - `reply<T>(payload: T): Promise<void>`
  - `retry(delay?: number): Promise<void>`

- **Subscription** — Subscription lifecycle management interface
  - `readonly id: string`
  - `readonly channel: string`
  - `readonly consumerTag?: string`
  - `unsubscribe(): Promise<void>`
  - `pause(): Promise<void>`
  - `resume(): Promise<void>`
  - `isActive(): boolean`

- **MessageHandler\<TPayload = unknown\>** — Message processing callback function
  - `(message: Message<TPayload>, ctx: MessageContext) => Promise<void> | void`

- **ResponseHandler\<TPayload = unknown, TResponse = unknown\>** — Request-reply callback function
  - `(message: Message<TPayload>, ctx: MessageContext) => Promise<TResponse> | TResponse`

### publish.types.ts

- **PublishOptions** — Message publishing configuration options
  - `priority?: number`
  - `ttl?: number`
  - `delay?: number`
  - `headers?: Record<string, string>`
  - `persistent?: boolean`
  - `correlationId?: string`
  - `expiration?: number`

- **RequestOptions** — Request-reply pattern with timeout
  - *Extends:* `PublishOptions`
  - `timeout?: number`

### registry.types.ts

- **BrokerRegistryEvent** — Union type for broker lifecycle
  - Union: `"registered" | "default-registered" | "connected" | "disconnected"`

- **BrokerRegistryListener** — Function type for registry listeners
  - `(broker: Broker) => void`

### subscribe.types.ts

- **RetryOptions** — Maximum retry attempts and delay strategy
  - `maxRetries: number`
  - `delay: number | ((attempt: number) => number)`

- **DeadLetterOptions** — Dead letter queue destination settings
  - `channel: string`
  - `preserveOriginal?: boolean`

- **SubscribeOptions** — Message subscription configuration options
  - `consumerId?: string`
  - `group?: string`
  - `prefetch?: number`
  - `autoAck?: boolean`
  - `retry?: RetryOptions`
  - `deadLetter?: DeadLetterOptions`
  - `exclusive?: boolean`

## How it fits together

Types are the foundation of Herald—they define the contract for all broker interactions. These type definitions are imported and used by driver implementations, connection managers, message processors, and subscription handlers throughout the codebase. No runtime logic lives in this folder; all files are type-only exports that enable compile-time safety across the pub/sub and request-reply patterns.

## Common type usage

```typescript
// ChannelOptions — configuring a channel before subscription
const channelConfig: ChannelOptions<{ userId: string }> = {
  type: "queue",
  durable: true,
  schema: userIdValidator,
  deadLetter: {
    channel: "user-dlq",
    preserveOriginal: true,
  },
};
```

```typescript
// RabbitMQConnectionOptions — establishing a broker connection
const rabbitConfig: RabbitMQConnectionOptions = {
  driver: "rabbitmq",
  host: "localhost",
  port: 5672,
  username: "guest",
  password: "guest",
  vhost: "/",
  prefetch: 10,
  clientOptions: {
    frameMax: 131072,
    channelMax: 2048,
  },
};
```

```typescript
// MessageHandler — consuming and acknowledging messages
const handler: MessageHandler<{ orderId: string }> = async (message, ctx) => {
  console.log(`Processing order: ${message.payload.orderId}`);
  await ctx.ack();
};
```

```typescript
// PublishOptions and RequestOptions — sending and request-reply
const publishOpts: PublishOptions = {
  priority: 5,
  persistent: true,
  correlationId: "order-123",
};

const requestOpts: RequestOptions = {
  ...publishOpts,
  timeout: 5000,
};
```

## DO NOT

- Do NOT import types from individual files — always import from `@warlock.js/herald` or the barrel export `src/types/index.ts`
- Do NOT add runtime logic to type files — they are type-only and must not export runtime code
- Do NOT confuse `ChannelOptions.type` values: only `"queue"`, `"topic"`, or `"fanout"` are valid; `"rabbitmq"` and `"kafka"` are driver types, not channel types
- Do NOT extend `ConnectionOptions` directly in driver implementations — use `RabbitMQConnectionOptions<TClientOptions>` or `KafkaConnectionOptions<TClientOptions>` with proper generics
- Do NOT forget the optional `schema?: BaseValidator` field in `ChannelOptions` when payload validation is needed
- Do NOT use `MessageHandler` or `ResponseHandler` without properly typing the `TPayload` and `TResponse` generics for type safety
