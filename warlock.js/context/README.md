# @warlock.js/context

A lightweight, type-safe context management library built on Node.js's `AsyncLocalStorage`. Provides a simple and unified way to share context across async operations in your applications.

Part of the [Warlock.js](https://github.com/warlockjs) ecosystem.

## Features

- 🚀 **Simple API** - Intuitive methods for context management
- 🔒 **Type-safe** - Full TypeScript support with generics
- 🔗 **Chainable** - Fluent API for registering multiple contexts
- 🎯 **Extensible** - Abstract base class for custom context implementations
- 📦 **Zero dependencies** - Only uses Node.js built-in `AsyncLocalStorage`
- 🔄 **Multi-context support** - Orchestrate multiple contexts together

## Installation

```bash
npm install @warlock.js/context
```

```bash
yarn add @warlock.js/context
```

```bash
pnpm add @warlock.js/context
```

## Quick Start

### Creating a Custom Context

Extend the `Context` abstract class to create your own typed context:

```typescript
import { Context, contextManager } from "@warlock.js/context";

// Define your store type
interface UserContextStore {
  userId: string;
  role: "admin" | "user";
  tenantId: string;
}

// Create your context class
class UserContext extends Context<UserContextStore> {
  /**
   * Called when contextManager executese buildStores()
   */
  public buildStore(payload?: Record<string, any>): UserContextStore {
    // Initialize from payload or defaults
    return {
      userId: payload?.userId ?? "",
      role: payload?.role ?? "user",
      tenantId: payload?.tenantId ?? "",
    };
  }
}

// Create a singleton instance
export const userContext = new UserContext();
// register it in the context manager
contextManager.register("user", userContext);
```

### Using the Context

#### With `run()` - Scoped execution

```typescript
await userContext.run(
  { userId: "123", role: "admin", tenantId: "acme" },
  async () => {
    // Context is available throughout this async scope
    const userId = userContext.get("userId"); // '123'
    const role = userContext.get("role"); // 'admin'

    await someAsyncOperation(); // Context propagates through async calls
  }
);
```

#### With `enter()` - Middleware-style

```typescript
// In your middleware
function authMiddleware(req, res, next) {
  userContext.enter({
    userId: req.user.id,
    role: req.user.role,
    tenantId: req.headers["x-tenant-id"],
  });

  next(); // Context is available for the rest of the request
}
```

### Managing Multiple Contexts

Use the global `contextManager` to orchestrate multiple contexts together:

```typescript
import { Context, contextManager } from "@warlock.js/context";

// Define your contexts
class RequestContext extends Context<{ requestId: string; path: string }> {
  /**
   * Called when contextManager executese buildStores()
   */
  public buildStore(payload?: Record<string, any>) {
    return { requestId: payload?.requestId ?? "", path: payload?.path ?? "" };
  }
}

class DatabaseContext extends Context<{ dataSource: string }> {
  /**
   * Called when contextManager executese buildStores()
   */
  public buildStore(payload?: Record<string, any>) {
    return { dataSource: payload?.dataSource ?? "primary" };
  }
}

// Create instances and register them immediately
export const requestContext = new RequestContext();
contextManager.register("request", requestContext);

export const databaseContext = new DatabaseContext();
contextManager.register("database", databaseContext);

// Build stores first - each context's buildStore() is called with the payload
const stores = contextManager.buildStores({
  requestId: "req-123",
  path: "/api/users",
  dataSource: "replica",
});

// Run all contexts together
await contextManager.runAll(stores, async () => {
  // All contexts are active!
  const reqId = requestContext.get("requestId"); // 'req-123'
  const ds = databaseContext.get("dataSource"); // 'replica'
});
```

## API Reference

### `Context<TStore>` (Abstract Class)

The base class for all context implementations.

#### Methods

| Method                                                          | Description                                              |
| --------------------------------------------------------------- | -------------------------------------------------------- |
| `run<T>(store: TStore, callback: () => Promise<T>): Promise<T>` | Execute a callback within a new context scope            |
| `enter(store: TStore): void`                                    | Enter a context without a callback (middleware-style)    |
| `update(updates: Partial<TStore>): void`                        | Merge new data into the current context                  |
| `getStore(): TStore \| undefined`                               | Get the entire current context store                     |
| `get<K extends keyof TStore>(key: K): TStore[K] \| undefined`   | Get a specific value from context                        |
| `set<K extends keyof TStore>(key: K, value: TStore[K]): void`   | Set a specific value in context                          |
| `clear(): void`                                                 | Clear the current context                                |
| `hasContext(): boolean`                                         | Check if currently within a context                      |
| `buildStore(payload?: Record<string, any>): TStore`             | **Abstract** - Override to provide custom initialization |

### `ContextManager`

Orchestrates multiple contexts together.

#### Methods

| Method                                                                           | Description                                                      |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `register(name: string, context: Context<any>): this`                            | Register a context with a unique name                            |
| `unregister(name: string): boolean`                                              | Remove a registered context                                      |
| `runAll<T>(stores: Record<string, any>, callback: () => Promise<T>): Promise<T>` | Run all contexts together                                        |
| `enterAll(stores: Record<string, any>): void`                                    | Enter all contexts at once                                       |
| `clearAll(): void`                                                               | Clear all contexts                                               |
| `buildStores(payload?: Record<string, any>): Record<string, any>`                | Build stores for all contexts using their `buildStore()` methods |
| `getContext<T>(name: string): T \| undefined`                                    | Get a registered context by name                                 |
| `hasContext(name: string): boolean`                                              | Check if a context is registered                                 |

### Global Context Manager

A pre-configured singleton is exported for convenience:

```typescript
import { contextManager } from "@warlock.js/context";

contextManager.register("myContext", myContextInstance);
```

## Real-World Examples

### Multi-Tenant Application

```typescript
import { Context, contextManager } from "@warlock.js/context";

interface TenantStore {
  tenantId: string;
  tenantName: string;
  config: Record<string, any>;
}

class TenantContext extends Context<TenantStore> {
  /**
   * Called when contextManager executese buildStores()
   */
  public buildStore(payload?: Record<string, any>): TenantStore {
    return {
      tenantId: payload?.tenantId ?? "",
      tenantName: payload?.tenantName ?? "",
      config: payload?.config ?? {},
    };
  }

  // Convenience getters
  public get tenantId() {
    return this.get("tenantId");
  }

  public get config() {
    return this.get("config");
  }
}

export const tenantContext = new TenantContext();

// In your middleware
app.use(async (req, res, next) => {
  const tenant = await getTenantFromRequest(req);

  tenantContext.enter({
    tenantId: tenant.id,
    tenantName: tenant.name,
    config: tenant.config,
  });

  next();
});

// Anywhere in your application
function getDatabaseConnection() {
  const tenantId = tenantContext.tenantId;
  return getConnectionForTenant(tenantId);
}
```

### Request Tracing

```typescript
import { Context } from "@warlock.js/context";
import { randomUUID } from "crypto";

interface TraceStore {
  traceId: string;
  spanId: string;
  startTime: number;
}

class TraceContext extends Context<TraceStore> {
  /**
   * Called when contextManager executese buildStores()
   */
  public buildStore(): TraceStore {
    return {
      traceId: randomUUID(),
      spanId: randomUUID(),
      startTime: Date.now(),
    };
  }

  public get traceId() {
    return this.get("traceId");
  }

  public log(message: string) {
    const store = this.getStore();
    console.log(`[${store?.traceId}] ${message}`);
  }
}

export const traceContext = new TraceContext();

// Usage
app.use((req, res, next) => {
  const stores = { trace: traceContext.buildStore() };

  traceContext.run(stores.trace, async () => {
    traceContext.log(`Request started: ${req.path}`);
    await next();
    traceContext.log(
      `Request completed in ${Date.now() - stores.trace.startTime}ms`
    );
  });
});
```

### Combining with ContextManager

```typescript
import { contextManager } from "@warlock.js/context";
import { requestContext } from "./request-context";
import { traceContext } from "./trace-context";
import { tenantContext } from "./tenant-context";

// Register all contexts at app startup
contextManager
  .register("request", requestContext)
  .register("trace", traceContext)
  .register("tenant", tenantContext);

// In your request handler
app.use(async (req, res, next) => {
  // Build all stores from the request payload
  const stores = contextManager.buildStores({
    request: req,
    response: res,
    tenantId: req.headers["x-tenant-id"],
  });

  // Run all contexts together
  await contextManager.runAll(stores, async () => {
    await next();
  });
});
```

## Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.0 (for development)

## License

MIT © [hassanzohdy](https://github.com/hassanzohdy)

## Related Packages

- [@warlock.js/core](https://github.com/warlockjs/core) - Core Warlock.js framework
- [Warlock.js](https://github.com/warlockjs) - Full-featured Node.js framework
