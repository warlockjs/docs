# broker
source: src/communicators/broker.ts
description: Defines the Broker class and BrokerOptions interface, wrapping a driver with named identity and lifecycle management.
complexity: medium
first-mapped: 2026-04-17 04:25:18 AM
last-mapped: 2026-04-17 05:12:57 AM

## Imports
- `BrokerDriverContract` from `../contracts`
- `ChannelContract` from `../contracts/channel.contract`
- `EventMessage` from `../message-managers/event-message`
- `EventConsumerClass` from `../message-managers/types`
- `ChannelOptions` from `../types`

## Exports
- `BrokerOptions` — interface for broker constructor config  [lines 10-17]
- `Broker` — named driver wrapper with lifecycle methods  [lines 36-138]

## Classes

### Broker  [lines 36-138] — Named driver wrapper with metadata
extends: none

fields:
- `public readonly name: string`  [line 38]
- `public readonly driver: BrokerDriverContract`  [line 41]
- `public readonly isDefault: boolean`  [line 44]

methods:
- `public constructor(options: BrokerOptions): void`  [lines 51-55] — Initialize broker from options object
- `public subscribe(consumer: EventConsumerClass<any>): unknown`  [lines 60-62] — Delegate consumer subscription to driver
- `public publish<TPayload>(event: EventMessage<TPayload>): void`  [lines 67-69] — Delegate event publish to driver
- `public channel<TPayload>(name: string, options?: ChannelOptions<TPayload>): ChannelContract<TPayload>`  [lines 90-95] — Get or create named channel
- `public get isConnected(): boolean`  [lines 100-102] — Reflect driver connection state
- `public async connect(): Promise<void>`  [lines 107-109] — Connect the underlying driver
- `public async disconnect(): Promise<void>`  [lines 114-116] — Disconnect the underlying driver
- `public async startConsuming(): Promise<void>`  [lines 121-123] — Begin message consumption via driver
- `public async stopConsuming(): Promise<void>`  [lines 128-130] — Halt message consumption via driver
- `public async healthCheck(): Promise<HealthCheckResult>`  [lines 135-137] — Delegate health check to driver
