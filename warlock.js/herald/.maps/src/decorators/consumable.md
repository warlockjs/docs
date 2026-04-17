# consumable
source: src/decorators/consumable.ts
description: Provides the Consumable class decorator that registers event consumer classes with a broker, deferring subscription if the broker is not yet connected.
complexity: simple
first-mapped: 2026-04-17 04:25:18 AM
last-mapped: 2026-04-17 04:25:18 AM

## Imports
- `brokerRegistry` from `../communicators`
- `EventConsumerClass` from `../message-managers/types`

## Exports
- `ConsumableOptions` — optional broker name config type  [lines 4-6]
- `pendingSubscribers` — set of deferred consumer registrations  [lines 8-11]
- `Consumable` — decorator factory registering consumers with broker  [lines 16-35]

## Functions / Classes / Types

### ConsumableOptions  [lines 4-6] — type for optional broker name
- properties: `broker?: string`

### pendingSubscribers  [lines 8-11] — holds consumers awaiting broker connection
- type: `Set<{ Consumer: EventConsumerClass; options?: ConsumableOptions }>`
- side-effects: mutated by `Consumable` decorator and `connected` event handler

### Consumable  [lines 16-35] — decorator factory; subscribes or defers consumer
- params: `options?: ConsumableOptions`
- returns: `(target: EventConsumerClass) => void`
- side-effects: calls `broker.subscribe(target)` or adds to `pendingSubscribers`

### brokerRegistry "connected" handler  [lines 38-46] — drains pending subscribers on connect
- side-effects: iterates `pendingSubscribers`, calls `broker.subscribe` for matching entries
