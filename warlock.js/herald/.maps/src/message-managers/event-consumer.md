# event-consumer
source: src/message-managers/event-consumer.ts
description: Defines the abstract EventConsumer base class and defineConsumer factory for Herald event consumption.
complexity: medium
first-mapped: 2026-04-17 04:25:18 AM
last-mapped: 2026-04-17 04:25:18 AM

## Imports
- `v`, `ValidationResult`, `ObjectValidator` from `@warlock.js/seal`
- `randomUUID` from `crypto`
- `Consumable` from `../decorators`
- `ConsumedEventMessage`, `EventConsumerClass` from `./types`

## Exports
- `EventConsumer` — abstract base class for event consumers  [lines 12-69]
- `defineConsumer` — factory function returning EventConsumerClass  [lines 92-113]

## Classes / Functions / Types

### EventConsumer  [lines 12-69] — abstract base for typed event consumers
- static `eventName: string` — public; event name identifier
- static `_consumerId?: string` — private; lazy UUID storage
- static get `consumerId(): string` — public; generates UUID on first access; side-effect: sets `_consumerId`  [lines 20-25]
- get `eventName(): string` — public; reads static eventName from constructor  [lines 27-29]
- static `minVersion?: number` — public; minimum accepted event version
- static `maxVersion?: number` — public; maximum accepted event version
- `schema?: ObjectValidator` — public; optional payload validator
- abstract `handle(payload: Payload, event: ConsumedEventMessage): Promise<void>` — public abstract; must be implemented by subclass  [line 49]
- static `isAcceptedVersion(version: number): boolean` — public; checks min/max version bounds  [lines 54-59]
- async `validate(data: Payload): Promise<ValidationResult | void>` — public; validates payload against schema; side-effect: calls `v.validate`  [lines 64-68]

### ConsumerOptions  [lines 74-87] — (internal — not exported) local type for defineConsumer options
- `schema?: ObjectValidator`
- `handle: (payload, event) => Promise<void>`
- `validate?: (payload) => Promise<ValidationResult | boolean>`

### defineConsumer  [lines 92-113] — creates registered EventConsumer without a class
- params: `eventName: string`, `options: ConsumerOptions<Payload>`
- returns: `EventConsumerClass`
- side-effect: calls `Consumable()` decorator on generated class
