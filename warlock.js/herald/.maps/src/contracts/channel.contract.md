# channel.contract
source: src/contracts/channel.contract.ts
description: Defines the ChannelContract interface providing a unified pub/sub API across message brokers.
complexity: medium
first-mapped: 2026-04-17 04:25:18 AM
last-mapped: 2026-04-17 04:25:18 AM

## Imports
- `ChannelOptions`, `ChannelStats`, `MessageHandler`, `PublishOptions`, `RequestOptions`, `ResponseHandler`, `SubscribeOptions`, `Subscription` from `../types`

## Exports
- `ChannelContract` — Generic interface for channel pub/sub operations  [lines 34-215]

## Classes / Interfaces / Types

### ChannelContract<TPayload = unknown>  [lines 34-215] — Unified channel interface across message brokers
- readonly `name: string`  [line 38] — Channel name or routing key
- readonly `options: ChannelOptions<TPayload>`  [line 43] — Channel configuration
- `publish(payload: TPayload, options?: PublishOptions): Promise<void>`  [line 63]
- `publishBatch(messages: TPayload[], options?: PublishOptions): Promise<void>`  [line 81]
- `subscribe(handler: MessageHandler<TPayload>, options?: SubscribeOptions): Promise<Subscription>`  [line 107]
- `unsubscribeById(consumerId: string): Promise<void>`  [line 119]
- `request<TResponse = unknown>(payload: TPayload, options?: RequestOptions): Promise<TResponse>`  [line 139] — RPC request-response pattern
- `respond<TResponse = unknown>(handler: ResponseHandler<TPayload, TResponse>): Promise<Subscription>`  [lines 157-159] — Register RPC responder handler
- `stats(): Promise<ChannelStats>`  [line 172]
- `purge(): Promise<number>`  [line 187] — Deletes all pending messages; use with caution
- `exists(): Promise<boolean>`  [line 194]
- `delete(): Promise<void>`  [line 201] — Removes queue/topic entirely; use with caution
- `assert(): Promise<void>`  [line 208] — Creates channel or verifies options match
- `stopConsuming(): Promise<void>`  [line 214] — Cancels all active subscriptions gracefully
