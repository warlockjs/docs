# broker-driver.contract
source: src/contracts/broker-driver.contract.ts
description: Defines the BrokerDriverContract interface that all message-bus driver implementations must satisfy.
complexity: medium
first-mapped: 2026-04-17 04:25:18 AM
last-mapped: 2026-04-17 04:25:18 AM

## Imports
- `EventMessage` from `../message-managers/event-message`
- `EventConsumerClass` from `../message-managers/types`
- `BrokerDriverType`, `BrokerEvent`, `BrokerEventListener`, `ChannelOptions`, `HealthCheckResult` from `../types`
- `ChannelContract` from `./channel.contract`

## Exports
- `BrokerDriverContract` — interface contract for broker drivers  [lines 27-219]

## Classes / Interfaces / Types

### BrokerDriverContract  [lines 27-219] — contract all broker drivers must implement
- `readonly name: BrokerDriverType`  [line 33] — driver identifier string
- `readonly isConnected: boolean`  [line 38]
- `connect(): Promise<void>`  [line 51] — throws Error if connection fails
- `disconnect(): Promise<void>`  [line 63] — closes connection gracefully
- `on(event: BrokerEvent, listener: BrokerEventListener): void`  [line 90]
- `off(event: BrokerEvent, listener: BrokerEventListener): void`  [line 98]
- `subscribe(consumer: EventConsumerClass): () => void`  [line 110] — returns unsubscribe function
- `unsubscribe(consumer: EventConsumerClass): void`  [line 122]
- `publish<TPayload>(event: EventMessage<TPayload>): void`  [line 127]
- `channel<TPayload>(name: string, options?: ChannelOptions<TPayload>): ChannelContract<TPayload>`  [lines 155-158] — lazy-created, cached channel
- `startConsuming(): Promise<void>`  [line 175]
- `stopConsuming(): Promise<void>`  [line 187]
- `healthCheck(): Promise<HealthCheckResult>`  [line 204]
- `getChannelNames(): string[]`  [line 211]
- `closeChannel(name: string): Promise<void>`  [line 218]
