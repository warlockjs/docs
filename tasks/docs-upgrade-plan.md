# Warlock.js Docs Upgrade Plan — v3 → v4

> Living plan file. Update as decisions are made.  
> Last updated: 2026-04-17 (reordered: packages first, core last)

---

## Context

Warlock.js v4 has massive changes from v3. The existing Docusaurus site has ~64 pages of mixed quality. A previous AI audit of the core docs produced files with significant holes.

**Goal:** Rebuild doc audits from source code (ground truth), then write DX-quality docs in small, directed steps executable by cheap models.

---

## Key Constraints

1. **Source code is ground truth.** Inventory files (`tasks/inventory/`) are ~80% accurate. Every audit and doc task must verify against actual source in `warlock.js/<package>/src/`.
2. **Tasks must be micro-chunked.** Each task = one file, one clear input, one clear output. Cheap models need directed steps, not open-ended instructions.
3. **One agent, one file.** No task should require reading more than 2–3 source files + 1 existing doc page at a time.

---

## Source Code Locations

```
warlock.js/
  auth/src/
  cache/src/
  cascade/src/
  context/src/
  core/src/
    application/  bootstrap/  cli/  config/  connectors/
    database/     encryption/ http/ image/    logger/
    mail/         manifest/   production/     react/
    dev-server/   benchmark/  generations/    index.ts
  herald/src/
  logger/src/
  scheduler/src/
  seal/src/
```

---

## Current State

| Package   | Inventory | Doc Audit | Doc Pages | Issues |
|-----------|-----------|-----------|-----------|--------|
| seal      | ✅        | ✅        | 31        | 4 NEEDS_REVIEW |
| cache     | ✅        | ✅        | 22        | 2 STUB, 3 NEEDS_REVIEW |
| cascade   | ✅        | ✅        | 12        | 2 NEEDS_REVIEW |
| auth      | ✅        | ✅        | 9         | 1 NEEDS_REVIEW |
| herald    | ✅        | ✅        | 0         | 🔴 fully missing |
| scheduler | ✅        | ✅        | 0         | 🔴 fully missing |
| logger    | ✅        | ✅        | 2         | 1 STUB, 1 NEEDS_REVIEW |
| core      | ✅ (9 sub-files) | ⚠️ holes | ~60 | audit incomplete |
| misc      | —         | ❌        | —         | not started |

---

## Decisions Made

| Decision | Choice |
|----------|--------|
| Core audit rebuild approach | **Discard & rewrite** — don't trust existing findings |
| Herald Kafka docs | **"Coming soon" callout** — document what exists, note Kafka is planned |
| `database/` vs Cascade | **Keep separate** — `docs/warlock/database/` is framework integration layer, Cascade docs cover the standalone ORM API |

---

## Phases Overview

Packages (SAP + TCP non-core) are done first because they are isolated — one context window, no cross-cutting concerns, cheaper to execute. Core gap-filling comes last because (a) it depends on Phase 1 audit results, and (b) the ~60 existing core pages already give users enough to get started.

| Phase | What | Runs |
|-------|------|------|
| 1 | Rebuild core doc audits (analysis only, no writing) | In parallel with 2 & 3 |
| 2 | Fix package NEEDS_REVIEW pages — seal, cache, cascade, auth, logger | In parallel with 1 & 3 |
| 3 | Write fully missing package docs — Herald, Scheduler, Logger | In parallel with 1 & 2 |
| 4 | Fill core doc gaps (driven by Phase 1 audit results) | After 1, 2, 3 |
| 5 | Skills per package — SAP first, then TCP | After docs are solid |

---

## Phase 1 — Rebuild Core Doc Audits

### How Each Audit Task Works

**Inputs a cheap model needs:**
1. The inventory file (`tasks/inventory/core/<sub>.md`) — what was found previously (~80% accurate)
2. The actual source directory (`warlock.js/core/src/<dir>/`) — ground truth, must scan exports from `index.ts` + public methods
3. The existing doc page(s) (`docs/warlock/<section>/`) — what's currently written

**Output:** A rebuilt `tasks/inventory/docs/core/<sub>.md` with:
- Status badge
- Coverage Map table (Feature | Source Export | Doc Coverage % | Gap)
- Technical Findings (numbered, DX impact stated)
- Action Plan (checkboxes, each referencing a specific `.mdx` file to create/update)

**Rule:** If inventory says X exists but source doesn't export it → mark as incorrect inventory, exclude from gap. If source exports something not in inventory → add it to the audit.

