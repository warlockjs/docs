# contracts

created: 2026-04-17
updated: 2026-04-17

> TypeScript interfaces that define the broker driver and channel contracts—the canonical abstraction layer ensuring all message broker implementations (RabbitMQ, Kafka, Redis Streams) adhere to a consistent API.

## What lives here

- `broker-driver.contract.ts` — Base contract that all message bus drivers must implement; defines lifecycle management, consumer subscription, and channel creation
- `channel.contract.ts` — Generic contract providing unified pub/sub, request-response, and channel management operations across different brokers
- `index.ts` — Re-exports both contracts for public API consumption

## Public API

### BrokerDriverContract

Driver implementations must satisfy all these methods and properties:

```typescript
readonly name: BrokerDriverType;
readonly isConnected: boolean;
connect(): Promise<void>;
disconnect(): Promise<void>;
on(event: BrokerEvent, listener: BrokerEventListener): void;
off(event: BrokerEvent, listener: BrokerEventListener): void;
subscribe(consumer: EventConsumerClass): () => void;
unsubscribe(consumer: EventConsumerClass): void;
publish<TPayload>(event: EventMessage<TPayload>): void;
channel<TPayload>(name: string, options?: ChannelOptions<TPayload>): ChannelContract<TPayload>;
startConsuming(): Promise<void>;
stopConsuming(): Promise<void>;
healthCheck(): Promise<HealthCheckResult>;
getChannelNames(): string[];
closeChannel(name: string): Promise<void>;
```

### ChannelContract<TPayload = unknown>

Channels expose a unified interface for messaging across all brokers:

```typescript
readonly name: string;
readonly options: ChannelOptions<TPayload>;
publish(payload: TPayload, options?: PublishOptions): Promise<void>;
publishBatch(messages: TPayload[], options?: PublishOptions): Promise<void>;
subscribe(handler: MessageHandler<TPayload>, options?: SubscribeOptions): Promise<Subscription>;
unsubscribeById(consumerId: string): Promise<void>;
request<TResponse = unknown>(payload: TPayload, options?: RequestOptions): Promise<TResponse>;
respond<TResponse = unknown>(handler: ResponseHandler<TPayload, TResponse>): Promise<Subscription>;
stats(): Promise<ChannelStats>;
purge(): Promise<number>;
exists(): Promise<boolean>;
delete(): Promise<void>;
assert(): Promise<void>;
stopConsuming(): Promise<void>;
```

## How it fits together

Contracts define the interface boundary between the Broker facade class and driver implementations. The Broker class delegates all messaging operations to channels, which are created and managed by drivers. Drivers like RabbitMQDriver implement BrokerDriverContract; utility functions like connectToBroker() instantiate drivers and return them typed to BrokerDriverContract, ensuring swappable implementations.

## Working examples

### Implementing a custom driver

```typescript
import { BrokerDriverContract, ChannelContract } from "@warlock.js/herald";

class CustomDriver implements BrokerDriverContract {
  readonly name = "custom" as const;
  readonly isConnected = false;

  async connect(): Promise<void> {
    // Connect to your message broker
  }

  async disconnect(): Promise<void> {
    // Close connection
  }

  on(event: BrokerEvent, listener: BrokerEventListener): void {
    // Register lifecycle event listeners
  }

  off(event: BrokerEvent, listener: BrokerEventListener): void {
    // Remove lifecycle event listeners
  }

  subscribe(consumer: EventConsumerClass): () => void {
    // Subscribe consumer class and return unsubscribe function
    return () => this.unsubscribe(consumer);
  }

  unsubscribe(consumer: EventConsumerClass): void {
    // Unsubscribe consumer
  }

  publish<TPayload>(event: EventMessage<TPayload>): void {
    // Publish event to broker
  }

  channel<TPayload>(name: string, options?: ChannelOptions<TPayload>): ChannelContract<TPayload> {
    // Create or return cached channel
  }

  async startConsuming(): Promise<void> {
    // Begin consuming from all subscribed channels
  }

  async stopConsuming(): Promise<void> {
    // Stop consuming gracefully
  }

  async healthCheck(): Promise<HealthCheckResult> {
    // Check broker connection health
  }

  getChannelNames(): string[] {
    // Return all managed channel names
  }

  async closeChannel(name: string): Promise<void> {
    // Close and remove specific channel
  }
}
```

### Publishing and subscribing via channels

```typescript
import { herald } from "@warlock.js/herald";

// Get a typed channel
const orderChannel = herald().channel<OrderPayload>("orders", {
  durable: true,
  deadLetter: { channel: "orders.failed" },
});

// Subscribe handler
await orderChannel.subscribe(
  async (message, ctx) => {
    console.log("Order received:", message.payload);
    await ctx.ack();
  },
  { prefetch: 10 }
);

// Publish message
await orderChannel.publish({
  orderId: 123,
  amount: 99.99,
});

// Batch publish
await orderChannel.publishBatch([
  { orderId: 124, amount: 50 },
  { orderId: 125, amount: 75 },
]);
```

### Request-response (RPC) pattern

```typescript
const processChannel = herald().channel<ImagePayload>("process.image");

// Register responder
await processChannel.respond(async (message, ctx) => {
  const result = await processImage(message.payload.url);
  return { processedUrl: result.url };
});

// Make request from another service
const result = await processChannel.request<ProcessResult>(
  { url: "https://example.com/image.jpg" },
  { timeout: 30000 }
);
console.log("Processed:", result.processedUrl);
```

## DO NOT

- Do NOT instantiate contract interfaces directly — they are TypeScript interfaces only; use drivers or the Broker class instead
- Do NOT add methods to drivers that are not in BrokerDriverContract — the Broker class delegates only contract methods and other code paths won't invoke custom methods
- Do NOT assume channels are immediately ready after creation — call assert() to create/verify the channel with the broker before publishing
- Do NOT override the publish method in channel implementations to skip payloads — all published messages must be queued; filter at subscribe time instead
- Do NOT call publish() and subscribe() concurrently on the same channel name without coordination — channel state may be inconsistent; use startConsuming() after all subscriptions are registered
- Do NOT hold references to ChannelContract across disconnect/reconnect cycles — the underlying connection state changes; retrieve channels fresh from driver.channel() after reconnecting
