# Agent Task: Cache Section

## Assignment

**Section**: Cache  
**Pages**: 4  
**Priority**: MEDIUM (Batch 3)  
**Status**: ⏳ Not Started

---

## Pages to Write

| #   | File                | Status |
| --- | ------------------- | ------ |
| 1   | `introduction.mdx`  | ⬜     |
| 2   | `configuration.mdx` | ⬜     |
| 3   | `usage.mdx`         | ⬜     |
| 4   | `drivers.mdx`       | ⬜     |

---

## STEP 1: Read Source Code First

### Cache Package

```
@warlock.js/cache/src/
├── cache-manager.ts       # Main cache class
├── drivers/               # Redis, Memory, LRU
├── types.ts
└── index.ts
```

### Core Integration

```
@warlock.js/core/src/cache/
├── index.ts               # Core cache integration
└── ...
```

---

## STEP 2: Key Features to Document

### Cache Drivers

- Memory (default, dev)
- Redis (production)
- LRU cache

### Cache Operations

- `cache.get(key)`
- `cache.set(key, value, ttl)`
- `cache.remember(key, ttl, callback)`
- `cache.forget(key)`
- `cache.flush()`

### Framework Integration

- Cache connector
- Using with Repositories
- Tagged caching

---

## STEP 3: Write Documentation

### Output Location

```
docs/warlock-docs-latest/docs/warlock/cache/
├── _category_.json
├── introduction.mdx        # Cache overview
├── configuration.mdx       # Connector setup
├── usage.mdx               # API usage
└── drivers.mdx             # Redis, Memory, LRU
```

---

## Code Example Pattern

```typescript
// src/config/cache.ts
import { env } from "@warlock.js/core";

export const cache = {
  driver: env("CACHE_DRIVER", "memory"),

  drivers: {
    memory: {},
    redis: {
      host: env("REDIS_HOST", "localhost"),
      port: env("REDIS_PORT", 6379),
    },
  },
};
```

```typescript
// Using cache
import { cache } from "@warlock.js/core";

// Set value
await cache.set("user:123", userData, "1h");

// Get value
const user = await cache.get("user:123");

// Remember pattern
const settings = await cache.remember("settings", "24h", async () => {
  return await Settings.find();
});

// Delete
await cache.forget("user:123");
```

---

## Completion Criteria

- [ ] All 4 pages written
- [ ] All drivers documented
- [ ] Framework connector documented
- [ ] PROGRESS.md updated

---

## Notes

[Agent: Add notes here during work]
