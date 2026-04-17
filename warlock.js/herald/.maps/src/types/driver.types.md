# driver.types
source: src/types/driver.types.ts
description: Type definitions for broker driver types, events, and health checks.
complexity: simple
first-mapped: 2026-04-17 04:25:18 AM
last-mapped: 2026-04-17 04:25:18 AM

## Exports
- `BrokerDriverType` — Union of supported broker implementations [line 1]
- `BrokerEvent` — Event types emitted by broker connections [line 3]
- `BrokerEventListener` — Function signature for event handlers [line 5]
- `HealthCheckResult` — Broker health check response shape [lines 7-12]

## Types & Interfaces

### BrokerDriverType [line 1] — Supported broker driver names
- Union type: `"rabbitmq" | "kafka" | "redis-streams" | "sqs"`

### BrokerEvent [line 3] — Broker lifecycle events
- Union type: `"connected" | "disconnected" | "error" | "reconnecting"`

### BrokerEventListener [line 5] — Event handler callback signature
- `(...args: unknown[]) => void`

### HealthCheckResult [lines 7-12] — Broker health status information
- `healthy: boolean` — Health status indicator
- `latency?: number` — Optional latency measurement
- `error?: string` — Optional error message if unhealthy
- `details?: Record<string, unknown>` — Additional metadata
