# rabbitmq-driver
source: src/drivers/rabbitmq/rabbitmq-driver.ts
description: Implements BrokerDriverContract for RabbitMQ/AMQP using lazy-loaded amqplib.
complexity: complex
first-mapped: 2026-04-17 04:25:18 AM
last-mapped: 2026-04-17 04:25:18 AM

## Imports
- `EventEmitter` from `node:events`
- `BrokerDriverContract`, `ChannelContract` from `../../contracts`
- `EventMessage` from `../../message-managers/event-message`
- `EventConsumerClass` from `../../message-managers/types`
- `BrokerDriverType`, `BrokerEvent`, `BrokerEventListener`, `ChannelOptions`, `HealthCheckResult`, `RabbitMQConnectionOptions` from `../../types`
- `prepareConsumerSubscription` from `../../message-managers/prepare-consumer-subscription`
- `RabbitMQChannel` from `./rabbitmq-channel`

## Exports
- `RabbitMQDriver` — RabbitMQ broker driver implementation class  [lines 87-420]

## Classes

### RabbitMQDriver  [lines 87-420] — AMQP broker driver, BrokerDriverContract impl
extends: none
implements: BrokerDriverContract

fields:
- `readonly name: "rabbitmq"` [line 88]
- `readonly consumers: EventConsumerClass[]` [line 90]
- `private readonly options: RabbitMQConnectionOptions` [line 92]
- `private readonly events: EventEmitter` [line 93]
- `private readonly channels: Map<string, ChannelContract<any>>` [line 94]
- `private connection: any` [line 96]
- `private amqpChannel: any` [line 97]
- `private _isConnected: boolean` [line 98]

methods:
- `constructor(options: RabbitMQConnectionOptions)` [lines 105-107]
- `get isConnected(): boolean` [lines 112-114]
- `subscribe(Consumer: EventConsumerClass): () => void` [lines 126-143] — registers consumer or defers until connected
  - side-effects: pushes to `consumers`, subscribes channel, emits errors
- `unsubscribe(Consumer: EventConsumerClass): void` [lines 148-156] — removes consumer from channel and list
  - side-effects: calls `channel.unsubscribeById`, splices `consumers`
- `publish<TPayload>(event: EventMessage<TPayload>): void` [lines 162-164] — publishes event to its channel
  - side-effects: writes to AMQP channel
- `async connect(): Promise<void>` [lines 169-235] — connects to RabbitMQ, replays consumers
  - throws: `Error` — amqplib missing or connection failure
  - side-effects: sets `connection`, `amqpChannel`, `_isConnected`, emits `connected`
- `async disconnect(): Promise<void>` [lines 281-302] — closes channel and connection
  - side-effects: nulls `amqpChannel`, `connection`, emits `disconnected`
- `on(event: BrokerEvent, listener: BrokerEventListener): void` [lines 307-309]
- `off(event: BrokerEvent, listener: BrokerEventListener): void` [lines 314-316]
- `channel<TPayload>(name: string, options?: ChannelOptions<TPayload>): ChannelContract<TPayload>` [lines 321-336] — gets or creates named channel
  - side-effects: caches new `RabbitMQChannel` in `channels`
- `async startConsuming(): Promise<void>` [lines 341-344]
- `async stopConsuming(): Promise<void>` [lines 350-355] — stops all channel consumers
  - side-effects: calls `stopConsuming` on every cached channel
- `async healthCheck(): Promise<HealthCheckResult>` [lines 360-387] — verifies connection liveness
  - throws: `Error` — propagated as unhealthy result
- `getChannelNames(): string[]` [lines 392-394]
- `async closeChannel(name: string): Promise<void>` [lines 399-405] — deletes and removes named channel
  - side-effects: calls `channel.delete`, removes from `channels`
- `getRawChannel(): any` [lines 410-412] — extra-contract; exposes raw amqplib channel
- `getRawConnection(): any` [lines 417-419] — extra-contract; exposes raw amqplib connection
