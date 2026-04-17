# 📯 Warlock Herald

> Let heralds carry your messages across services!

A powerful, type-safe message bus library for RabbitMQ, Kafka, and more.

## 📦 Installation

```bash
npm install @warlock.js/herald
```

```bash
yarn add @warlock.js/herald
```

```bash
pnpm add @warlock.js/herald
```

### Driver Dependencies

Install the driver for your message broker using the Warlock CLI:

```bash
# RabbitMQ (recommended)
npx warlock add herald --driver=rabbitmq

# Kafka (coming soon)
npx warlock add herald --driver=kafka
```

Or install manually:

```bash
# RabbitMQ
npm install amqplib

# Kafka (coming soon)
npm install kafkajs
```

## 🚀 Quick Start

```typescript
import { connectToCommunicator, communicators } from "@warlock.js/herald";

// Connect to RabbitMQ
await connectToCommunicator({
  driver: "rabbitmq",
  host: "localhost",
  port: 5672,
  username: "guest",
  password: "guest",
});

// Publish a message
await communicators().channel("user.created").publish({
  userId: 1,
  email: "user@example.com",
});

// Subscribe to messages
communicators()
  .channel<{ userId: number; email: string }>("user.created")
  .subscribe(async (message, ctx) => {
    console.log("User created:", message.payload.userId);
    await ctx.ack();
  });
```

## 🎯 Core Concepts

### Communicators

A communicator wraps a message broker connection. You can have multiple communicators for different brokers or purposes.

```typescript
// Single communicator (default)
await connectToCommunicator({
  driver: "rabbitmq",
  host: "localhost",
});

// Multiple communicators
await connectToCommunicator({
  driver: "rabbitmq",
  name: "notifications",
  isDefault: true,
  host: process.env.NOTIFICATIONS_HOST,
});

await connectToCommunicator({
  driver: "rabbitmq",
  name: "analytics",
  host: process.env.ANALYTICS_HOST,
});

// Use default
communicators().channel("notifications").publish({ ... });

// Use specific communicator
communicators("analytics").channel("events").publish({ ... });
```

### Channels

Channels represent queues (RabbitMQ) or topics (Kafka). They provide a unified pub/sub interface.

```typescript
// Get a channel
const userChannel = communicators().channel("user.created");

// Publish
await userChannel.publish({ userId: 1 });

// Subscribe
await userChannel.subscribe(async (message, ctx) => {
  console.log(message.payload);
  await ctx.ack();
});
```

### Typed Channels

Full TypeScript support with type inference:

```typescript
interface UserPayload {
  userId: number;
  email: string;
}

// Typed channel
const channel = communicators().channel<UserPayload>("user.created");

// TypeScript knows the payload type
await channel.publish({ userId: 1, email: "test@example.com" });

channel.subscribe(async (message, ctx) => {
  // message.payload is typed as UserPayload
  console.log(message.payload.userId);
  await ctx.ack();
});
```

### Schema Validation with Seal

Use `@warlock.js/seal` for runtime validation:

```typescript
import { v } from "@warlock.js/seal";

const UserSchema = v.object({
  userId: v.int().required(),
  email: v.string().email().required(),
});

// Channel with validation
const channel = communicators().channel("user.created", {
  schema: UserSchema,
});

// Publishing validates automatically
await channel.publish({ userId: 1, email: "invalid" }); // Throws validation error

// Subscribing receives validated data
channel.subscribe(async (message, ctx) => {
  // message.payload is guaranteed valid
  await ctx.ack();
});
```

## 📚 API Reference

### connectToCommunicator

Connect to a message broker and register the communicator:

```typescript
const communicator = await connectToCommunicator({
  driver: "rabbitmq",
  name: "default",       // Optional, defaults to "default"
  isDefault: true,       // Optional, defaults to true
  host: "localhost",
  port: 5672,
  username: "guest",
  password: "guest",
  vhost: "/",
  // Driver-specific options
  heartbeat: 60,
  prefetch: 10,
  reconnect: true,
  reconnectDelay: 5000,
});
```

