# Warlock.js V4 — Brainstorm Session Context

> **Purpose:** Continuation context for AI conversations about Warlock.js v4 launch readiness.
> **Last Updated:** 2026-04-10
> **Original Conversation:** c1a7e01e-e3c7-42db-8385-4665ca640d9e

---

## Who's Working

- **Hasan** — Framework author, sole developer. CTO-level. Prefers accuracy over politeness. Address him by name.
- **AI (Opus)** — Strategic planning, architecture, review. Avoid scanning files unless asked.
- **AI (Gemini Flash 3)** — Cheap recon tasks like package inventories, doc audits.
- **AI (Sonnet)** — Medium tasks: skill files, tests, docs.
- **AI (Gemini 3.1 Pro)** — Large context tasks when needed (big file analysis).
- **Key Rule:** Minimize token usage. Talk > scan. Ask questions > assume. Do NOT scan source files unless explicitly asked.

---

## Framework Overview

Warlock.js is a Node.js/TypeScript backend framework built on **Fastify**. Version 4.0.165.

### Package Types

- **SAP (Standalone):** Can work outside the framework. Some SAP packages have optional framework integration configs (e.g., Seal has file validation plugin in core, Cascade has embed validator plugin).
- **TCP (Tightly Coupled):** Requires core to exist in the project.

### Packages (9 active, 1 excluded)

| Package     | Type | Purpose                                                                      | Key Deps                    |
| ----------- | ---- | ---------------------------------------------------------------------------- | --------------------------- |
| `core`      | TCP  | Framework core (Fastify, routing, middleware, storage, CLI, mail, encryption) | All others                  |
| `auth`      | TCP  | JWT authentication, guards, route protection                                 | cascade, core, logger, seal |
| `cascade`   | SAP  | ORM — PostgreSQL + MongoDB dual-driver                                       | context, logger, seal       |
| `seal`      | SAP  | Validation: Mutators → Validators → Transformers. Standard Schema compliant  | —                           |
| `cache`     | SAP  | Cache manager — Redis, Memory, LRU, File, Null drivers                       | logger                      |
| `herald`    | SAP  | Message bus — RabbitMQ (Kafka types ready, no driver yet)                    | logger, seal                |
| `logger`    | SAP  | Logging — Console, File, JSON File channels                                  | —                           |
| `scheduler` | SAP  | Cron/scheduled jobs with retry, overlap prevention, timezone                 | —                           |
| `context`   | SAP  | AsyncLocalStorage manager                                                    | —                           |

`create-warlock` — CLI scaffolding. Excluded from all planning (just boilerplate).

### Priority Tiers

- **P0:** core, cascade, seal, auth — users hit these in the first 30 minutes
- **P1:** logger, cache, context — used immediately but simpler surface area
- **P2:** herald, scheduler — advanced features, smaller initial audience

### Core ↔ Auth Circular Dependency

Core depends on auth directly. Auth peer-depends on core. This is intentional (TCP pattern) — they must be worked on together when changes cross boundaries.

---

## What We're Doing (Four Workstreams)

### Workstream A: AI Skill Files — DO FIRST

Skill files are the **foundation** that makes everything else parallelizable. Without them, every agent needs to scan the full codebase.

- Location: `./warlock.js/<package>/SKILLS.md` (inside each package)
- Format: **Markdown** with standardized sections (template below)
- Content: Public API surface, internal architecture patterns, modification guidelines
- **Private methods NOT listed** — instead document internal patterns/rules an AI must follow (e.g., "if you add a query method, implement it in BOTH MongoQueryBuilder and PostgresQueryBuilder")
- AI agents MUST auto-update SKILLS.md when modifying any package code
- Enforce via `.warlock-rules.md` at repo root (to be created — loaded as project rules by all AI tools)

#### Skill File Template

```markdown
# @warlock.js/<package> — AI Skill File

> Auto-maintained. Last updated: YYYY-MM-DD

## Identity
- **Purpose:** One-sentence description
- **Type:** SAP | TCP
- **Internal deps:** @warlock.js/x, @warlock.js/y
- **External deps:** fastify, dayjs, etc.

## Architecture
Brief description of internal architecture / design patterns used.

## Public API Surface
### Classes
### Functions
### Decorators
### Types / Interfaces
### Configuration

## Key Patterns & Conventions
## Gotchas & Warnings

## Modification Guidelines
When modifying this package:
1. Always update this SKILLS.md
2. Run tests: <command>
3. Update docs if changing behavior
4. If adding a new export, add to barrel file src/index.ts
```

### Workstream B: Testing

- Framework: **Vitest** (logger/cascade still have jest in package.json — needs migration)
- Coverage target: 60-70% on P0, 30-40% on P1
- Order: seal → logger → context → scheduler → cache → cascade → auth → core
- Tests always in `./warlock.js/<package>/tests/`
- Test categories:
  - **Unit (pure functions):** Validators, mutators, utilities — perfect for AI generation (Flash/Sonnet)
  - **Integration (DB required):** Cascade models, queries, relations — needs setup (Opus/senior Sonnet)
  - **HTTP (server required):** Routes, middleware, auth flows — needs running server and fixture setup

