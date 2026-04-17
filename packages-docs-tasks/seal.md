# Seal Package — Docs Task

## Your Mission

Fully document the `@warlock.js/seal` package by generating source maps,
analysing the existing docs, and filling every gap. Work autonomously — do not
wait for approval between phases.

> **Note:** Seal has very extensive existing docs (`docs/seal/` with many
> subfolders and pages covering each validator). This is a large package —
> expect many source files. Focus heavily on gap analysis and signature
> correctness. Spawn sub-agents aggressively to parallelise the work.

---

## Working Directories

- **Docs site root:** `D:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/`
- **Seal source:** `warlock.js/seal/src/` (relative to docs site root)
- **Maps output:** `warlock.js/seal/.maps/src/` (relative to docs site root)
- **Seal docs:** `docs/seal/` (relative to docs site root)

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

1. List all source files under `warlock.js/seal/src/` recursively — there may
   be many. Group them by subfolder to understand the structure.
2. List all existing docs pages under `docs/seal/` recursively.
3. Read enough source files to understand the package architecture — validators,
   factory, helpers, config, what is exported from the root index.

Only after you understand the package, proceed to Phase 2.

---

## Phase 2 — Generate Source Maps

Follow `sourcemap-generator.md` exactly.

- Run `date` to get the current timestamp before spawning any sub-agents.
- Spawn one sub-agent per non-trivial source file, all in parallel.
  If there are many files, batch them wisely — still one sub-agent per file.
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
the maps against what the docs cover. Write `reports/seal-gap-report.md`:

```markdown
# Seal Documentation Gap Report

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
- New pages match the existing Seal MDX style.
- Existing pages: surgical edits only, preserve correct content.

---

## Phase 6 — Commit

```bash
git add docs/seal/ reports/seal-gap-report.md
git commit -m "Seal docs: generate maps, gap report, and complete docs coverage

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

Note: `warlock.js/seal` is a git submodule — if staging `.maps/` fails with
a submodule error, skip it and only commit `docs/seal/` and the report.

---

## Final Report

When done, summarise:
- Map files generated and quality rating
- Doc pages created / updated / bugs fixed
- Overall docs coverage score (X/10)
