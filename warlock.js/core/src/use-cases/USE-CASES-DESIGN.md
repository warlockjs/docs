# Use Cases Feature — Design & Implementation Guide

> **For AI Agent:** This document describes the full design for the Warlock.js use case system. Implement everything described here. Read all source files in this directory first before making changes.

---

## Overview

A use case executor — a function factory that wraps business logic with guards, validation, middleware, lifecycle events, retries, and benchmarking. Returns a typed async handler.

```typescript
const placeOrder = useCase<Order, PlaceOrderInput>({
  name: "placeOrder",
  schema: placeOrderSchema,
  guards: [requireAuth, requireActiveAccount],
  before: [enrichWithAddress, calculateTax],
  handler: placeOrderHandler,
  after: [sendConfirmationEmail, notifyWarehouse],
  retries: { count: 2, delay: 500 },
  benchmark: { latencyRange: { up: 300, down: 2000 } },
});

// Called N times
const order = await placeOrder(inputData, { ctx: { token } });
```

---

## Execution Pipeline

```
useCase(data, { ctx, onCompleted, ... })
│
├─ 1. GUARDS (sequential, can throw, enriches ctx only)
│    ├─ Receives: (Readonly<Input>, ctx)
│    ├─ Can: mutate ctx, throw to abort
│    └─ Cannot: mutate input data
│
├─ 2. SCHEMA VALIDATION (via @warlock.js/seal)
│    └─ Validates input → throws BadSchemaUseCaseError
│
├─ 3. BEFORE MIDDLEWARE (sequential, can transform data)
│    ├─ Receives: (data, ctx)
│    ├─ Returns: transformed data (or original)
│    └─ Can: mutate ctx, transform data, throw to abort
│
├─ 4. HANDLER (pure business logic)
│    ├─ Receives: (validatedData, ctx)
│    └─ Returns: Output
│
├─ 5. AFTER MIDDLEWARE (sequential, fire-and-forget)
│    ├─ Receives: (output, ctx)
│    ├─ Purpose: side effects (emails, webhooks, analytics)
│    └─ Failures are logged, don't affect response
│
└─ 6. LIFECYCLE EVENTS (invocation → use case → global)
     ├─ onExecuting, onCompleted, onError
     └─ Benchmark recording
```

---

## Type Definitions

### Core Types

```typescript
type Guard<Input> = (data: Readonly<Input>, ctx: UseCaseContext) => void | Promise<void>;

type BeforeMiddleware<Input> = (data: Input, ctx: UseCaseContext) => Input | Promise<Input>;

type AfterMiddleware<Output> = (output: Output, ctx: UseCaseContext) => void | Promise<void>;
```

### UseCase Options

```typescript
type UseCase<Output = any, Input = any> = {
  name: string;
  handler: (filteredData: Input, ctx: UseCaseContext) => Promise<Output>;
  schema?: ObjectValidator;
  guards?: Guard<Input>[];
  before?: BeforeMiddleware<Input>[];
  after?: AfterMiddleware<Output>[];
  onExecuting?: (ctx: OnExecutingUseCaseContext) => void;
  onCompleted?: (result: UseCaseResult<Output>) => void;
  onError?: (ctx: UseCaseErrorResult) => void;
  retries?: { count: number; delay?: number };
  benchmark?: boolean | { latencyRange: { up: number; down: number } };
};
```

### Runtime Options (passed at call time)

```typescript
type UseCaseRuntimeOptions<Output = any> = {
  id?: string;
  ctx?: UseCaseContext;
  onExecuting?: (ctx: OnExecutingUseCaseContext) => void;
  onCompleted?: (result: UseCaseResult<Output>) => void;
  onError?: (ctx: UseCaseErrorResult) => void;
};
```

---

## Configuration

App-level config at `src/config/use-cases.ts`. Accessed via `config.get("use-cases")`.

```typescript
type UseCaseConfigurations = {
  benchmark?: {
    enabled?: boolean;
    latencyRange?: { up: number; down: number };
  };
  retries?: { count?: number; delay?: number };
  history?: {
    enabled?: boolean;
    ttl?: number; // seconds
  };
};
```

