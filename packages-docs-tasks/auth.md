# Auth — Docs Task

## Your Mission

Fully document the auth layer of the Warlock framework by generating source maps,
analysing the existing docs, and filling every gap. Work autonomously — do not
wait for approval between phases.

> **Important architectural note:** Auth is NOT a standalone package. It is
> tightly coupled with `warlock.js/core`. Its source lives inside
> `warlock.js/core/src/` (explore to find the auth-related files). Its docs
> live under `docs/framework/auth/` (8 existing pages).

---

## Working Directories

- **Docs site root:** `D:/xampp/htdocs/mongez/node/warlock.js/docs/warlock-docs-latest/`
- **Core source (contains auth):** `warlock.js/core/src/` (relative to docs site root)
- **Maps output:** `warlock.js/core/.maps/src/` (relative to docs site root)
- **Auth docs:** `docs/framework/auth/` (relative to docs site root)

**Existing auth docs pages (8):**
`introduction`, `configuration`, `auth-model`, `jwt`, `middleware`,
`route-protection`, `access-control`, `events`

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

1. List all source files under `warlock.js/core/src/` recursively.
2. Identify which files are auth-related (look for auth/, guards/, jwt/,
   middleware/, permissions/, roles/, or similar naming).
3. Read the auth-related source files to understand what they export and how
   auth works in this framework.
4. Read the 8 existing docs pages to understand current coverage.

Only after you understand both the source and the existing docs, proceed to Phase 2.

---

## Phase 2 — Generate Source Maps (Auth files only)

Follow `sourcemap-generator.md` exactly — but only for auth-related source files.
Do not map the entire core package here (that is a separate task).

- Run `date` to get the current timestamp before spawning any sub-agents.
- Spawn one sub-agent per auth-related source file, all in parallel.
- Select model per the routing table in the instruction file.
- After maps complete, write a focused `_index.md` covering only auth symbols.

---

## Phase 3 — Generate _README.md Files

Follow `readme-generator.md` exactly.

- Run `date` again for a fresh timestamp.
- One sub-agent per auth-related subfolder in the maps output, all in parallel.

---

## Phase 4 — Gap Report

Read all 8 existing auth docs pages and compare every auth-related exported
symbol from the maps. Write `reports/auth-gap-report.md`:

```markdown
# Auth Documentation Gap Report

## Existing Pages (8 total)
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
- New pages match the existing `docs/framework/auth/` MDX style.
- Existing pages: surgical edits only, preserve correct content.

---

## Phase 6 — Commit

```bash
git add docs/framework/auth/ reports/auth-gap-report.md
git commit -m "Auth docs: generate maps, gap report, and complete docs coverage

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

Note: `warlock.js/core` is a git submodule — if staging `.maps/` fails with
a submodule error, skip it and only commit the docs and report.

---

## Final Report

When done, summarise:
- Auth-related map files generated and quality rating
- Doc pages created / updated / bugs fixed
- Overall auth docs coverage score (X/10)
