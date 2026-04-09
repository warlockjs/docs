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
   - Whether it mentions v3-specific APIs (flag as "NEEDS_REVIEW")
3. Also check `sidebars.js` or `sidebars.ts` to understand the current doc navigation structure

## Output

Create the file at: `./tasks/inventory/docs-audit.md`

Format:

```markdown
# Documentation Audit

## Summary
- Total pages: X
- By package: core (N), cascade (N), ...
- Flagged for review: N pages

## Navigation Structure
(from sidebars config)

## Pages

| File Path | Title | Package | Summary | Status |
|-----------|-------|---------|---------|--------|
| docs/warlock/auth/jwt.mdx | JWT Auth | auth | Explains JWT setup | NEEDS_REVIEW |
| docs/warlock/getting-started.mdx | Getting Started | core | Quickstart guide | OK |
```

## Rules

- Do NOT read the full content of each doc — just frontmatter + first 10 lines to extract title/summary
- Flag as NEEDS_REVIEW if you see deprecated patterns, v3 references, or imports that don't match current package exports
- Flag as MISSING if a sidebar entry points to a file that doesn't exist
