# event-message
source: src/message-managers/event-message.ts
description: Defines the abstract EventMessage base class and defineEvent factory for publishing typed events through Herald brokers.
complexity: medium
first-mapped: 2026-04-17 04:25:18 AM
last-mapped: 2026-04-17 04:25:18 AM

## Imports
- `GenericObject` from `@mongez/reinforcements`
- `ObjectValidator` (type) from `@warlock.js/seal`
- `randomUUID` from `crypto`

## Exports
- `EventMessage` — abstract base class for Herald events  [lines 11-69]
- `defineEvent` — factory to create EventMessage subclass inline  [lines 111-131]

## Classes / Functions / Types

### EventMessage<TPayload>  [lines 11-69] — abstract base for all Herald events
- abstract public `eventName`: string
- public `version?`: number
- public `metadata?`: Record<string, any>
- public `messageId?`: string
- public `schema?`: ObjectValidator
- protected `data?`: TPayload  (constructor param)
- public `toJSON(): TPayload`  — throws Error if data undefined  [lines 40-46]
- public `serialize()`  — returns structured envelope; side-effect: generates randomUUID  [lines 56-68]

### EventOptions<T>  [lines 71-80] — (internal — not exported) options type for defineEvent factory
- `toJSON?`: (data: T) => GenericObject
- `schema?`: ObjectValidator

### EventMessageClass<TIncoming, TOutgoing>  [lines 88-90] — (internal — not exported) constructor type alias

### defineEvent<IncomingData, OutgoingData>  [lines 111-131] — creates named EventMessage subclass
- param `eventName`: string
- param `options`: EventOptions<IncomingData>
- returns `EventMessageClass<IncomingData, OutgoingData>`
