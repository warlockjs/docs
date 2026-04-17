# types
source: src/message-managers/types.ts
description: Defines consumed event message structure and event consumer class contract types.
complexity: simple
first-mapped: 2026-04-17 04:25:18 AM
last-mapped: 2026-04-17 04:25:18 AM

## Imports
- `Message` from `../types` [line 1]
- `EventConsumer` from `./event-consumer` [line 2]

## Exports
- `ConsumedEventMessage` — Message envelope with metadata and payload [lines 4-12]
- `EventConsumerClass` — Consumer class constructor contract with metadata [lines 14-21]

## Types & Interfaces

### ConsumedEventMessage [lines 4-12] — Event message with version and metadata
- `version?: number` — Optional event schema version
- `occurredAt?: Date` — Optional event occurrence timestamp
- `metadata?: Record<string, any>` — Optional event metadata dictionary
- `messageId: string` — Unique message identifier
- `eventName: string` — Name of the event
- `payload: Record<string, any>` — Event-specific data
- `message: Message<any>` — Original message object

### EventConsumerClass [lines 14-21] — Constructor type for event consumers
- `new (): EventConsumer<P>` — Constructor requiring no arguments
- `eventName: string` — Static property: consumed event name
- `consumerId: string` — Static property: unique consumer identifier
- `minVersion?: number` — Static optional: minimum supported version
- `maxVersion?: number` — Static optional: maximum supported version
- `isAcceptedVersion(version: number): boolean` — Check if version accepted