**Resolution hierarchy:**

1. Per use case option (highest)
2. App config `src/config/use-cases.ts`
3. Framework hardcoded defaults (lowest)

---

## Benchmark Module (Separate)

Benchmark is a **standalone module** consumed by use cases but usable independently.

### Location: `@warlock.js/core/src/benchmark/`

```
benchmark/
├── benchmark.ts          # Core measure() function
├── types.ts              # BenchmarkResult, BenchmarkOptions
└── index.ts
```

### API

```typescript
// Standalone
import { measure } from "@warlock.js/core/benchmark";
const result = await measure("db-query", async () => db.query("..."));
// { value, latency: 142, state: "excellent" }

// Use case integration (internally calls measure)
useCase({ benchmark: true }); // uses app config defaults
useCase({ benchmark: { latencyRange: { up: 100, down: 500 } } });
```

### Classification

- `latency <= up` → `"excellent"`
- `latency >= down` → `"poor"`
- Otherwise → `"good"`

---

## History Storage

Use **`@warlock.js/cache`** instead of in-memory Map. The registry (`useCaseRegister`) stays in-memory (lightweight metadata), but execution history goes to cache.

Cache key pattern:

```
usecase:history:{name}:{id}
usecase:history:{name}:list
```

Configurable TTL and max entries via app config.

---

## Transport Agnosticism

Use cases are NOT coupled to HTTP. They can be called from route handlers, CLI commands, queue workers, cron jobs, tests, or other use cases.

---

## Implementation Instructions

### Step 1: Create Benchmark Module

Create `@warlock.js/core/src/benchmark/` with:

1. **`types.ts`** — `BenchmarkOptions`, `BenchmarkResult`
2. **`benchmark.ts`** — `measure(name, fn, options?)` function that:
   - Records `startTime`
   - Awaits `fn()`
   - Records `endTime`
   - Classifies latency against thresholds
   - Returns `{ value, latency, state }`
   - Reads defaults from `config.get("use-cases")` if no options provided
3. **`index.ts`** — exports

### Step 2: Update `types.ts`

1. Add `Guard<Input>`, `BeforeMiddleware<Input>`, `AfterMiddleware<Output>` types
2. Add `guards?`, `before?`, `after?` to `UseCase` type
3. Add `UseCaseConfigurations` type and export it
4. Fix typo: `OnExeuctingUseCaseContext` → `OnExecutingUseCaseContext`

### Step 3: Refactor `usecase.ts`

Update the executor pipeline in this order:

1. Run **guards** sequentially before schema validation
   - Pass `data` as `Readonly<Input>` (enforced via type, not runtime freeze)
   - If any guard throws, abort immediately
2. Run **schema validation** (existing logic)
3. Run **before middleware** sequentially after validation
   - Each middleware receives current `data` and returns (potentially transformed) `data`
   - Chain: output of one becomes input of next
4. Run **handler** with final transformed data (existing logic)
5. Run **after middleware** sequentially after handler succeeds
   - Wrap each in try/catch — log errors but don't re-throw
   - Pass handler output and ctx
6. Read defaults from `config.get("use-cases")` and merge with per-use-case options
7. Replace inline benchmark logic with `measure()` from the benchmark module

### Step 4: Fix Registry

1. Rename file: `use-cases-registery.ts` → `use-cases-registry.ts`
2. Wire up `addUseCaseHistory` — call it from `usecase.ts` after execution completes
3. Replace in-memory history Map with `@warlock.js/cache` calls
4. Add dev-mode warning if a use case name is registered twice

### Step 5: Update `index.ts`

1. Export all new types
2. Export benchmark module
3. Export `guard()` helper function (optional utility):

```typescript
export function guard<Input>(
  fn: (data: Readonly<Input>, ctx: UseCaseContext) => void | Promise<void>,
): BeforeMiddleware<Input> {
  return async (data, ctx) => {
    await fn(data, ctx);
    return data;
  };
}
```

4. Remove the TODO comments

