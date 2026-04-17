# connect-to-broker
source: src/utils/connect-to-broker.ts
description: Utility module for connecting to message brokers with registration and convenience functions.
complexity: medium
first-mapped: 2026-04-17 04:25:18 AM
last-mapped: 2026-04-17 05:12:57 AM

## Imports
- `Broker`, `brokerRegistry` from `../communicators`
- `BrokerDriverContract`, `ChannelContract` from `../contracts` (type)
- `EventConsumerClass`, `EventMessage` from `../message-managers`
- `ChannelOptions`, `ConnectionOptions`, `RabbitMQConnectionOptions` from `../types` (type)

## Exports
- `connectToBroker` — Create and register message broker connection [line 59]
- `herald` — Get broker by name or default instance [line 136]
- `heraldChannel<TPayload = unknown>(name: string, options?: ChannelOptions<TPayload>): ChannelContract<TPayload>` — Get channel from default broker  [lines 156-161]
- `publishEvent` — Publish event message to default broker [line 175]
- `subscribeConsumer` — Subscribe consumer class to default broker [line 191]

## Functions

### connectToBroker(options: ConnectionOptions): Promise<Broker>  [lines 59-106] — Connect to broker and register it
- options: Connection configuration for broker driver
- returns: Connected and registered Broker instance
- throws: `Error` — when connection fails or driver not supported
- side-effects: Registers broker in brokerRegistry, connects to message broker
- see: ConnectionOptions, RabbitMQConnectionOptions types

### herald(name?: string): Broker  [lines 136-138] — Retrieve broker by name or default
- name?: Broker name; uses default if not provided (optional)
- returns: Broker instance
- throws: `MissingBrokerError` — if named broker not found

### heraldChannel<TPayload = unknown>(name: string, options?: ChannelOptions<TPayload>): ChannelContract<TPayload>  [lines 156-161] — Get channel from default broker
- name: Channel name
- options?: Channel configuration options (optional)
- returns: Channel instance for publishing and subscribing
- throws: `MissingBrokerError` — if default broker not found

### publishEvent(event: EventMessage): Promise<void>  [lines 175-177] — Publish event message to default
- event: EventMessage instance with payload
- returns: Promise resolving when event published
- throws: `Error` — when broker not connected
- side-effects: Publishes event message to broker

### subscribeConsumer(Consumer: EventConsumerClass): Promise<() => void>  [lines 191-195] — Subscribe event consumer to default
- Consumer: EventConsumer class to subscribe
- returns: Unsubscribe function
- throws: `MissingBrokerError` — if default broker not found
- side-effects: Subscribes consumer to broker channels
