# Scheduler Package — Docs Task

## Your Mission

Fully document the `@warlock.js/scheduler` package by generating source maps,
analysing the existing docs, and filling every gap. Work autonomously — do not
wait for approval between phases.

> **Note:** Scheduler has some existing docs (`docs/scheduler/` with ~7 pages).
> The package source appears small (likely 3 files). Focus on gap analysis
> and ensuring signatures are correct.

---

## Working Directories

- **Docs site root:** `D:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/`
- **Scheduler source:** `warlock.js/scheduler/src/` (relative to docs site root)
- **Maps output:** `warlock.js/scheduler/.maps/src/` (relative to docs site root)
- **Scheduler docs:** `docs/scheduler/` (relative to docs site root)

---

## How This Project Works

Before doing anything, read these three instruction files — they define the
exact formats and rules you must follow:

1. `.claude/sourcemap-generator.md` — how to generate `.maps` files
2. `.claude/skills/readme-generator.md` — how to generate `_README.md` files
3. `.claude/skills/sync-maps.md` — how to keep maps in sync after edits

Also read `warlock.js/herald/.maps/src/` to see what finished maps look like,
and read one existing Herald doc page (e.g. `docs/herald/channels.mdx`) to
understand the MDX style you must match.

---

## Phase 1 — Explore

Before generating anything:

1. List all source files under `warlock.js/scheduler/src/` recursively.
2. List all existing docs pages under `docs/scheduler/`.
3. Read the source files to understand the package fully.

Only after you understand the package, proceed to Phase 2.

---

## Phase 2 — Generate Source Maps

Follow `sourcemap-generator.md` exactly.

- Run `date` to get the current timestamp before spawning any sub-agents.
- Spawn one sub-agent per non-trivial source file, all in parallel.
- Select model per the routing table in the instruction file.
- After maps complete, write `_index.md` at the maps root.

---

## Phase 3 — Generate _README.md Files

Follow `readme-generator.md` exactly.

- Run `date` again for a fresh timestamp.
- One sub-agent per subfolder (including root), all in parallel.

---

## Phase 4 — Gap Report

Read all existing docs pages carefully and compare every exported symbol from
the maps against what the docs cover. Write `reports/scheduler-gap-report.md`:

```markdown
# Scheduler Documentation Gap Report

## Existing Pages (N total)
...

## Coverage by Map-Documented Symbol
| Symbol / Feature | Map source | Status |
|---|---|---|
| ... | ... | ✅ Covered / ⚠️ Partial / ❌ Missing |

## Errors in Existing Docs
(wrong method names, invented API, incorrect signatures, etc.)

## Action Plan
### New Pages to Write
### Existing Pages to Update (including bug fixes)
```

---

## Phase 5 — Fix and Write Docs

Immediately after the gap report, execute all fixes and new pages in parallel.

- One sub-agent per file, all in a single message.
- Each sub-agent reads the relevant maps first — never invents API.
- New pages match the existing Scheduler MDX style.
- Existing pages: surgical edits only, preserve correct content.

---

## Phase 6 — Commit

```bash
git add docs/scheduler/ reports/scheduler-gap-report.md
git commit -m "Scheduler docs: generate maps, gap report, and complete docs coverage

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

Note: `warlock.js/scheduler` is a git submodule — if staging `.maps/` fails with
a submodule error, skip it and only commit `docs/scheduler/` and the report.

---

## Final Report

When done, summarise:
- Map files generated and quality rating
- Doc pages created / updated / bugs fixed
- Overall docs coverage score (X/10)