### Workstream C: Documentation

- Docusaurus project at project root (`./docs/`)
- Currently 100+ pages — mix of correct, outdated, and missing content
- **Wait for doc audit results (Task 002) before planning specific content**
- Strategy: **Concentric circles** — start from what users hit first, expand outward:
  1. **Layer 1 (Day 1):** Getting Started — install, first API, project structure (5-7 pages)
  2. **Layer 2 (Week 1):** Core Concepts — routing, request/response, models, validation, auth (15-20 pages)
  3. **Layer 3 (Month 1):** Package Deep Dives — one section per package (30-40 pages)
  4. **Layer 4 (Ongoing):** API Reference — auto-generated from skill files
- Each doc page can be written by an isolated agent using only SKILLS.md + existing doc page as input
- Target all skill levels — framework is designed to be easier than Express/NestJS for juniors

### Workstream D: Marketing — AFTER docs are solid

- USPs:
  1. **Two-Database ORM** — same API for PostgreSQL and MongoDB (rare in Node ecosystem)
  2. **Batteries Included** — auth, validation, caching, scheduling, message bus — all integrated
  3. **Standard Schema V1 compliance** in Seal — ecosystem compatibility
  4. **MongoDB sync system** — automatic embedded document normalization (unique feature)
  5. **Easy learning curve** + production-ready architecture
- Website: https://warlock.js.org
- No specific distribution strategy yet (to be planned after docs)

---

## Agent Assignment Matrix

| Task                                         | Model            | Why                                        |
| -------------------------------------------- | ---------------- | ------------------------------------------ |
| Strategic planning, architecture, review     | **Opus**         | Deep reasoning, planning                   |
| Package inventories, doc audits, test audits | **Gemini Flash** | Fast, cheap, repetitive                    |
| Write SKILLS.md files                        | **Sonnet**       | Good balance of understanding + speed      |
| Write unit tests (seal, logger, scheduler)   | **Sonnet/Flash** | Code generation, moderate reasoning        |
| Write integration tests (cascade, auth)      | **Opus**         | Complex, needs deep understanding          |
| Update/write documentation                   | **Sonnet**       | Good prose, understands code               |
| Review generated content                     | **Opus**         | Quality gate                               |
| Marketing content                            | **Sonnet**       | Good writing                               |

### Token Budget Strategy

- **Flash**: Run freely on bulk recon tasks — cheapest
- **Sonnet**: Run per-package to control scope — parallelizable
- **Gemini 3.1 Pro**: Use sparingly for big files only
- **Opus**: Use strategically for planning and review — avoid scanning

---

## Execution Phases

### Phase 0: Reconnaissance ✅ Task 001 Complete, Tasks 002-003 Pending

#### Task 001 — Package Inventories ✅ COMPLETE

- **Task file:** `./tasks/001-inventory-package-tree.md`
- **Output:** `./tasks/inventory/<package>.md` per package
- All 9 packages inventoried:
  - context, logger, scheduler, seal, cache, cascade, herald, auth → individual `.md` files
  - core → Split into 9 sub-files under `tasks/inventory/core/` (~87KB total)
  - Meta-doc: `tasks/inventory/structured-core.md`

#### Task 002 — Doc Audit ⬜ NOT STARTED

- **Task file:** `./tasks/002-inventory-existing-docs.md`
- **Output:** `./tasks/inventory/docs-audit.md`
- Criteria: `OK` / `STUB` (<50 lines) / `NEEDS_REVIEW` (red flags) / `MISSING` (sidebar but no file)
- Cross-references against inventory files to flag stale imports
- **Ready to run** — inventories are complete for cross-referencing

#### Task 003 — Test Audit ⬜ NOT STARTED

- **Task file:** `./tasks/003-inventory-existing-tests.md`
- **Output:** `./tasks/inventory/tests-audit.md`
- **Ready to run** — independent of other tasks

### Phase 1: Foundation (Skill Files) — NOT STARTED
### Phase 2: Testing — NOT STARTED
### Phase 3: Documentation — NOT STARTED
### Phase 4: Marketing & Launch — NOT STARTED

---

## Key Technical Insights

### Cascade (ORM)

- Model class is the centerpiece — 60+ methods (split across `src/model/methods/`)
- **No decorators for model definition by design** — Seal handles validation, static properties define model config. This is intentional and correct. Decorators would add complexity without benefit for this architecture.
- **Hasan plans to add relation decorators** (`@HasMany`, `@HasOne`, `@BelongsTo`, `@BelongsToMany`) — see TODO.md in dev-server project
- Sync system = MongoDB-only feature for auto-normalizing embedded documents with configurable field watching (which fields trigger re-sync, what data to re-embed)
- Relations: hasMany, hasOne, belongsTo, belongsToMany with pivot operations (attach/detach/sync/toggle)
- `defineModel()` for functional model definition without class boilerplate
- Validation subdirectory integrates Seal for DB-specific rules (embed validators, model mutators, `v.embed()`)
- DB-agnostic aggregation expressions (`$agg`)
- Delete strategies: trash / permanent / soft — built into model class

