# Agent Task: Production + Advanced + Upcoming Sections

## Assignment

**Sections**: Production, Advanced, Upcoming Features  
**Pages**: 15 (3 + 10 + 2)  
**Priority**: LOW (Batch 4)  
**Status**: ⏳ Not Started

---

## Production Pages (3)

| #   | File                          | Status |
| --- | ----------------------------- | ------ |
| 1   | `production/building.mdx`     | ⬜     |
| 2   | `production/deployment.mdx`   | ⬜     |
| 3   | `production/optimization.mdx` | ⬜     |

## Advanced Pages (10)

| #   | File                            | Status |
| --- | ------------------------------- | ------ |
| 4   | `advanced/connectors.mdx`       | ⬜     |
| 5   | `advanced/herald.mdx`           | ⬜     |
| 6   | `advanced/queues.mdx`           | ⬜     |
| 7   | `advanced/context.mdx`          | ⬜     |
| 8   | `advanced/multi-tenancy.mdx`    | ⬜     |
| 9   | `advanced/image-processing.mdx` | ⬜     |
| 10  | `advanced/localization.mdx`     | ⬜     |
| 11  | `advanced/logging.mdx`          | ⬜     |
| 12  | `advanced/warlock-config.mdx`   | ⬜     |
| 13  | `advanced/utilities.mdx`        | ⬜     |

## Upcoming Features Pages (2)

| #   | File                             | Status |
| --- | -------------------------------- | ------ |
| 14  | `upcoming-features/roadmap.mdx`  | ⬜     |
| 15  | `upcoming-features/features.mdx` | ⬜     |

---

## STEP 1: Read Source Code First

### Production

```
@warlock.js/core/src/production/
└── Build and deployment utilities
```

### Advanced Topics

```
# Connectors
@warlock.js/core/src/*/connectors/

# Herald (Message Bus)
@warlock.js/herald/src/

# Context
@warlock.js/context/src/

# Image Processing
@warlock.js/core/src/image/

# Localization
(Check core localization features)

# Logger
@warlock.js/logger/src/

# Warlock Config
@warlock.js/core/src/warlock-config/
```

---

## Key Documentation Points

### Connectors

- What is a connector?
- Built-in connectors (Database, Cache, Herald, Storage)
- Connector lifecycle
- Creating custom connectors

### Herald (Message Bus)

- RabbitMQ integration
- `communicator.ts` config
- Channels and consumers
- `@Consumable` decorator

### Multi-Tenancy

- Context Manager pattern
- Middleware-based tenant switching
- Database/storage per tenant

### Queues (Future)

- Bull connector (planned)
- Job processing pattern
- Mark as "Coming Soon"

### Upcoming Features

- MySQL Driver
- WebSockets
- Queues/Background Jobs
- Postman Generator
- Swagger/OpenAPI
- Unit Testing (Vest)

---

## STEP 2: Write Documentation

### Output Locations

```
docs/warlock-docs-latest/docs/warlock/production/
├── _category_.json
├── building.mdx
├── deployment.mdx
└── optimization.mdx

docs/warlock-docs-latest/docs/warlock/advanced/
├── _category_.json
├── connectors.mdx
├── herald.mdx
├── queues.mdx
├── context.mdx
├── multi-tenancy.mdx
├── image-processing.mdx
├── localization.mdx
├── logging.mdx
├── warlock-config.mdx
└── utilities.mdx

docs/warlock-docs-latest/docs/warlock/upcoming-features/
├── _category_.json
├── roadmap.mdx
└── features.mdx
```

---

## Code Examples

### Connectors

```typescript
// Custom connector example
import { Connector } from "@warlock.js/core";

export class SearchConnector extends Connector {
  public static name = "search";

  public async connect() {
    // Initialize Elasticsearch/Algolia
  }

  public async disconnect() {
    // Cleanup
  }
}
```

### Multi-Tenancy

```typescript
// Tenant middleware
import { context } from "@warlock.js/context";

export async function tenantMiddleware(request, response) {
  const tenantId = request.header("X-Tenant-ID");

  context.set("tenant", tenantId);
  context.set("database", `tenant_${tenantId}`);
}
```

### Herald

```typescript
// src/config/communicator.ts
export const communicator = {
  driver: "rabbitmq",
  rabbitmq: {
    url: env("RABBITMQ_URL"),
  },
};
```

---

## Completion Criteria

- [ ] All 15 pages written
- [ ] Connectors pattern fully documented
- [ ] Herald integration documented
- [ ] Multi-tenancy with examples
- [ ] Upcoming features listed
- [ ] PROGRESS.md updated

---

## Notes

[Agent: Add notes here during work]
