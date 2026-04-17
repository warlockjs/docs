# registry.types
source: src/types/registry.types.ts
description: Type definitions for broker registry events and listener callbacks.
complexity: simple
first-mapped: 2026-04-17 04:25:18 AM
last-mapped: 2026-04-17 04:25:18 AM

## Imports
- `Broker` from `../communicators/broker` [line 1]

## Exports
- `BrokerRegistryEvent` — Union of broker registry lifecycle events [lines 3-7]
- `BrokerRegistryListener` — Callback signature for broker registration [line 9]

## Types & Interfaces

### BrokerRegistryEvent  [lines 3-7] — Union type for broker lifecycle
- `"registered"` — Broker registered in system
- `"default-registered"` — Broker set as default
- `"connected"` — Broker connection established
- `"disconnected"` — Broker connection closed

### BrokerRegistryListener  [line 9] — Function type for registry listeners
- Callback signature: `(broker: Broker) => void`