### Seal (Validation)

- Three-layer pipeline: Mutators → Validators → Transformers
- 15+ validator types: string, number, int, float, boolean, date, array, object, record, tuple, union, scalar, computed, managed, any
- DateValidator: 80+ methods (age validation, business days, quarters, timezone)
- Plugin system for extending validators (cascade adds `v.embed()` and `v.embedMany()`)
- **Standard Schema V1 compliant** — works with any framework supporting Standard Schema
- JSON Schema output support via `toJsonSchema()`

### Core (Split into 9 inventory sub-files)

- Sub-systems: HTTP/Routing, Request/Response, Storage (local + S3 + R2 + DO Spaces), Mail (React rendering, pooling, test mode), Encryption (AES-256-GCM, HMAC-SHA256, bcrypt), Connectors (lifecycle management for DB/HTTP/Cache/Logger/Mail/Storage), Repository pattern, Resource system (model → API JSON), Use Cases (business logic pipelines), CLI system, Config system, Image manipulation (sharp), Benchmark/Profiler, Dev Server (HMR, health checking, type generation, production builder)
- **Planned features** (from Hasan's TODO.md): Swagger/OpenAPI/Postman collection generation from routes and schemas

### Auth

- Token rotation with family-based revocation — proper security
- Device tracking for multi-device session management
- AccessToken + RefreshToken are persistent models with migrations
- `Auth<Schema>` base model class — users extend this for auth capabilities
- Auth cleanup CLI command for operational maintenance

### Herald (Message Bus)

- Kafka types ready (`KafkaClientOptions`) but no driver yet
- `@Consumable` decorator for message consumers
- Supports Request-Reply (RPC), not just pub/sub

### Scheduler

- Production-grade: retry with backoff, timezone, cron expressions, overlap prevention, concurrency control
- Event emitter with typed events

### Cache

- 6 drivers: Memory, MemoryExtended (sliding TTL), LRU, File, Redis, Null
- Tagged cache for group invalidation
- Full API: `remember()`, `pull()`, `forever()`, `setNX()`, `increment()`, `decrement()`
- Custom error hierarchy (CacheError, CacheConnectionError, CacheConfigurationError)

### Context

- Tiny package (3 files): `Context<TStore>` abstract class + `ContextManager` orchestrator
- Foundation for request-scoped storage across the framework

### Logger

- package.json has **wrong metadata** (keywords: "password", repo: mongez-password) — NEEDS FIX
- Has flushSync from recent work (conversations 9f6f12af, 0ef53160)

---

## Package.json Issues to Fix

| Issue                              | Package         | Severity |
| ---------------------------------- | --------------- | -------- |
| Wrong keywords + repo URL          | logger          | Medium   |
| Jest in scripts (should be vitest) | logger, cascade | Low      |
| Missing main/module fields         | context         | Medium   |
| main points to raw TS (src/)       | scheduler       | High     |

Note: All packages have `src/index.ts` as entry point — this is source code location, compiled output has separate `main`/`module` fields.

---

## Decisions Made

1. **Skill files live inside each package** at `./warlock.js/<package>/SKILLS.md`
2. **Format: Markdown** with standardized sections (template above)
3. **Inventories are temporary scaffolding** — used to create skills and plan docs, not documentation themselves
4. **Flow: Inventory → Skills → Docs** (layered, each stage feeds the next)
5. **`create-warlock` excluded** from all planning
6. **Docs strategy deferred** until doc audit (Task 002) completes
7. **No decorators for cascade model definition** — static property pattern is correct for the architecture. Relation decorators planned but separate concern.
8. **`.warlock-rules.md`** at repo root enforces AI auto-update of skill files (to be created)
9. **Parallel AI execution** — each agent works on ONE package at a time with skill file as briefing
10. **Test isolation** — agents writing tests need only the skill file + inventory for that specific package

---

## Files Index

| File                                        | Purpose                                            |
| ------------------------------------------- | -------------------------------------------------- |
| `./tasks/001-inventory-package-tree.md`     | Task instructions for package inventories          |
| `./tasks/002-inventory-existing-docs.md`    | Task instructions for doc audit                    |
| `./tasks/003-inventory-existing-tests.md`   | Task instructions for test audit                   |
| `./tasks/inventory/<package>.md`            | Completed inventory per package (9 files)          |
| `./tasks/inventory/core/*.md`               | Core inventory split into 9 sub-files              |
| `./tasks/inventory/structured-core.md`      | Core split strategy + completion tracker           |
| `./tasks/brainstorm-context.md`             | THIS FILE — conversation continuation context      |
