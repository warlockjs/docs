# Agent Task: Database Section

## Assignment

**Section**: Database  
**Pages**: 5  
**Priority**: HIGH (Batch 2)  
**Status**: ⏳ Not Started

---

## Pages to Write

| #   | File                | Status |
| --- | ------------------- | ------ |
| 1   | `introduction.mdx`  | ⬜     |
| 2   | `configuration.mdx` | ⬜     |
| 3   | `migrations.mdx`    | ⬜     |
| 4   | `seeds.mdx`         | ⬜     |
| 5   | `examples.mdx`      | ⬜     |

---

## STEP 1: Read Source Code First

### Framework Database Integration

```
@warlock.js/core/src/database/
├── index.ts                # Main exports
├── connection.ts           # DB connection management
├── config.ts               # Database config
└── ...

@warlock.js/core/src/cli/commands/
├── migrate*.ts             # Migration commands
├── seed*.ts                # Seed commands
└── ...
```

### Cascade (ORM Package)

```
@warlock.js/cascade/src/
├── migration/              # Migration system
├── data-source/            # DataSource management
└── ...
```

### Key Understanding

**Framework handles**:

- Collecting migrations from modules
- Running seeds
- CLI commands (`warlock migrate`, `warlock seed`)
- Database configuration

**Cascade handles**:

- Actual migration execution
- Model definitions
- Query building
- Transactions

---

## STEP 2: Key Documentation Points

### Migrations

- Framework **collects** migrations from `src/app/*/migrations/`
- Framework passes them to **Cascade's migration system**
- CLI: `warlock migrate`, `warlock migrate:rollback`, etc.

### Seeds

- Seeds are a **framework operation**, not database
- Location: `src/app/*/seeds/`
- CLI: `warlock seed`

### Configuration

- `src/config/database.ts`
- Connection settings for MongoDB/PostgreSQL
- Multiple connections support

---

## STEP 3: Write Documentation

### Output Location

```
docs/warlock-docs-latest/docs/warlock/database/
├── _category_.json
├── introduction.mdx        # Framework DB features overview
├── configuration.mdx       # database.ts config
├── migrations.mdx          # How framework collects & runs migrations
├── seeds.mdx               # Seeding data
└── examples.mdx            # Working with Cascade models
```

### Page Content Guidelines

**introduction.mdx**

- Explain framework + Cascade relationship
- Point to Cascade docs for ORM details
- Show what's framework-specific

**migrations.mdx**

- Module-based migration collection
- Migration file structure
- CLI commands
- Link to Cascade for migration writing syntax

**seeds.mdx**

- Creating seeders
- Running seeds
- Environment-specific seeds

**examples.mdx**

- Basic CRUD with models
- Connecting to database
- Using with Repositories

---

## Code Example Pattern

```typescript
// src/config/database.ts
import { env } from "@warlock.js/core";

export const database = {
  driver: env("DB_DRIVER", "mongodb"),

  mongodb: {
    url: env("MONGO_URL"),
    database: env("MONGO_DATABASE"),
  },

  postgres: {
    host: env("PG_HOST"),
    port: env("PG_PORT", 5432),
    database: env("PG_DATABASE"),
    user: env("PG_USER"),
    password: env("PG_PASSWORD"),
  },
};
```

---

## Completion Criteria

- [ ] All 5 pages written
- [ ] Clear distinction: Framework vs Cascade responsibilities
- [ ] Migration CLI commands documented
- [ ] Seeds documented as framework feature
- [ ] Links to Cascade docs included
- [ ] PROGRESS.md updated

---

## Notes

[Agent: Add notes here during work]
