# Task: Audit Existing Documentation

## Objective

Catalog every existing documentation page, identify its topic, and flag whether it likely needs updating for v4.

## Instructions

1. List all `.mdx` and `.md` files under `./docs/` recursively
2. For each file, extract:
   - File path
   - Title (from frontmatter or first `#` heading)
   - Package it documents (e.g., `cascade`, `auth`, `core`)
   - A one-line summary of what the page covers
   - Line count of the file
   - Status (see Rules below)
3. Check `sidebars.js` or `sidebars.ts` to understand the current doc navigation structure
4. Cross-reference: check the package inventory files in `./tasks/inventory/*.md` to verify that classes/functions mentioned in docs actually exist in the current codebase

## Output

Create the file at: `./tasks/inventory/docs-audit.md`

Format:

```markdown
# Documentation Audit

## Summary
- Total pages: X
- By package: core (N), cascade (N), ...
- Pages with content (>50 lines): N
- Stub pages (<50 lines): N
- Flagged for review: N pages
- Missing pages (in sidebar but no file): N

## Navigation Structure
(from sidebars config)

## Pages

| File Path | Title | Package | Lines | Summary | Status |
|-----------|-------|---------|-------|---------|--------|
| docs/warlock/auth/jwt.mdx | JWT Auth | auth | 120 | Explains JWT setup | NEEDS_REVIEW |
| docs/warlock/getting-started.mdx | Getting Started | core | 85 | Quickstart guide | OK |
| docs/warlock/cache/drivers.mdx | Cache Drivers | cache | 12 | Placeholder only | STUB |
```

## Rules

- Do NOT read the full content — just frontmatter + first 20 lines for context
- Assign one of these statuses:
  - `OK` — Has a title, meaningful content (>50 lines), and code examples
  - `STUB` — File exists but has little content (<50 lines or mostly placeholder/TODO text)
  - `NEEDS_REVIEW` — Contains any of these red flags:
    - Imports from packages not in `@warlock.js/*` or `@mongez/*` namespace
    - Empty code blocks or TODO/FIXME comments
    - Missing code examples for a concept that clearly needs one
    - References classes or functions that do NOT exist in the inventory files at `./tasks/inventory/*.md`
  - `MISSING` — Referenced in sidebar config but file doesn't exist on disk
- A page can be both `STUB` and `NEEDS_REVIEW` — use `STUB` as primary status in that case
- For NEEDS_REVIEW pages, add a brief note in the Summary column explaining why
