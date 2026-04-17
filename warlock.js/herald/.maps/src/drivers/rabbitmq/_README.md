# drivers/rabbitmq

created: 2026-04-17 04:56:56 AM
updated: 2026-04-17 04:56:56 AM

> RabbitMQ/AMQP driver implementation for Herald, backed by a lazy-loaded `amqplib` client.

## What lives here

- `rabbitmq-driver.ts` — `RabbitMQDriver` class implementing `BrokerDriverContract`; owns the AMQP connection, caches channels, and manages consumer replay and reconnection.
- `rabbitmq-channel.ts` — `RabbitMQChannel<TPayload>` class implementing `ChannelContract<TPayload>`; wraps a queue with publish, subscribe, RPC request/respond, and lifecycle helpers. Also defines the internal `RabbitMQSubscription` type.
- `index.ts` — barrel file re-exporting `./rabbitmq-driver` and `./rabbitmq-channel`.

## Public API

### RabbitMQDriver  (implements `BrokerDriverContract`)

Fields:
- `readonly name: "rabbitmq"`
- `readonly consumers: EventConsumerClass[]`

Methods:
- `constructor(options: RabbitMQConnectionOptions)`
- `get isConnected(): boolean`
- `subscribe(Consumer: EventConsumerClass): () => void`
- `unsubscribe(Consumer: EventConsumerClass): void`
- `publish<TPayload>(event: EventMessage<TPayload>): void`
- `async connect(): Promise<void>`
- `async disconnect(): Promise<void>`
- `on(event: BrokerEvent, listener: BrokerEventListener): void`
- `off(event: BrokerEvent, listener: BrokerEventListener): void`
- `channel<TPayload>(name: string, options?: ChannelOptions<TPayload>): ChannelContract<TPayload>`
- `async startConsuming(): Promise<void>`
- `async stopConsuming(): Promise<void>`
- `async healthCheck(): Promise<HealthCheckResult>`
- `getChannelNames(): string[]`
- `async closeChannel(name: string): Promise<void>`
- `getRawChannel(): any`  (escape hatch — outside the contract)
- `getRawConnection(): any`  (escape hatch — outside the contract)

### RabbitMQChannel<TPayload>  (implements `ChannelContract<TPayload>`)

Fields:
- `public readonly name: string`
- `public readonly options: ChannelOptions<TPayload>`

Methods:
- `public constructor(name: string, amqpChannel: any, options?: ChannelOptions<TPayload>): void`
- `public async assert(): Promise<void>`
- `public async publish(payload: TPayload, options?: PublishOptions): Promise<void>`
- `public async publishBatch(messages: TPayload[], options?: PublishOptions): Promise<void>`
- `public async subscribe(handler: MessageHandler<TPayload>, options?: SubscribeOptions): Promise<Subscription>`
- `public async unsubscribeById(consumerId: string): Promise<void>`
- `public async stopConsuming(): Promise<void>`
- `public async request<TResponse>(payload: TPayload, options?: RequestOptions): Promise<TResponse>`
- `public async respond<TResponse>(handler: ResponseHandler<TPayload, TResponse>): Promise<Subscription>`
- `public async stats(): Promise<ChannelStats>`
- `public async purge(): Promise<number>`
- `public async exists(): Promise<boolean>`
- `public async delete(): Promise<void>`

## How it fits together

`RabbitMQDriver` implements `BrokerDriverContract` and is the AMQP-specific implementation selected when the broker configuration uses `driver: "rabbitmq"`. It is instantiated by `connectToBroker` in `utils/` (which loads the driver based on `RabbitMQConnectionOptions`) and is then wrapped by the `broker` facade exposed from `communicators/`. Every queue handle is a `RabbitMQChannel<TPayload>` implementing `ChannelContract<TPayload>`; the driver lazily creates and caches one per channel name via `channel(name, options?)`. The driver also owns reconnection, consumer replay (stored in `consumers` until `connect()` completes), and event fan-out through an internal `EventEmitter` exposed via `on` / `off`.

## Working examples

```typescript
// Connecting via RabbitMQ driver
import { connectToBroker } from '@warlock.js/herald';

const broker = await connectToBroker({
  driver: 'rabbitmq',
  url: 'amqp://localhost',
});
```

```typescript
// Publish and subscribe on a typed channel
import { connectToBroker } from '@warlock.js/herald';

type UserCreated = { id: string; email: string };

const broker = await connectToBroker({
  driver: 'rabbitmq',
  host: 'localhost',
  port: 5672,
  username: 'guest',
  password: 'guest',
});

const channel = broker.channel<UserCreated>('user.created');

await channel.subscribe(async (message, ctx) => {
  console.log('received', message.payload);
  await ctx.ack();
});

await channel.publish({ id: 'u_1', email: 'jane@example.com' });
```

```typescript
// RPC request/respond pattern
import { connectToBroker } from '@warlock.js/herald';

const broker = await connectToBroker({
  driver: 'rabbitmq',
  uri: 'amqp://guest:guest@localhost:5672/',
});

const rpc = broker.channel<{ a: number; b: number }>('math.add');

// Server side
await rpc.respond<number>(async (message) => {
  return message.payload.a + message.payload.b;
});

// Client side
const result = await rpc.request<number>({ a: 2, b: 3 }, { timeout: 5000 });
console.log(result); // 5
```

```typescript
// Health check and graceful shutdown
const health = await broker.healthCheck();
if (!health.healthy) {
  console.error('broker unhealthy:', health.error);
}

await broker.stopConsuming();
await broker.disconnect();
```

## DO NOT

- Do NOT import `amqplib` directly — `RabbitMQDriver` lazy-loads it internally and surfaces a guided install error if the package is missing.
- Do NOT call `new RabbitMQDriver(options)` directly in application code — obtain an instance via `connectToBroker({ driver: 'rabbitmq', ... })` so reconnection and consumer replay are wired correctly.
- Do NOT instantiate `RabbitMQChannel` directly — always retrieve channels through `broker.channel(name, options?)` so they are cached and share the underlying AMQP channel.
- Do NOT call `getRawChannel()` or `getRawConnection()` in normal code — these are escape hatches that bypass `BrokerDriverContract` and break portability across drivers.
- Do NOT call `resume()` on a RabbitMQ subscription — it always throws; cancel the subscription and create a new one instead.
- Do NOT call `publish`, `subscribe`, `request`, `stats`, `purge`, or `delete` before `connect()` has resolved — these rely on an established AMQP channel.
- Do NOT mix manual `ack` / `nack` / `reject` calls with auto-ack handling without tracking state — the channel's smart-ack only fires when the handler never calls any of the context methods.
- Do NOT rely on `startConsuming()` to start consumers — consumption begins when `subscribe()` is called; `startConsuming()` is a no-op retained for contract parity.

## Internal (not for docs)

- `RabbitMQSubscription` — internal class (not exported from the module barrel) implementing `Subscription`. Tracks one consumer tag per subscription with `id`, `channel`, `consumerTag`, `_isActive`, and exposes `unsubscribe()`, `pause()` (implemented as cancel), `resume()` (always throws), and `isActive()`.
- `amqplibModule` / `isModuleExists` / `loadAmqplibModule()` — module-level lazy loader state in `rabbitmq-driver.ts`; eagerly kicked off at import time and awaited in `connect()`.
- `AMQPLIB_INSTALL_INSTRUCTIONS` — internal error message template shown when `amqplib` is not installed.
- `buildConnectionUrl()` / `handleReconnect()` / `sendToDeadLetter()` — private helpers not part of the public contract.
