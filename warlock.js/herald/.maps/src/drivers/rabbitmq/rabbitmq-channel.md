# rabbitmq-channel
source: src/drivers/rabbitmq/rabbitmq-channel.ts
description: Implements RabbitMQ queue channel and subscription with publish, subscribe, and RPC support.
complexity: complex
first-mapped: 2026-04-17 04:25:18 AM
last-mapped: 2026-04-17 04:25:18 AM

## Imports
- `v` from `@warlock.js/seal`
- `randomUUID` from `node:crypto`
- `ChannelContract` from `../../contracts`
- `ChannelOptions, ChannelStats, Message, MessageContext, MessageHandler, MessageMetadata, PublishOptions, RequestOptions, ResponseHandler, SubscribeOptions, Subscription` from `../../types`

## Exports
- `RabbitMQChannel` — generic RabbitMQ channel implementation class  [lines 25-473]

## Classes

### RabbitMQChannel  [lines 25-473] — RabbitMQ queue wrapper with unified channel API
extends: none
implements: ChannelContract<TPayload>

fields:
- `public readonly name: string`  [line 26]
- `public readonly options: ChannelOptions<TPayload>`  [line 27]
- `private readonly amqpChannel: any`  [line 29]
- `private readonly subscriptions: Map<string, RabbitMQSubscription>`  [line 30]
- `private asserted: boolean`  [line 31]

methods:
- `public constructor(name: string, amqpChannel: any, options?: ChannelOptions<TPayload>): void`  [lines 36-40]
- `public async assert(): Promise<void>`  [lines 45-60] — asserts queue exists once
  - side-effects: calls amqpChannel.assertQueue, sets asserted flag
- `public async publish(payload: TPayload, options?: PublishOptions): Promise<void>`  [lines 65-113] — validates and sends message to queue
  - throws: `Error` — when schema validation fails
  - side-effects: calls amqpChannel.sendToQueue
- `public async publishBatch(messages: TPayload[], options?: PublishOptions): Promise<void>`  [lines 118-122] — publishes array of messages sequentially
  - side-effects: calls publish for each message
- `public async subscribe(handler: MessageHandler<TPayload>, options?: SubscribeOptions): Promise<Subscription>`  [lines 132-308] — registers consumer with smart ack behavior
  - side-effects: calls amqpChannel.consume, stores subscription in map
- `public async unsubscribeById(consumerId: string): Promise<void>`  [lines 313-319] — cancels subscription by ID
  - side-effects: removes subscription from map
- `public async stopConsuming(): Promise<void>`  [lines 325-330] — cancels all active subscriptions
  - side-effects: calls unsubscribe on all subscriptions
- `public async request<TResponse>(payload: TPayload, options?: RequestOptions): Promise<TResponse>`  [lines 353-403] — sends RPC request and awaits reply
  - throws: `Error` — on timeout expiry
  - side-effects: creates exclusive reply queue, sends to amqpChannel
- `public async respond<TResponse>(handler: ResponseHandler<TPayload, TResponse>): Promise<Subscription>`  [lines 408-416] — registers RPC response handler
  - side-effects: calls subscribe internally
- `public async stats(): Promise<ChannelStats>`  [lines 421-431] — returns queue message and consumer counts
  - side-effects: calls amqpChannel.checkQueue
- `public async purge(): Promise<number>`  [lines 436-441] — purges queue, returns message count
  - side-effects: calls amqpChannel.purgeQueue
- `public async exists(): Promise<boolean>`  [lines 446-453] — checks if queue exists
- `public async delete(): Promise<void>`  [lines 458-472] — cancels subscriptions and deletes queue
  - side-effects: cancels all subscriptions, calls amqpChannel.deleteQueue

### RabbitMQSubscription  [lines 478-513] — (internal — not exported) tracks and manages single consumer subscription
extends: none
implements: Subscription

fields:
- `public readonly id: string`  [line 479]
- `public readonly channel: string`  [line 480]
- `public readonly consumerTag: string`  [line 481]
- `private readonly amqpChannel: any`  [line 483]
- `private _isActive: boolean`  [line 484]

methods:
- `public constructor(id: string, channel: string, consumerTag: string, amqpChannel: any): void`  [lines 486-491]
- `public async unsubscribe(): Promise<void>`  [lines 493-498] — cancels consumer tag if active
  - side-effects: calls amqpChannel.cancel, sets _isActive false
- `public async pause(): Promise<void>`  [lines 500-503] — cancels consumer as pause substitute
  - side-effects: calls amqpChannel.cancel
- `public async resume(): Promise<void>`  [lines 505-508] — always throws; resume unsupported
  - throws: `Error` — resume not supported in RabbitMQ
- `public isActive(): boolean`  [lines 510-512] — returns current active state
