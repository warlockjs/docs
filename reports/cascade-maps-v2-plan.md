# Cascade Maps v2 — Tooling Plan

**Goal:** Build a token-efficient, drift-proof map system to seed new Claude sessions for docs/feature/bug work across Warlock.js packages. Replace LLM-based map generation with a deterministic Node+TypeScript extractor + a thin LLM layer for editorial content.

**Context:** v1 maps were fully LLM-generated (Sonnet first pass, then Opus regen). Result: drift-prone, non-deterministic, expensive. See `reports/cascade-docs-fix-plan.md` and `reports/cascade-maps-regeneration-plan.md` for v1 background.

---

## Architecture — two layers

### Layer 1 — Structural (deterministic)

Written in **Node + TypeScript** using [`ts-morph`](https://ts-morph.com/) (a thin wrapper over the TypeScript compiler API). Not Bash, not Python, not an LLM.

**Responsibilities:**
- Walk each `.ts` file in `src/`.
- For each file, extract:
  - Imports (path + imported symbols).
  - Exports list (type, class, interface, function, const, enum).
  - For classes: name, line range, inheritance, every public method (signature with arg names + types + return type + line range), every public property/getter/setter.
  - For interfaces/types: name, line range, every member signature.
  - For functions: signature, line range.
  - For constants: name, type, line range, initializer shape.
  - Overloads: list each.
- Skip `private` / `protected` members unless marked `@internal` and still exported.
- Compute SHA-256 hash of the source file content.
- Emit a JSON intermediate (or directly write the `.md`).

**Guarantees:**
- Signatures match source exactly (AST → text, no paraphrasing).
- Runs in seconds. Zero API tokens.
- Can run in pre-commit hook or CI.

### Layer 2 — Descriptive

**Decision point (open):** where do descriptions live?

**Option A — JSDoc-driven** (CHOSEN 2026-04-18)
- Descriptions live in the source as `/** */` JSDoc comments on each exported symbol.
- Script reads both AST and JSDoc, merges them into the map.
- Source stays self-describing; impossible for descriptions to drift from code.
- Gap-fill is three-state, not binary:
  - **Missing** — no JSDoc → LLM writes one (patch for human review).
  - **Thin** — JSDoc exists but is low-signal (boilerplate like "sets the name", "returns the value", or a one-word summary) → LLM proposes richer version.
  - **Good** — leave alone.
- Heuristic scorer flags thin entries: word count, whether it references params/return/side-effects, whether it mirrors the method name verbatim.
- Pro: single source of truth; no separate storage to sync.
- Con: requires developer discipline; messes with code diff noise when descriptions change.

**Option B — Editorial sidecar**
- Each source file has a `<file>.descriptions.yaml` sidecar keyed by symbol name.
- Script merges sidecar + AST into map.
- LLM fills missing entries.
- Pro: descriptions don't bloat source files.
- Con: two files to keep in sync; sidecar can drift from symbols.

**Option C — Embedded in map**
- Descriptions live in the `.md` map itself.
- Script parses existing map, extracts descriptions by symbol key, regenerates structure, re-embeds.
- Pro: single file per module.
- Con: fragile parsing; any format drift breaks round-trip.

**Recommendation:** Start with **Option A** (JSDoc-driven). Fits Cascade's existing style (many methods already have JSDoc). Biggest upside for long-term maintenance.

---

### Layer 3 — Folder-level purpose

**Why separate from Layer 2:** per-file JSDoc tells you *what a symbol does*. It does not tell you *what capabilities live in a folder and how they relate*. The latter is what a new AI session actually needs to decide which files to open.

**Authoring surface:** one `_purpose.md` file per directory, hand-written or LLM-drafted.

```markdown
# migration/ — purpose

## What this folder provides
DDL migration system: declarative schema changes via a fluent TypeScript API,
driver-agnostic with SQL/NoSQL backends.

## Capability groups
- **Defining a migration** — Migration, ColumnBuilder, ForeignKeyBuilder
- **Running migrations** — MigrationRunner
- **Column shorthands** — column-helpers
- **Driver primitives** — sql-grammar, sql-serializer, types
```

**Generator behaviour:** the v2 generator reads `_purpose.md` (if present) + every per-file map in the folder and emits `_README.md` that combines:
1. Folder purpose paragraph (from `_purpose.md`).
2. Capability-grouped table of files (from `_purpose.md` groups + per-file module summary).
3. Flat fallback list of files with one-liner (from per-file maps) if `_purpose.md` is absent.

**Gap-fill for `_purpose.md`:** if absent, generator writes a draft by summarising the per-file maps in the folder. Human edits or LLM refines. Same three-state gap-fill as JSDoc (missing/thin/good).

**Key insight:** the top-level `_index.md` is a *capability index*, not a file index. Entries read "where is X capability?" not "where is Y file?".

---

## Map file format (v2)

```markdown
# migration
source: migration/migration.ts
source-hash: sha256:a1b2c3…
structural-generated: 2026-04-17T14:23:00Z
structural-generated-by: ts-morph@0.22.0
descriptive-generated: 2026-04-17T14:23:00Z
descriptive-source: jsdoc    # or: llm, sidecar

## Module

<paragraph describing what this module does — from top-of-file JSDoc or explicitly written>

## Exports

### `Migration` — class [lines 684-3225]
<JSDoc summary from class header>

**Public methods:**

#### `createTable(): this` [line 1239]
<JSDoc first line, or "—" if none>

#### `string(column: string, length = 255): ColumnBuilder` [line 1315]
<JSDoc first line>

…
```

**Key differences from v1:**
- Every entry has a source line reference that's AST-accurate.
- Descriptions come from JSDoc, not LLM paraphrase.
- `source-hash` is the drift indicator — any source change invalidates the map.

---

## Drift detection

A 20-line Node script: `scripts/check-maps.ts`

For each `.ts` file:
1. Compute current source SHA-256.
2. Read corresponding map, extract `source-hash`.
3. If mismatch → exit 1 with filename.

Wire into:
- `pre-commit` hook — blocks commits with stale maps.
- CI check — blocks PR merges.
- `npm run maps` — regenerates stale maps.

---

## Directory structure

```
warlock.js/cascade/
├── src/                      (source, unchanged)
├── .maps/
│   ├── src/                  (mirror of src/ with .md maps)
│   ├── _index.md             (top-level searchable export index)
│   └── _missing.txt          (symbols lacking descriptions — gap-fill queue)
├── scripts/
│   ├── generate-maps.ts      (ts-morph extractor)
│   ├── check-maps.ts         (drift detector)
│   └── gap-fill-descriptions.ts  (LLM-driven JSDoc writer for gaps)
└── package.json              (new scripts: "maps:gen", "maps:check", "maps:gaps")
```

---

## Top-level `_index.md` contract

Every new session loads this first. Kept under 500 lines.

```markdown
# Warlock.js Source Index

last-generated: 2026-04-17T14:23:00Z

## Cascade — @warlock.js/cascade

### Classes
- `Migration` — migration/migration.ts:684 — abstract base for DDL migrations
- `Model` — model/model.ts:123 — abstract base for records
- `QueryBuilder<T>` — query-builder/query-builder.ts:45 — chainable query builder
…

### Functions
- `connectToDatabase(options)` — utils/connect-to-database.ts:142 — connects driver + registers DataSource
…
```

One line per export. For any question "where is X?", Grep this first.

---

## Deliverables

1. **`scripts/generate-maps.ts`** — Node + ts-morph extractor. Reads `src/**/*.ts` + `src/**/_purpose.md`, writes `.maps/src/**/*.md`, `.maps/src/**/_README.md`, and `.maps/_index.md`.
2. **`scripts/check-maps.ts`** — drift detector, exits non-zero on mismatch.
3. **`scripts/gap-fill-descriptions.ts`** — LLM pass that handles three cases:
   - missing JSDoc → write one
   - thin JSDoc (scored by heuristic) → propose richer version
   - missing `_purpose.md` → draft from per-file maps
   Writes patches for human review; does not auto-commit.
4. **`scripts/score-jsdoc.ts`** — heuristic scorer that flags thin JSDoc without invoking an LLM (word count, param/return references, name-mirror detection).
5. **`package.json` scripts** — `maps:gen`, `maps:check`, `maps:gaps`, `maps:score`.
6. **`.husky/pre-commit`** — runs `maps:check`, auto-runs `maps:gen` if stale.
7. **README in `.maps/`** — explains the three-layer system for future contributors.

---

## Rollout plan

**Phase 1 — Scaffold & prove on Cascade (est. 1 day)**
- Build `generate-maps.ts` (Option A, JSDoc-driven).
- Run against current Cascade src.
- Compare output vs current v1 `.maps/` — confirm structural parity for a sample of 10 files (migration, model, query-builder, etc.).
- Verify drift detection: modify a file, confirm `check-maps` fails.

**Phase 2 — Gap-fill pass (est. half-day per package)**
- Run `maps:gaps` against Cascade. Collect missing JSDoc.
- One-shot Opus session writes JSDoc directly into source (patches reviewed by human).
- Regenerate maps.

**Phase 3 — Extend across the ecosystem**
- Apply same scripts to `warlock.js/seal`, `warlock.js/herald`, `warlock.js/logger`, and the framework core packages.
- Single shared script in a monorepo root, or copied per-package (decide based on repo layout).

**Phase 4 — Retire v1 maps tooling**
- Archive the LLM-based regen plan (`cascade-maps-regeneration-plan.md`) as historical.
- v1 maps can be deleted once v2 maps exist and pass structural parity.

---

## Open questions (brainstorm)

1. **JSDoc vs sidecar vs embedded** — confirm Option A. If Cascade's JSDoc coverage is poor, the gap-fill burden is larger up front; assess by counting undocumented exports after the first dry run.
2. **How much description detail?** One JSDoc line per method? A paragraph per class? Current v1 maps had per-method one-liners — aim for that.
3. **Overloads** — render each overload separately, or collapse into one entry with a note?
4. **Internal symbols** — do `@internal` exports go in the map? Recommend yes (they're exported from the package even if not intended as public API) but mark them as such.
5. **Monorepo or per-package tooling?** — If the Warlock.js ecosystem is a monorepo, one shared script. If separate repos, a published `@warlock.js/maps-tool` package is worth considering.
6. **LLM model for gap-fill** — Opus for correctness. Sonnet is cheaper but we just saw it underperform on extraction tasks. JSDoc writing is lower-stakes than full-file mapping though — Sonnet may be fine here.
7. **Map format stability** — if the format changes later, every map needs re-emission. Version the format (`map-version: 1`) in frontmatter.

---

## What NOT to do

- Do NOT have an LLM extract signatures/line ranges. That's what failed in v1.
- Do NOT let maps be edited by hand. Round-trip through the generator — edits get overwritten.
- Do NOT skip drift detection. A map without a hash is a lie waiting to happen.

---

## Handoff note

When you start the next session to implement this:
1. Read this file.
2. Read `reports/cascade-maps-regeneration-plan.md` for context on why v1 is being replaced.
3. Read `reports/cascade-bugs.md` — some bugs may have already fixed JSDoc drift; coordinate with whatever's in `main`.
4. Start with `scripts/generate-maps.ts`. Make it work for one file (`migration.ts`) end-to-end before scaling.
