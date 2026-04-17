# Cascade Maps Regeneration Plan

**Trigger:** `migration.md` was found to list 9 public methods on `Migration` when source has ~110. Since all maps were generated in the same Sonnet pass, treat the whole `.maps/` tree as suspect and regenerate.

**Scope:** 92 `.ts` files under `warlock.js/cascade/src/` (excluding `*.test.ts`), each maps to one `.md` under `.maps/src/`, plus per-directory `_README.md` indexes and a top-level `_index.md`.

---

## Map Format Spec (every map MUST follow this)

```markdown
# <filename-without-ext>
source: <relative path from src/, e.g. migration/migration.ts>
description: <one-line purpose statement — what this module provides>
complexity: simple | moderate | complex
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: <model id, e.g. claude-opus-4-7 | claude-sonnet-4-6 | claude-haiku-4-5>
last-updated-by: <same model id on initial write; later updates overwrite this only>

## Imports
- `<symbol>` from `<relative or package path>`

## Exports
- `<name>` — <one-line what it is>  [lines X-Y]

## Classes / Functions / Types / Constants

### `<ExportName>` [lines X-Y]
- <one to three lines describing purpose/behavior>
- side-effects: <list any mutation of external state>
- throws: <list error types thrown>

#### `<methodName>(args)` [lines X-Y]
- <one line describing what it does and what it returns>
- side-effects: <if any>
```

**Attribution fields — the contract:**
- `created-by`: set on first generation; preserved on subsequent updates. If the map already has a `created-by`, the agent must preserve it and NOT overwrite.
- `last-updated-by`: set on every write (initial or update) to the current agent's model id.
- On initial regeneration (this pass), both fields equal the regenerating agent's model id.
- On later updates (user continues developing the package), only `last-updated-by` and `last-mapped` change; `created-by` and `first-mapped` are preserved.

Every regenerated map — including all migration maps (`migration.md`, `column-builder.md`, `column-helpers.md`, `foreign-key-builder.md`, `migration-runner.md`, `sql-grammar.md`, `sql-serializer.md`, `types.md`) — MUST carry both fields.

**Rules for agents:**
1. Every PUBLIC exported symbol goes in `## Exports` with line range.
2. Every PUBLIC method on a class (and every public getter/setter) gets a `####` subheading with signature and line range.
3. Skip `private` / `protected` members unless they're marked `@internal` but still observably exported.
4. Signatures must include argument names and types where present in source (not just names).
5. Return types must match source exactly — `this`, `void`, `Promise<X>`, etc.
6. Constants with type annotations: include the type.
7. Enums/unions: list every variant.
8. Never invent a method, parameter, return type, or export.
9. If a method is overloaded, list each overload.
10. Date fields `first-mapped` / `last-mapped` → set both to `2026-04-17` on fresh generation.
11. Attribution fields `created-by` / `last-updated-by` → set both to the agent's own model id on fresh generation (e.g. `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5`). On updates of an existing map, preserve `created-by` and `first-mapped`, overwrite `last-updated-by` and `last-mapped`.

---

## Complexity Tiers & Model Assignment

### Tier 1 — Opus (14 files, >700 LOC or critical core orchestration)

One agent per file. Running in parallel.

| File | LOC |
|---|---|
| `migration/migration.ts` | 3520 |
| `drivers/mongodb/mongodb-query-builder.ts` | 2606 |
| `model/model.ts` | 2292 |
| `contracts/query-builder.contract.ts` | 1887 |
| `drivers/mongodb/mongodb-query-parser.ts` | 1658 |
| `query-builder/query-builder.ts` | 1357 |
| `drivers/postgres/postgres-driver.ts` | 1292 |
| `drivers/postgres/postgres-query-builder.ts` | 1159 |
| `drivers/mongodb/mongodb-driver.ts` | 1113 |
| `drivers/postgres/postgres-query-parser.ts` | 1109 |
| `drivers/postgres/postgres-migration-driver.ts` | 1061 |
| `migration/migration-runner.ts` | 1055 |
| `sync/sync-manager.ts` | 866 |
| `drivers/mongodb/mongodb-migration-driver.ts` | 770 |

### Tier 2 — Opus (8 files, 450–700 LOC, non-trivial interfaces)

| File | LOC |
|---|---|
| `migration/column-builder.ts` | 671 |
| `contracts/migration-driver.contract.ts` | 668 |
| `relations/relation-loader.ts` | 598 |
| `contracts/database-driver.contract.ts` | 554 |
| `restorer/database-restorer.ts` | 516 |
| `writer/database-writer.ts` | 494 |
| `migration/column-helpers.ts` | 468 |
| `drivers/postgres/postgres-sql-serializer.ts` | 465 |

### Tier 3 — Sonnet (23 files, 150–450 LOC)

Batched: one Sonnet agent per directory covering all its Tier-3 files.

