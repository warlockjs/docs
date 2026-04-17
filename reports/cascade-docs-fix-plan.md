# Cascade Docs — Fix & Restructure Plan

**Audit date:** 2026-04-17
**Overall coverage:** 7/10 — localized issues, not systemic

This plan has two parts:
1. **Accuracy fixes** — invented/wrong API surface flagged during audit
2. **Discoverability restructure** — Cascade is a large package; the current nav makes it easy to get lost

Sections are independently dispatchable to Sonnet sub-agents in parallel.

---

## Part 1 — Accuracy Fixes

### Fix Batch A — Models (HIGHEST PRIORITY)

**Scope:** `docs/cascade/models/` + `docs/cascade/getting-started/` (any example using `static collection`)

**Systematic fix:** replace `static collection` with `static table` everywhere.
- introduction.mdx (lines 23, 32)
- configuration.mdx (lines 17, 32, 44, 47, 51)
- ids.mdx (lines 32, 45, 58, 80, 113)
- model-data.mdx (line 23)
- embedded-documents.mdx (line 23)
- Search all other docs under `docs/cascade/**` for stray `static collection` — fix everywhere

**Casting docs overhaul** (`casting-data.mdx`, `casting-custom-fields.mdx`)
- The `protected casts: Casts = { ... }` pattern is not in any source map. Either:
  - **Option A (preferred):** rewrite both pages to document schema-based validation via `@warlock.js/seal` (which is what maps actually show)
  - **Option B:** verify with maintainer whether `casts` exists on a superclass outside Cascade (e.g. `@warlock.js/core`). If it does, note this and keep pages. If it doesn't, delete both pages and add redirects.
- **Action:** needs a decision from user before the fix agent runs.

**embedded-documents.mdx (line 65, 73)**
- Remove invented `embedAllExceptTimestampsAndUserColumns` property
- Remove invented `embedAllExcept` array property
- Document only what the map defines: `static embed?: string[]` and `get embedData()`

**model-data.mdx (line 93)**
- Verify `user._id` — if it's truly MongoDB's internal doc id exposed via generic property access, clarify wording; otherwise remove.

---

### Fix Batch B — Relationships

**defining-relations.mdx (lines 150–209)**
- Change `BelongsToOptions.localKey` → `ownerKey` (matches source and joins.mdx).
- Update the inline prose that describes the field.

That's the only issue in this section.

---

### Fix Batch C — Validation

**custom-transformers.mdx**
- Correct `ModelTransformCallback` signature to:
  ```ts
  (options: { model: Model; column: string; value: any; isChanged: boolean; isNew: boolean }) => string
  ```
- Update all examples on the page to use the single-options-object form.

---

### Fix Batch D — Migrations

**introduction.mdx**
- Remove `bigIncrements()`, `timestamps()` calls — replace with the actual chain methods from the ColumnBuilder map (e.g. `bigInt().autoIncrement().primary()`, or explicit `createdAt().updatedAt()` if those exist — verify against map first).
- Fix `createTable()` to accept `(name, callback)` form.
- Fix `dropTableIfExists(name)` to take the table name argument.

**writing-migrations.mdx** / **table-operations.mdx**
- Remove all occurrences of `fk.column("…")` — replace with the constructor-based form. Fix agent must check `foreign-key-builder.md` map for the real API.
- Fix `addIndex()` signature in docs to `(table, columns, options?)`.
- Add docs for `hasTable()` and `hasColumn()` — they're in the map.

**foreign-keys.mdx (line 123 + any inline examples)**
- Swap argument order: `.references("<column>").on("<table>")`. Docs currently have it reversed.

---

## Part 2 — Discoverability Restructure

**Problem:** Cascade has 300+ exports, 13 sidebar sections, 90+ doc pages. A developer landing on the docs can't tell where to start or how topics relate.

**Proposed structure** (merges today's sections into a task-oriented hierarchy):

```
cascade/
├── getting-started/          (unchanged — entry point)
│
├── concepts/                 (NEW — high-level mental model, one page each)
│   ├── data-sources-and-drivers.mdx       (merges content from drivers/ + data-source)
│   ├── models-vs-query-builder.mdx        (when to reach for each)
│   ├── multi-database.mdx                  (moved from getting-started)
│   └── contracts.mdx                       (moved from current contracts/)
│
├── models/                   (trimmed — see below)
│   ├── defining-models/      (define-model, configuration, ids, default-values)
│   ├── working-with-data/    (create, save, fetch, destroy, soft-delete, atomic-updates)
│   ├── schema-and-casting/   (schema validation, casting — rewritten per Batch A)
│   ├── lifecycle/            (events, dirty-tracking, hydration-serialization, field-accessors)
│   └── embedding/            (embedded-documents, resources)
│
├── relationships/            (unchanged — already well-sized)
│
├── query-builder/            (unchanged)
│
├── aggregate/                (unchanged but collapse 16 pages into 5–6 task-oriented pages)
│   ├── introduction.mdx
│   ├── building-pipelines.mdx   (merge: agg, aggregate-manager, model-aggregate)
│   ├── stages.mdx               (merge: group-by, sort, limit, skip, unwind, lookup)
│   ├── filtering-and-selecting.mdx (merge: filtering, selecting-columns)
│   └── mutations.mdx            (merge: update, delete)
│
├── migrations/               (unchanged, fixes from Batch D applied)
│
├── validation/               (unchanged, fix from Batch C applied)
│
├── advanced/                 (unchanged — auto-increment, master-mind)
│
├── scopes/                   (merge into models/ as one page)
├── indexing/                 (merge into models/ as one page)
├── events/                   (merge into models/lifecycle/)
├── utilities/                (keep — grab-bag)
└── drivers/                  (merge into concepts/)
```

**Why:** fewer sidebar items, each section answers "what do I want to do?" instead of "what file is this exported from?".

**What we're NOT doing:**
- Not rewriting any page that's accurate. Restructure = moving + adding landing pages, not editing content.
- Not changing `getting-started/` — it works.

**Deliverables for restructure:**
1. Updated `_category_.json` files for each section (labels, positions, links)
2. New landing pages at `concepts/`, `models/defining-models/`, `models/working-with-data/`, etc. — each a short "what's in here" page
3. Redirects (via Docusaurus `redirectFrom` frontmatter) for any moved page so external links don't 404

---

## Execution Plan — Sub-Agent Dispatch

Once user approves, spawn in parallel (all Sonnet):

| Agent | Scope | Blocking? |
|-------|-------|-----------|
| `fix-models` | Batch A (models + global `static collection` replace) | No |
| `fix-relationships` | Batch B | No |
| `fix-validation` | Batch C | No |
| `fix-migrations` | Batch D | No |
| `restructure-nav` | Part 2 — only file moves, category JSON, landing pages | **YES — run AFTER fixes land** |

Fix agents run concurrently; restructure agent runs after they finish so it doesn't rewrite files mid-move.

---

## Open Questions Before Execution

1. **Casting docs:** Option A (delete, rewrite as schema-based) or Option B (keep if `casts` exists in a parent package)?
2. **Restructure scope:** approve the full reshape, or only the accuracy fixes for now?
3. **Redirects:** OK to add Docusaurus redirect frontmatter on moved pages, or handle via a separate redirect file?

Awaiting your review before dispatching fix agents.
