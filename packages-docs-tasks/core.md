# Core Package — Docs Task

## Your Mission

Fully document the `@warlock.js/core` package by generating source maps,
analysing the existing docs, and filling every gap. Work autonomously — do not
wait for approval between phases.

> **Important architectural note:** Core is the framework foundation — its docs
> live under `docs/framework/` (NOT `docs/core/`). The framework docs folder
> covers many subsystems (auth, cache, database, http, localization, mail, etc.)
> that are all part of or tightly coupled with core. Auth in particular has its
> own subfolder (`docs/framework/auth/`) and is handled separately.
> Focus this task on the non-auth parts of core.

---

## Working Directories

- **Docs site root:** `D:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/`
- **Core source:** `warlock.js/core/src/` (relative to docs site root)
- **Maps output:** `warlock.js/core/.maps/src/` (relative to docs site root)
- **Framework docs:** `docs/framework/` (relative to docs site root)

**Known framework docs subfolders:**
`advanced/`, `auth/`, `cache/`, `database/`, `getting-started/`, `http/`,
`image/`, `localization/`, `mail/`, `production/`, `repositories/`,
`upload/`, `utils/`, `validation/`

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

1. List all source files under `warlock.js/core/src/` recursively — group by
   subfolder to understand the architecture.
2. List all existing docs pages under `docs/framework/` recursively (skip
   `auth/` — that is covered by a separate task).
3. Read the source files to understand the package — application bootstrap,
   service container, providers, configuration, lifecycle, utilities, etc.
4. Map source subfolders to docs subfolders: understand which source files
   correspond to which existing docs sections.

Only after you understand the full picture, proceed to Phase 2.

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

Read all existing framework docs pages (excluding `auth/`) and compare every
exported symbol from the maps. Write `reports/core-gap-report.md`:

```markdown
# Core Documentation Gap Report

## Existing Pages (N total, excluding auth/)
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
- New pages go into the appropriate `docs/framework/` subfolder.
- Existing pages: surgical edits only, preserve correct content.

---

## Phase 6 — Commit

```bash
git add docs/framework/ reports/core-gap-report.md
git commit -m "Core docs: generate maps, gap report, and complete framework docs coverage

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

Note: `warlock.js/core` is a git submodule — if staging `.maps/` fails with
a submodule error, skip it and only commit the docs and report.

---

## Final Report

When done, summarise:
- Map files generated and quality rating
- Doc pages created / updated / bugs fixed
- Overall core/framework docs coverage score (X/10)
