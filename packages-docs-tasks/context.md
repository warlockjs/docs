# Context Package — Docs Task

## Your Mission

Fully document the `@warlock.js/context` package by generating source maps,
analysing the existing docs, and filling every gap. Work autonomously — do not
wait for approval between phases.

> **Note:** No docs folder exists yet for this package (`docs/context/` is missing).
> You will be creating all pages from scratch. The package appears small (likely
> 2-3 source files) so coverage should be achievable in few pages.

---

## Working Directories

- **Docs site root:** `D:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/`
- **Context source:** `warlock.js/context/src/` (relative to docs site root)
- **Maps output:** `warlock.js/context/.maps/src/` (relative to docs site root)
- **Context docs:** `docs/context/` (relative to docs site root — create if missing)

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

1. List all source files under `warlock.js/context/src/` recursively.
2. Confirm that `docs/context/` does not exist.
3. Read the source files to understand the package — what it does, what it
   exports, how it is structured.

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

Since there are no existing docs, produce `reports/context-gap-report.md` listing:

- All exported symbols grouped by category
- Proposed page structure (what pages to create and what each covers)

```markdown
# Context Documentation Gap Report

## No existing docs — all symbols missing

## Proposed Page Structure
| Page filename | What it covers |
|---|---|

## Full Symbol List
| Symbol | Source file | Type |
|---|---|---|
```

---

## Phase 5 — Write Docs

Create all docs pages in parallel (one sub-agent per page).

- Each sub-agent reads the relevant maps first — never invents API.
- Always start with: `introduction.mdx`, `quick-start.mdx`
- Then one page per logical feature group derived from the maps.
- Match the Herald MDX style (`docs/herald/channels.mdx` as reference).

---

## Phase 6 — Commit

```bash
git add docs/context/ reports/context-gap-report.md
git commit -m "Context docs: generate maps and complete initial docs coverage

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

Note: `warlock.js/context` is a git submodule — if staging `.maps/` fails with
a submodule error, skip it and only commit `docs/context/` and the report.

---

## Final Report

When done, summarise:
- Map files generated and quality rating
- Doc pages created
- Overall docs coverage score (X/10)
