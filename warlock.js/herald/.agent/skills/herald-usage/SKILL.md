---
name: herald-usage
description: How to use @warlock.js/herald in this project — connecting brokers, publishing events, creating consumers.
---

# Using Herald — Message Bus Guide

Herald (`@warlock.js/herald`) is the Warlock.js message bus package. This skill covers how to use it in your application. For modifying Herald internals, see `@warlock.js/herald/.agent/skills/herald-skill/SKILL.md` instead.

---

## Boot — How Herald Connects

Herald is auto-connected by the `HeraldConnector` in `@warlock.js/core`. You don't need to call `connectToBroker()` manually.

It reads config from `src/config/herald.ts`:

```typescript
// src/config/herald.ts
import { env } from "@warlock.js/core";

export default {
  driver: "rabbitmq",
  host: env("RABBITMQ_HOST", "localhost"),
  port: env("RABBITMQ_PORT", 5672),
  username: env("RABBITMQ_USER", "guest"),
  password: env("RABBITMQ_PASSWORD", "guest"),
  name: "default",
  isDefault: true,
};
```

The connector reads `config.get("herald")` and calls `connectToBroker()` automatically during server startup.

---

## Publishing Events

### Option 1 — Class-based (recommended for domain events)

Create an event class in your module's `events/` directory:

```typescript
// src/app/orders/events/order-created.event.ts
import { EventMessage } from "@warlock.js/herald";

type OrderCreatedPayload = {
  orderId: number;
  userId: number;
  total: number;
};

export class OrderCreatedEvent extends EventMessage<OrderCreatedPayload> {
  public eventName = "order.created";
}
```

Publish from a service:

```typescript
// src/app/orders/services/create-order.service.ts
import { publishEvent } from "@warlock.js/herald";
import { OrderCreatedEvent } from "../events/order-created.event";

export async function createOrderService(data: CreateOrderSchema) {
  const order = await Order.create(data);

  await publishEvent(
    new OrderCreatedEvent({
      orderId: order.id,
      userId: data.userId,
      total: order.total,
    }),
  );

  return order;
}
```

### Option 2 — Factory-based (quick one-off events)

```typescript
import { defineEvent, publishEvent } from "@warlock.js/herald";

const UserUpdatedEvent = defineEvent<User, { id: number; name: string }>(
  "user.updated",
  {
    toJSON: (user) => ({ id: user.id, name: user.name }),
  },
);

await publishEvent(new UserUpdatedEvent(user));
```

### Option 3 — Direct channel publish (raw, no envelope)

```typescript
import { herald } from "@warlock.js/herald";

await herald().channel("notifications").publish({
  type: "sms",
  to: "+1234567890",
  body: "Your order is ready",
});
```

---

## Consuming Events

### Step 1 — Create a consumer class

Place consumers in your module's `events/` directory (alongside the event):

```typescript
// src/app/notifications/events/order-created.consumer.ts
import { Consumable, EventConsumer } from "@warlock.js/herald";

type OrderCreatedPayload = {
  orderId: number;
  userId: number;
  total: number;
};

@Consumable()
export class OrderCreatedConsumer extends EventConsumer<OrderCreatedPayload> {
  public static eventName = "order.created";

  public async handle(payload: OrderCreatedPayload) {
    // Send notification email, update analytics, etc.
    await sendOrderConfirmationEmail(payload.userId, payload.orderId);
  }
}
```

### Step 2 — Import in main.ts

The consumer must be imported for `@Consumable()` to register it:

```typescript
// src/app/notifications/main.ts
import "./events/order-created.consumer";
```

That's it — `@Consumable()` handles the rest. When the broker connects, all pending consumers are automatically subscribed.

### Targeting a specific broker

```typescript
@Consumable({ broker: "analytics" })
export class PageViewConsumer extends EventConsumer<Payload> {
  public static eventName = "page.viewed";
  public async handle(payload: Payload) { ... }
}
```

### Version filtering

```typescript
export class UserCreatedConsumerV2 extends EventConsumer<Payload> {
  public static eventName = "user.created";
  public static minVersion = 2;     // only process version >= 2
  public static maxVersion = 3;     // optional upper bound

  public async handle(payload: Payload) { ... }
}
```

### Consumer with schema validation

```typescript
import { v } from "@warlock.js/seal";

@Consumable()
export class OrderCreatedConsumer extends EventConsumer<OrderPayload> {
  public static eventName = "order.created";

  // Auto-validated before handle() is called — invalid payloads are nack'd
  public schema = v.object({
    orderId: v.int().required(),
    userId: v.int().required(),
    total: v.number().required().min(0),
  });

  public async handle(payload: OrderPayload) { ... }
}
```

### Factory-based consumer (quick one-off)

```typescript
import { defineConsumer } from "@warlock.js/herald";

const LogOrderConsumer = defineConsumer<{ orderId: number }>("order.created", {
  async handle(payload) {
    console.log("Order created:", payload.orderId);
  },
});
```

---

## Error Handling

Consumer errors are emitted as `"error"` events on the driver. Listen for them in your module's `main.ts`:

```typescript
// src/app/shared/main.ts
import { brokerRegistry } from "@warlock.js/herald";
import { logger } from "@warlock.js/logger";

brokerRegistry.on("connected", (broker) => {
  broker.driver.on("error", (error, eventName) => {
    logger.error(
      "herald",
      "consumer-error",
      `Consumer failed for ${eventName}`,
      { error },
    );
  });
});
```

Failed messages are automatically requeued (`nack(true)`) by default.

---

## File Placement Conventions

| File            | Location                                           | Example                                          |
| --------------- | -------------------------------------------------- | ------------------------------------------------ |
| Event class     | `src/app/<module>/events/<event-name>.event.ts`    | `orders/events/order-created.event.ts`           |
| Consumer class  | `src/app/<module>/events/<event-name>.consumer.ts` | `notifications/events/order-created.consumer.ts` |
| Consumer import | `src/app/<module>/main.ts`                         | `import "./events/order-created.consumer"`       |
| Herald config   | `src/config/herald.ts`                             | —                                                |

---

## Quick Reference — Public API

```typescript
import {
  // Connection
  connectToBroker, // connect to a broker (usually done by HeraldConnector)

  // Accessor
  herald, // herald() → default broker, herald("name") → named broker
  heraldChannel, // shorthand for herald().channel("name")

  // Publishing
  publishEvent, // publish an EventMessage to default broker

  // Subscribing
  subscribeConsumer, // subscribe an EventConsumer class to default broker

  // Classes
  EventMessage, // base class for typed events
  EventConsumer, // base class for typed consumers

  // Factories
  defineEvent, // create an EventMessage class inline
  defineConsumer, // create an EventConsumer class inline

  // Decorators
  Consumable, // auto-register consumer on broker connect

  // Registry
  brokerRegistry, // global broker registry (advanced use)
} from "@warlock.js/herald";
```
