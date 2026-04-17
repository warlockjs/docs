# broker-registry
source: src/communicators/broker-registry.ts
description: Defines BrokerRegistry class and singleton for managing named broker instances.
complexity: simple
first-mapped: 2026-04-17 04:25:18 AM
last-mapped: 2026-04-17 05:12:57 AM

## Imports
- `EventEmitter` from `node:events`
- `BrokerRegistryEvent`, `BrokerRegistryListener` from `../types`
- `Broker`, `BrokerOptions` from `./broker`

## Exports
- `MissingBrokerError` — error for missing broker lookups  [lines 8-16]
- `brokerRegistry` — global singleton BrokerRegistry instance  [line 233]

## Classes / Functions / Constants

### MissingBrokerError  [lines 8-16] — error class for missing brokers
- `public readonly brokerName?: string`
- `constructor(message: string, brokerName?: string)`

### BrokerRegistry  [lines 45-228] — (internal — not exported) registry managing named broker instances
- `private readonly sources: Map<string, Broker>`
- `private defaultSource?: Broker`
- `private readonly events: EventEmitter`
- `public register(options: BrokerOptions): Broker`  [lines 67-94] — registers broker; side-effects: emits `registered`, `default-registered`, forwards driver events
- `public clear(): void`  [lines 99-102] — removes all brokers; side-effects: clears map and default
- `public on(event: BrokerRegistryEvent, listener: BrokerRegistryListener): void`  [lines 121-123] — subscribes to registry event
- `public once(event: BrokerRegistryEvent, listener: BrokerRegistryListener): void`  [lines 131-133] — subscribes once to registry event
- `public off(event: BrokerRegistryEvent, listener: BrokerRegistryListener): void`  [lines 141-143] — removes registry event listener
- `public get(name?: string): Broker`  [lines 161-175] — throws `MissingBrokerError` if broker absent
- `public has(name: string): boolean`  [lines 183-185] — checks named broker existence
- `public hasAny(): boolean`  [lines 190-192] — checks if any brokers registered
- `public getAll(): Broker[]`  [lines 207-209] — returns all registered brokers
- `public getNames(): string[]`  [lines 216-218] — returns all broker names
- `public getDefault(): Broker | undefined`  [lines 225-227] — returns default broker or undefined

### brokerRegistry  [line 233] — exported singleton BrokerRegistry instance
