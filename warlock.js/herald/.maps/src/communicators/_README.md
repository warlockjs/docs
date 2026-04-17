# communicators

created: 2026-04-17 04:56:56 AM
updated: 2026-04-17 04:56:56 AM

> This folder houses the named broker wrapper (`Broker`) and global registry (`BrokerRegistry`) for managing message broker instances, providing a central point of access to driver abstractions with lifecycle and event management.

## What lives here

- `broker.ts` — Defines the `Broker` class (named driver wrapper with lifecycle methods) and `BrokerOptions` interface for broker configuration
- `broker-registry.ts` — Defines the `BrokerRegistry` class (registry of named broker instances) and exports the singleton `brokerRegistry` instance
- `index.ts` — Re-exports all symbols from `broker.ts` and `broker-registry.ts`

## Public API

### From broker.ts

- `interface BrokerOptions` — Configuration for creating a Broker
  - `name: string` — Unique name for the broker
  - `driver: BrokerDriverContract` — The underlying driver
  - `isDefault?: boolean` — Whether this is the default broker

- `class Broker` — Named driver wrapper with metadata
  - `public readonly name: string` — Unique name identifying this broker
  - `public readonly driver: BrokerDriverContract` — The underlying driver
  - `public readonly isDefault: boolean` — Whether this is the default broker
  - `constructor(options: BrokerOptions): void` — Initialize broker from options object
  - `public subscribe(consumer: EventConsumerClass<any>): unknown` — Delegate consumer subscription to driver
  - `public publish<TPayload>(event: EventMessage<TPayload>): void` — Delegate event publish to driver
  - `public channel<TPayload>(name: string, options?: ChannelOptions<TPayload>): ChannelContract<TPayload>` — Get or create named channel
  - `public get isConnected(): boolean` — Reflect driver connection state
  - `public async connect(): Promise<void>` — Connect the underlying driver
  - `public async disconnect(): Promise<void>` — Disconnect the underlying driver
  - `public async startConsuming(): Promise<void>` — Begin message consumption via driver
  - `public async stopConsuming(): Promise<void>` — Halt message consumption via driver
  - `public async healthCheck(): Promise<HealthCheckResult>` — Delegate health check to driver

### From broker-registry.ts

- `class MissingBrokerError extends Error` — Error thrown when a broker is not found
  - `public readonly brokerName?: string` — The name of the missing broker
  - `constructor(message: string, brokerName?: string)` — Initialize the error

- `const brokerRegistry: BrokerRegistry` — Global singleton instance for managing named brokers
  - `public register(options: BrokerOptions): Broker` — Registers a broker and sets up event forwarding; side-effects: emits `registered`, `default-registered`, forwards driver events
  - `public clear(): void` — Removes all registered brokers; side-effects: clears map and default
  - `public on(event: BrokerRegistryEvent, listener: BrokerRegistryListener): void` — Subscribes to registry event
  - `public once(event: BrokerRegistryEvent, listener: BrokerRegistryListener): void` — Subscribes once to registry event
  - `public off(event: BrokerRegistryEvent, listener: BrokerRegistryListener): void` — Removes registry event listener
  - `public get(name?: string): Broker` — Throws `MissingBrokerError` if broker absent
  - `public has(name: string): boolean` — Checks named broker existence
  - `public hasAny(): boolean` — Checks if any brokers registered
  - `public getAll(): Broker[]` — Returns all registered brokers
  - `public getNames(): string[]` — Returns all broker names
  - `public getDefault(): Broker | undefined` — Returns default broker or undefined

## How it fits together

The `communicators` folder forms the central registry layer for broker instances. It imports type contracts from `contracts/` (specifically `BrokerDriverContract` and `ChannelContract`) and uses message abstractions from `message-managers/` (`EventMessage`, `EventConsumerClass`). The `Broker` class wraps a driver instance with metadata (name, isDefault flag) while delegating actual work to the underlying driver. The global `brokerRegistry` singleton is consumed by `utils/` (specifically `connectToBroker()` function) for managing broker lifecycle, and by `decorators/` (specifically the `consumable` decorator) for auto-registering consumers. The `index.ts` re-exports everything, making all symbols available to the public package API exported from `index.ts` at the root level.

## Working examples

```typescript
// Example 1: Creating and registering a broker
import { Broker, brokerRegistry, BrokerOptions } from "@warlock.js/herald";
import { rabbitMQDriver } from "@warlock.js/herald/drivers/rabbitmq";

const options: BrokerOptions = {
  name: "default",
  driver: rabbitMQDriver,
  isDefault: true,
};

const broker = brokerRegistry.register(options);
await broker.connect();
```

```typescript
// Example 2: Publishing an event via broker
import { brokerRegistry } from "@warlock.js/herald";
import { EventMessage } from "@warlock.js/herald";

const broker = brokerRegistry.get(); // Gets default broker
const event = new EventMessage("user.created", { userId: 123 });
broker.publish(event);
```

```typescript
// Example 3: Working with named brokers and channels
import { brokerRegistry } from "@warlock.js/herald";

const analyticsBroker = brokerRegistry.get("analytics");
const channel = analyticsBroker.channel("user.events", { durable: true });

brokerRegistry.on("connected", (broker) => {
  console.log(`Broker "${broker.name}" connected`);
});
```

## DO NOT

- Do NOT call `new Broker(options)` directly — use `brokerRegistry.register(options)` to ensure the broker is tracked and events are forwarded properly
- Do NOT assume `brokerRegistry` auto-populates — brokers must be registered explicitly via `register()` before they can be retrieved with `get()`
- Do NOT call `broker.driver` methods directly in application code — always use the `Broker` class methods (e.g., `broker.subscribe()`, `broker.publish()`, `broker.channel()`) to ensure consistency
- Do NOT mix connection lifecycle calls — always call `connect()`, `startConsuming()`, and `disconnect()` in the correct order; use `connectToBroker()` utility from `utils/` instead of managing broker lifecycle manually
- Do NOT register multiple brokers with `isDefault: true` — only the first or most recently registered default broker will be used; call `brokerRegistry.getDefault()` to verify which is active
- Do NOT forget to `await broker.disconnect()` before application shutdown — drivers may have pending operations that need graceful cleanup

## Internal (not for docs)

None. All symbols exported from this folder are part of the public API.