### Task List (Priority Order)

#### TASK-C1: Rebuild `tasks/inventory/docs/core/http.md`
- **Source to scan:** `warlock.js/core/src/http/`
- **Inventory ref:** `tasks/inventory/core/http.md`
- **Docs to compare:** `docs/warlock/http/*.mdx` (all files)
- **Output:** Rewrite `tasks/inventory/docs/core/http.md`

#### TASK-C2: Rebuild `tasks/inventory/docs/core/routing.md`
- **Source to scan:** `warlock.js/core/src/http/router/` (or wherever router lives)
- **Inventory ref:** `tasks/inventory/core/routing.md`
- **Docs to compare:** `docs/warlock/http/routing-basics.mdx`, `route-builder.mdx`, `route-groups.mdx`
- **Output:** Rewrite `tasks/inventory/docs/core/routing.md`

#### TASK-C3: Rebuild `tasks/inventory/docs/core/services.md`
- **Source to scan:** `warlock.js/core/src/mail/`, `warlock.js/core/src/encryption/`, `warlock.js/core/src/image/`
- **Inventory ref:** `tasks/inventory/core/services.md`
- **Docs to compare:** `docs/warlock/mail/`, `docs/warlock/upload/`
- **Output:** Rewrite `tasks/inventory/docs/core/services.md`

#### TASK-C4: Rebuild `tasks/inventory/docs/core/data.md`
- **Source to scan:** `warlock.js/core/src/database/`
- **Inventory ref:** `tasks/inventory/core/data.md`
- **Docs to compare:** `docs/warlock/repositories/`, `docs/warlock/database/`
- **Output:** Rewrite `tasks/inventory/docs/core/data.md`

#### TASK-C5: Rebuild `tasks/inventory/docs/core/validation.md`
- **Source to scan:** `warlock.js/core/src/` (validation-related exports)
- **Inventory ref:** `tasks/inventory/core/validation.md`
- **Docs to compare:** `docs/warlock/validation/`
- **Output:** Rewrite `tasks/inventory/docs/core/validation.md`

#### TASK-C6: Rebuild `tasks/inventory/docs/core/foundation.md`
- **Source to scan:** `warlock.js/core/src/application/`, `warlock.js/core/src/config/`, `warlock.js/core/src/bootstrap/`
- **Inventory ref:** `tasks/inventory/core/foundation.md`
- **Docs to compare:** `docs/warlock/getting-started/`
- **Output:** Rewrite `tasks/inventory/docs/core/foundation.md`

#### TASK-C7: Rebuild `tasks/inventory/docs/core/infrastructure.md`
- **Source to scan:** `warlock.js/core/src/connectors/`, `warlock.js/core/src/cli/`
- **Inventory ref:** `tasks/inventory/core/infrastructure.md`
- **Docs to compare:** `docs/warlock/getting-started/connectors.mdx`
- **Output:** Rewrite `tasks/inventory/docs/core/infrastructure.md`

#### TASK-C8: Rebuild `tasks/inventory/docs/core/utils.md`
- **Source to scan:** `warlock.js/core/src/` (utility exports)
- **Inventory ref:** `tasks/inventory/core/utils.md`
- **Docs to compare:** `docs/warlock/utils/`
- **Output:** Rewrite `tasks/inventory/docs/core/utils.md`

#### TASK-C9: Rebuild `tasks/inventory/docs/core/dev-server.md`
- **Source to scan:** `warlock.js/core/src/dev-server/`
- **Inventory ref:** `tasks/inventory/core/dev-server.md`
- **Docs to compare:** `docs/warlock/getting-started/dev-server-overview.mdx`
- **Output:** Rewrite `tasks/inventory/docs/core/dev-server.md`

---

## Phase 2 — Fix Package NEEDS_REVIEW Pages

Runs in parallel with Phases 1 and 3. SAP packages first, then TCP.

One task per page. Each task:
- **Input:** The flagged `.mdx` file + relevant inventory file + source exports
- **Output:** Updated `.mdx` file with issues fixed
- **Rule:** Never remove content without verifying it's wrong in source first

### SAP packages first

| Task ID | File | Package | Likely Issue |
|---------|------|---------|-------------|
| TASK-R1 | `docs/warlock/seal/` (4 files — pull exact names from `tasks/inventory/docs/seal.md`) | seal | stale imports, missing examples |
| TASK-R2 | `docs/warlock/cache/` (3 files — pull exact names from `tasks/inventory/docs/cache.md`) | cache | stub sections, outdated config |
| TASK-R3 | `docs/warlock/logger/configurations.mdx` | logger | stub |

