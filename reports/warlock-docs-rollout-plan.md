# Warlock.js Ecosystem Docs Rollout Plan

**Goal:** Ship accurate, high-DX docs across every Warlock.js package and the framework core, using a repeatable pipeline that minimises LLM tokens and prevents drift.

**Scope:** Cascade, Seal, Scheduler, Logger, Core, Cache — plus any future package.

**Guiding principle:** Tooling before content. Template before replication.

---

## Terminology

- **v1 maps** — the `.md` files currently in each package's `.maps/src/` tree. LLM-generated (Sonnet/Opus/Haiku waves). Work for now; will rot.
- **v2 generator** — the `ts-morph`-based Node+TypeScript script described in `reports/cascade-maps-v2-plan.md`. **Does not exist yet.**
- **v2 maps** — the `.md` files the v2 generator will produce. Carry a `source-hash` for drift detection. Deterministic, regeneratable in seconds.

---

## Stage 0 — Build the v2 generator (one-time, 1–2 days)

**Deliverable:** `scripts/generate-maps.ts` + drift detector + gap-fill pass. See `reports/cascade-maps-v2-plan.md` for the full tooling spec.

**Why first:** Without it, every package repeats Cascade's Sonnet-map failure (migration.md listed 9 of ~110 methods). Each subsequent package pays a multi-day LLM regen tax that a 1-day script eliminates.

**Exit criteria:**
- Script generates v2 maps for Cascade with structural parity to a hand-verified sample of 10 files.
- Drift detector blocks stale maps in `pre-commit`.
- Gap-fill script writes JSDoc patches for symbols that lack documentation (human reviews before commit).

**Chosen descriptive source:** JSDoc in source files (Option A). Decided 2026-04-18.

---

## Stage 1 — Finish Cascade (current work)

Cascade is already mid-flight. Finish it as the **reference package** — every other package conforms to Cascade's shape.

**Pending tasks (from `reports/cascade-docs-impl.md`):**
1. Migrations docs full rewrite — introduction.mdx, writing-migrations.mdx, table-operations.mdx, foreign-keys.mdx — against the regenerated `migration.md` map.
2. Re-audit never-formally-audited sections: query builder, aggregate, scopes, events, advanced, drivers.
3. Restructure-nav — collapse 13 sidebar sections into task-oriented hierarchy per `cascade-docs-fix-plan.md` Part 2.
4. Regenerate Cascade's maps with the v2 generator once it exists (retire v1 maps).

**Exit criteria:**
- All Cascade docs match source APIs (no invented methods/params/types).
- Sidebar is task-oriented, not file-mirrored.
- v2 maps exist and pass drift checks.

---

## Stage 2 — Per-package pipeline (applied to each package in order)

Once Cascade is the template, every other package goes through the same 5-step loop.

| Step | Action | Tooling | Cost |
|------|--------|---------|------|
| 1 | Generate structural maps | v2 generator | minutes |
| 2 | Gap-fill JSDoc where missing | LLM pass (Opus/Sonnet, human review) | half-day |
| 3 | Regenerate maps — now carry descriptions | v2 generator | minutes |
| 4 | Audit existing docs against maps | Sonnet agents, one per section | half-day |
| 5 | Fix/rewrite + restructure nav to match Cascade's shape | Opus for rewrites, Sonnet for cleanup | 1–3 days |

**Per-package outputs:** updated `.maps/src/` tree, audit report, doc fixes, nav reshape.

---

## Package order & notes

### 1. Cascade (finish — Stage 1)
Biggest, most at-risk, the reference shape. Don't touch others until this lands.

### 2. Seal (audit-only — Stage 2)
Status: "finished" but unaudited. Maps will surface drift. Expected effort: 1–2 days.

### 3. Scheduler (audit-only — Stage 2)
Same shape as Seal. 1 day likely sufficient (smaller surface area).

### 4. Logger (audit-only — Stage 2)
Smallest of the three "finished" packages. Half-day to 1 day.

### 5. Core (write from scratch — Stage 2, with caveats)
Package is incomplete. Maps themselves will churn as source stabilises.
- Don't start docs until source reaches a stable milestone.
- Gap-fill JSDoc pass can't infer intent from unfinished code — a human must write class/module-level summaries first.
- Expected effort: weeks, not days.

### 6. Cache (write from scratch — Stage 2, with caveats)
Same constraints as Core. Likely pair with Core since they often land together.

---

## Decisions the user must make

1. **Build v2 tooling now, or defer?**
   - Build now: Stage 0 cost up-front, all later packages cheap.
   - Defer: keep paying LLM regen tax per package; drift accumulates.
   - **Recommendation:** build now.

2. **Cascade as canonical shape?**
   - If yes: Seal/Scheduler/Logger restructure to match Cascade's nav after their audit.
   - If no: each package's nav stands alone; devs hit inconsistency jumping between docs.
   - **Recommendation:** yes, use Cascade as canonical.

3. **Who writes JSDoc for incomplete packages (Core, Cache)?**
   - LLM gap-fill can't infer intent from unfinished code.
   - Human writes at minimum: class summaries, module-level purpose.
   - LLM fills in method-level detail after.

4. **Docs standard spec (frontmatter, sidebar categories, example patterns)?**
   - Derived from finished Cascade docs.
   - Written up as `reports/warlock-docs-standard.md` after Stage 1 completes.

---

## Rough end-to-end timeline

Assuming one engineer + Opus-level agents:

| Stage | Item | Duration |
|------|------|----------|
| 0 | Build v2 generator + gap-fill + drift detector | 1–2 days |
| 1 | Finish Cascade (migrations rewrite + audits + restructure) | 4–6 days |
| 2a | Seal audit + fixes | 1–2 days |
| 2b | Scheduler audit + fixes | 1 day |
| 2c | Logger audit + fixes | 0.5–1 day |
| 2d | Core docs (write from scratch, post source-freeze) | 2–3 weeks |
| 2e | Cache docs (write from scratch, post source-freeze) | 1–2 weeks |

**First releasable milestone:** end of Stage 2c — all finished packages accurately documented.

**Full ecosystem coverage:** post Stage 2e.

---

## What NOT to do

- Do NOT write new docs without a map of the source they describe. It's how drift starts.
- Do NOT write docs for packages whose source isn't stable (Core, Cache). You'll rewrite twice.
- Do NOT let each package invent its own nav shape. Pick Cascade's, replicate it.
- Do NOT trust v1 maps beyond the current session. They have no drift detection; regenerate via v2 before reusing.

---

## Handoff note

If a new session picks this up:
1. Read this file.
2. Read `reports/cascade-maps-v2-plan.md` for the tooling spec.
3. Read `reports/cascade-docs-impl.md` for Cascade's remaining docs work.
4. Start with Stage 0 (v2 generator) unless explicitly told otherwise.
