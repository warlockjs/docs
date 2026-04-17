# sync-maps

When you modify a source file, check whether a corresponding map file exists in the `.maps` directory and update it to reflect your changes.

## Trigger

Apply this skill automatically whenever you write or edit a source file (any language). Do not wait to be asked.

## How to locate the map file

Given a source file path, the map lives at:
```
{nearest-ancestor-containing-.maps}/.maps/{relative-path-from-that-ancestor}/{filename}.md
```

Examples:
- `src/utils/connect.ts` → `.maps/src/utils/connect.md`
- `packages/auth/src/middleware.ts` → `packages/auth/.maps/src/middleware.md`

If no `.maps` directory exists anywhere above the file, skip silently — do not create one.

## What to update in the map

1. Read the existing map file
2. Reflect only what changed in the source:
   - Renamed symbol → update name everywhere it appears
   - Added export → add entry to `## Exports` and the relevant section
   - Removed export → remove its entry
   - Changed signature → update signature and param/return notes
   - Changed type of a field → update the field line
   - Added/removed throws → update or add `throws:` line
   - Added/removed side-effects → update or add `side-effects:` line
   - Added `@deprecated` tag → add `deprecated:` under the definition
   - Added `@since` tag → add `since:` under the definition
3. Always update `last-mapped` to the current date-time (`YYYY-MM-DD HH:MM:SS AM/PM`)
4. Never change `first-mapped`
5. Re-evaluate `complexity` if the change substantially grows or shrinks the file
6. Re-evaluate `description` if the file's purpose has shifted

## Rules

- Do not rewrite the whole map — surgical edits only
- Do not add prose, opinions, or usage examples
- Keep all line numbers accurate after the edit
- If the map is severely out of date (many stale entries), do a full regeneration using the sourcemap-generator instructions
- Public surface only — do not map private members