### TCP packages after

| Task ID | File | Package | Likely Issue |
|---------|------|---------|-------------|
| TASK-R4 | cascade pages (2 — pull from `tasks/inventory/docs/cascade.md`) | cascade | v3 API references |
| TASK-R5 | auth page (1 — pull from `tasks/inventory/docs/auth.md`) | auth | missing example coverage |

---

## Phase 3 — Write Missing Package Docs

Runs in parallel with Phases 1 and 2. All SAP packages — fully isolated context.

Each page = one task. Agent gets: inventory file + source dir + doc style example (use `docs/warlock/getting-started/introduction.mdx` as tone/format reference).

### Herald (~9 pages)

| Task ID | Output File | Key Source |
|---------|-------------|-----------|
| TASK-H1 | `docs/warlock/herald/introduction.mdx` | `warlock.js/herald/src/` overview |
| TASK-H2 | `docs/warlock/herald/getting-started.mdx` | connection setup, bootstrap |
| TASK-H3 | `docs/warlock/herald/producers.mdx` | publish API |
| TASK-H4 | `docs/warlock/herald/consumers.mdx` | `@Consumable` decorator |
| TASK-H5 | `docs/warlock/herald/request-reply.mdx` | RPC pattern |
| TASK-H6 | `docs/warlock/herald/rabbitmq.mdx` | RabbitMQ driver config |
| TASK-H7 | `docs/warlock/herald/kafka.mdx` | Kafka — "coming soon" callout |
| TASK-H8 | `docs/warlock/herald/error-handling.mdx` | dead letter, retries |
| TASK-H9 | `docs/warlock/herald/configuration.mdx` | full config reference |

### Scheduler (~7 pages)

| Task ID | Output File | Key Source |
|---------|-------------|-----------|
| TASK-S1 | `docs/warlock/scheduler/introduction.mdx` | `warlock.js/scheduler/src/` overview |
| TASK-S2 | `docs/warlock/scheduler/defining-jobs.mdx` | job class, cron expressions |
| TASK-S3 | `docs/warlock/scheduler/retry-backoff.mdx` | retry config |
| TASK-S4 | `docs/warlock/scheduler/overlap-prevention.mdx` | concurrency control |
| TASK-S5 | `docs/warlock/scheduler/timezone.mdx` | timezone config |
| TASK-S6 | `docs/warlock/scheduler/events.mdx` | typed event emitter |
| TASK-S7 | `docs/warlock/scheduler/configuration.mdx` | full config reference |

### Logger (~4 pages)

| Task ID | Output File | Key Source |
|---------|-------------|-----------|
| TASK-L1 | `docs/warlock/logger/introduction.mdx` | rewrite existing stub |
| TASK-L2 | `docs/warlock/logger/channels.mdx` | Console, File, JSON File |
| TASK-L3 | `docs/warlock/logger/request-logging.mdx` | per-request context binding |
| TASK-L4 | `docs/warlock/logger/configurations.mdx` | rewrite existing stub |

---

## Phase 4 — Fill Core Doc Gaps

Tasks defined after Phase 1 audit files are rebuilt. Known candidates:

| Likely Task | Target File |
|-------------|-------------|
| `router.proxy()` | `docs/warlock/http/proxy.mdx` (new) |
| `RouteBuilder.nest()` | Update `docs/warlock/http/route-builder.mdx` |
| Encryption utilities | `docs/warlock/advanced/encryption.mdx` (new) |
| UseCase pipeline | `docs/warlock/advanced/use-cases.mdx` (new) |
| Advanced image transforms | Update `docs/warlock/image/introduction.mdx` |

*(Full list generated from Phase 1 action plan checkboxes)*

---

## Phase 5 — Skills Per Package

`warlock.js/<pkg>/SKILLS.md` — one task per package, written from source + finished docs.  
SAP first, TCP last (same reasoning as doc phases).

Order: seal → cache → logger → context → herald → scheduler → cascade → auth → core

---

## DX Principles for All New Content

1. Code example before explanation — show it, then explain it
2. Every snippet is copy-paste ready — includes imports, no partial code
3. Progressive: simple usage first, advanced options at the bottom
4. Cross-link related packages where relevant
5. Honest about limits — call out what's not ready (e.g., Kafka)
6. Tone: friendly but precise, like existing `getting-started/introduction.mdx`