### communicators(name?)

Get a communicator by name or the default one:

```typescript
// Default communicator
communicators().channel("events");

// Named communicator
communicators("analytics").channel("events");
```

### Channel Methods

```typescript
const channel = communicators().channel<MyPayload>("channel.name");

// Publishing
await channel.publish(payload, options?);
await channel.publishBatch([payload1, payload2], options?);

// Subscribing
const subscription = await channel.subscribe(handler, options?);
await subscription.unsubscribe();
await subscription.pause();

// Request-Response (RPC)
const response = await channel.request<ResponseType>(payload, { timeout: 30000 });
await channel.respond(async (message, ctx) => {
  return { result: "processed" };
});

// Queue management
const stats = await channel.stats();
await channel.purge();
await channel.delete();
```

### Message Context

The context object provides message flow control:

```typescript
channel.subscribe(async (message, ctx) => {
  // Acknowledge (message processed successfully)
  await ctx.ack();

  // Negative acknowledge (requeue or dead-letter)
  await ctx.nack(requeue?: boolean);

  // Reject (don't requeue)
  await ctx.reject();

  // Reply (for RPC patterns)
  await ctx.reply({ result: "ok" });

  // Retry with delay
  await ctx.retry(5000);
});
```

### Subscribe Options

```typescript
await channel.subscribe(handler, {
  group: "my-consumer-group",  // Consumer group/tag
  prefetch: 10,                // Concurrency
  autoAck: false,              // Manual ack (recommended)
  exclusive: false,            // Exclusive consumer
  retry: {
    maxRetries: 3,
    delay: 1000,               // Or: (attempt) => attempt * 1000
  },
  deadLetter: {
    channel: "channel.failed",
    preserveOriginal: true,
  },
});
```

### Publish Options

```typescript
await channel.publish(payload, {
  priority: 5,           // 0-9 (9 highest)
  ttl: 60000,            // Time-to-live in ms
  delay: 5000,           // Delayed delivery
  persistent: true,      // Survive broker restart
  correlationId: "123",  // For tracking
  headers: { key: "value" },
});
```

## 🔌 Drivers

### RabbitMQ

```typescript
await connectToCommunicator({
  driver: "rabbitmq",
  host: "localhost",
  port: 5672,
  username: "guest",
  password: "guest",
  vhost: "/",
  // Or use URI
  uri: "amqp://guest:guest@localhost:5672/",
});
```

### Kafka (Coming Soon)

```typescript
await connectToCommunicator({
  driver: "kafka",
  brokers: ["localhost:9092"],
  clientId: "my-app",
  ssl: true,
  sasl: {
    mechanism: "plain",
    username: "user",
    password: "pass",
  },
});
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                Your Application                  │
├─────────────────────────────────────────────────┤
│     communicators() → channel() → publish()      │
│                                   subscribe()    │
├─────────────────────────────────────────────────┤
│              Communicator Registry               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ default  │  │analytics │  │  events  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
├───────┼─────────────┼─────────────┼─────────────┤
│       │             │             │              │
│  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐       │
│  │ RabbitMQ │  │ RabbitMQ │  │  Kafka   │       │
│  │  Driver  │  │  Driver  │  │  Driver  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
├───────┼─────────────┼─────────────┼─────────────┤
│       ▼             ▼             ▼              │
│   RabbitMQ      RabbitMQ       Kafka            │
│    Broker        Broker        Cluster          │
└─────────────────────────────────────────────────┘
```

## 🤝 Philosophy

**Herald** is designed around three principles:

1. **Type Safety First** - Full TypeScript support with inference
2. **Simple DX** - Intuitive API that feels natural
3. **Driver Agnostic** - Same API for RabbitMQ, Kafka, and more

## 📄 License

MIT

---

**Let your heralds carry your messages! 📯✨**