- `database-dirty-tracker.ts` (458) · `utils/connect-to-database.ts` (451)
- `types.ts` (413) · `events/model-events.ts` (392)
- `sync/types.ts` (373) · `sync/model-sync-operation.ts` (355) · `sync/model-sync.ts` (204) · `sync/sync-context.ts` (125) · `sync/model-events.ts` (74)
- `relations/types.ts` (365) · `relations/pivot-operations.ts` (351) · `relations/helpers.ts` (219) · `relations/relation-hydrator.ts` (116)
- `drivers/postgres/postgres-dialect.ts` (297) · `drivers/postgres/postgres-sync-adapter.ts` (237) · `drivers/postgres/postgres-blueprint.ts` (147) · `drivers/postgres/types.ts` (179)
- `drivers/mongodb/mongodb-query-operations.ts` (289) · `drivers/mongodb/mongodb-sync-adapter.ts` (200) · `drivers/mongodb/mongodb-id-generator.ts` (169) · `drivers/mongodb/mongodb-blueprint.ts` (65) · `drivers/mongodb/types.ts` (59)
- `utils/once-connected.ts` (268) · `utils/define-model.ts` (260)
- `remover/database-remover.ts` (266) · `model/methods/query-methods.ts` (269)
- `expressions/aggregate-expressions.ts` (260)
- `drivers/sql/sql-types.ts` (231) · `drivers/sql/sql-dialect.contract.ts` (210)
- `data-source/data-source-registry.ts` (194) · `data-source/data-source.ts` (178)
- `migration/types.ts` (190) · `migration/sql-grammar.ts` (160) · `migration/foreign-key-builder.ts` (150)
- `validation/database-writer-validation-error.ts` (180)
- `contracts/database-restorer.contract.ts` (156) · `contracts/database-remover.contract.ts` (112) · `contracts/database-id-generator.contract.ts` (111) · `contracts/database-writer.contract.ts` (128) · `contracts/sync-adapter.contract.ts` (71) · `contracts/driver-blueprint.contract.ts` (57)
- `model/model.types.ts` (113) · `model/register-model.ts` (128)

### Tier 4 — Haiku (47 files, <150 LOC)

Two batched agents covering many files each.

- All `model/methods/*.ts` except `query-methods.ts` (11 files)
- All `validation/{mutators,plugins,rules,transformers,validators}/*.ts` (5 files)
- All `errors/*.ts` (2 files) · `context/*.ts` (2 files) · `expressions/index.ts`
- All `index.ts` barrel files (migration/, sync/, relations/, drivers/sql/, drivers/postgres/, validation/, contracts/, top-level)
- `utils/is-valid-date-value.ts` · `utils/database-writer.utils.ts`
- `migration/sql-serializer.ts`
- `validation/database-seal-plugins.ts`
- `sql-database-dirty-tracker.ts`
- `test-migrations/*` — **SKIP** (not part of public API surface)

---

## _README.md and _index.md

After per-file maps are done, dispatch one Sonnet agent to rebuild:
- Each directory's `_README.md` — summary of files in that directory with one-line descriptions, linked
- Top-level `_index.md` — flat index of all exports across all files, grouped by category (Types, Classes, Functions, Constants)

---

## Execution Strategy

**Wave 1 — Tier 1 (parallel, background):** 14 Opus agents, one per file, run concurrently.

**Wave 2 — Tier 2 (parallel, background):** 8 Opus agents, one per file. Launched concurrently with Wave 1 since no shared files.

**Wave 3 — Tier 3 (parallel, background):** ~10 Sonnet agents grouped by directory. Launched after Wave 1+2 settle (lower priority).

**Wave 4 — Tier 4 (parallel, background):** 2 Haiku agents batching trivial files.

**Wave 5 — Indexes:** 1 Sonnet agent rebuilds all `_README.md` files and the top-level `_index.md` after all per-file maps exist.

**Rough count:** ~34 agents total, mostly in parallel. Each agent's single-file prompt + format spec is self-contained.

---

## Post-Regeneration

Once maps are regenerated, return to the original docs fix track:
1. Verify the docs-vs-map audit against the new maps (may surface more issues).
2. Spawn the migrations docs rewrite agent (now with trustworthy maps).
3. Run the restructure-nav agent.

---

## Shared Agent Prompt (embedded in every dispatch)

```
Regenerate a Cascade source map file. Read the source file completely, then produce a map following the exact format spec below.

SOURCE: <abs path to .ts file>
MAP OUTPUT: <abs path to .md file>
YOUR MODEL ID: <claude-opus-4-7 | claude-sonnet-4-6 | claude-haiku-4-5>

FORMAT SPEC:
[… the full spec block from this plan …]

RULES:
- Every public export, method, getter, setter must appear in the map.
- Every signature must match source exactly — no renaming, no added/removed params.
- If the source has >50 public methods on a class, DO NOT truncate — list them ALL.
- Line ranges must reflect the actual source locations.
- Skip `private` and `protected` members (unless marked @internal but exported).
- Set `first-mapped` and `last-mapped` to 2026-04-17.
- Set `created-by` and `last-updated-by` to your model id (passed above).
- If the target map file already exists and has a `created-by` field, PRESERVE its `created-by` and `first-mapped`; only overwrite `last-updated-by` and `last-mapped`.
- Do NOT execute code, do NOT run tests. Read-only against source, write map file.

Write the file with `Write` tool. When done, report: # of exports mapped, # of methods mapped, any ambiguities encountered.
```