### Step 6: Add Config Type to Registry

Add `UseCaseConfigurations` to the config type registry so `config.get("use-cases")` returns the correct type. Check how `database` config is registered in the config types system (see `@warlock.js/core/src/config/types.ts`).

### Step 7: Add Tests

Tests live in `./@warlock.js/core/tests/` (centralized, outside `src/` to avoid dev server transpilation and file watcher interference).

Test runner: **Vitest**

#### Test Structure

```
@warlock.js/core/tests/
├── use-cases/
│   ├── usecase.test.ts              # Core executor pipeline
│   ├── guards.test.ts               # Guard execution + ordering
│   ├── before-middleware.test.ts     # Data transformation chain
│   ├── after-middleware.test.ts      # Fire-and-forget side effects
│   ├── lifecycle-events.test.ts     # onExecuting/onCompleted/onError at 3 levels
│   ├── retries.test.ts              # Retry mechanism
│   └── registry.test.ts            # Registration + call counting
├── benchmark/
│   └── measure.test.ts              # Standalone benchmark
└── setup.ts                         # Shared test utilities
```

#### Test Cases to Cover

**`usecase.test.ts` — Core Pipeline**

- Executes handler and returns output
- Passes validated data to handler
- Schema validation failure throws `BadSchemaUseCaseError`
- Full pipeline order: guards → validation → before → handler → after → events
- Use case with no optional features (just name + handler)
- Handles async handlers

**`guards.test.ts`**

- Guards run before schema validation
- Guards execute in declared order (sequential)
- Guard can enrich ctx (set `ctx.currentUser`)
- Guard throwing aborts entire pipeline (handler never called)
- Guards receive `Readonly<Input>` — data is not mutated
- Subsequent guard can access ctx set by previous guard
- Empty guards array works fine

**`before-middleware.test.ts`**

- Before middleware runs after validation
- Middleware can transform data (return new object)
- Middleware chain: output of one is input of next
- Middleware can enrich ctx
- Middleware throwing aborts pipeline
- Original input data is not passed to handler if middleware transforms it
- Empty before array works fine

**`after-middleware.test.ts`**

- After middleware runs after handler succeeds
- After middleware receives handler output
- After middleware failure is caught and logged — does NOT throw
- After middleware failure does NOT affect the returned output
- Multiple after middleware run sequentially
- After middleware does NOT run if handler throws
- Empty after array works fine

**`lifecycle-events.test.ts`**

- `onExecuting` fires before handler
- `onCompleted` fires after handler with result snapshot
- `onError` fires when handler throws
- Invocation-level events fire first
- Use case-level events fire second
- Global events fire last
- Global events with `globalUseCasesEvents` + unsubscribe works

**`retries.test.ts`**

- No retries by default
- Retries N times before throwing
- Stops retrying on first success
- Respects delay between retries
- `currentRetry` in result reflects actual attempt count

**`registry.test.ts`**

- `registerUseCase` registers use case
- `getUseCase` retrieves by name
- Call counts increment correctly (success/failed/total)
- Duplicate name warning in dev mode

**`measure.test.ts` — Benchmark**

- Returns value from measured function
- Returns latency in milliseconds
- Classifies as "excellent" when below `up` threshold
- Classifies as "poor" when above `down` threshold
- Classifies as "good" when between thresholds
- Works with async functions
- Works standalone without use case

---

## Key Design Rules

1. **Guards run BEFORE validation** — no point validating data if the user isn't authorized
2. **Guards are sequential** — order matters (auth guard must run before permission guard)
3. **Before middleware returns data** — functional transformation, not mutation
4. **After middleware is fire-and-forget** — failures logged, never propagated
5. **Benchmark measures full pipeline** — guards through handler (excludes after middleware)
6. **Registry stays in-memory** — it's metadata about what exists
7. **History goes to cache** — execution data that grows unboundedly
8. **Use cases are transport-agnostic** — no HTTP imports, no request/response dependencies
9. **Tests live in `@warlock.js/core/tests/`** — outside `src/` to avoid dev server interference
