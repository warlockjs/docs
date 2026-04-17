# README Generator

Generate AI-reference `_README.md` files for each folder inside a `.maps` directory.
These files are consumed by AI agents writing documentation — their job is to prevent
hallucinations by providing accurate, example-first descriptions of what a folder holds.

## How to invoke

Provide a target `.maps` folder (or a source folder whose `.maps` sibling you want to populate).
Apply this instruction set to every subfolder (including the root) of the maps tree.

Output path: `{maps-folder}/{subfolder}/_README.md`

## Model routing

- **Haiku** — leaf folders with only types/constants (e.g. `types/`)
- **Sonnet** — all other folders (utilities, decorators, communicators, message-managers)
- **Opus** — driver implementation folders with complex cross-cutting behavior

## README format

```
# {Folder Name}

> {One sentence: what this folder is and its role in the system.}

## What lives here

{Bullet list of files with one-line descriptions. Source from the .md map files.}

## Public API

{List every exported symbol with its signature. Copy from map files — do NOT invent.}

## How it fits together

{2-4 sentences on dependency flow: what this folder imports from and what imports from it.}

## Working examples

{2-5 minimal, self-contained code snippets using ONLY symbols that exist in the maps.
 Each example must show a real usage pattern, not pseudo-code.
 Use fenced TypeScript blocks.}

## DO NOT

{Bullet list of anti-hallucination rules. Common mistakes an AI might make.
 Examples:
 - Do NOT use `nonExistentMethod()` — it does not exist
 - Do NOT import from `./internal-file` — it is not exported
 - Do NOT assume the broker auto-connects — call `connect()` explicitly
 - Do NOT pass raw objects where `EventMessage` instances are required}

## Internal (not for docs)

{List internal symbols (marked "(internal — not exported)" in maps) with a one-line note.
 Omit section if no internals.}
```

## Rules

1. **Read all map files in the folder first** — never invent symbols or signatures
2. **Examples use only exported symbols** — never reference internal or private members
3. **"DO NOT" section is mandatory** — think about what an AI might plausibly hallucinate
4. **No prose fluff** — each section is actionable reference, not marketing copy
5. **Signatures verbatim** — copy from map files; never paraphrase type names
6. **Dependency flow** — state which packages/folders this folder imports from and which folders import from it (derive from Imports sections in map files)
7. **No invented examples** — every code snippet must be constructible from map-file exports only
8. **Omit empty sections** — if there are no internals, skip that section entirely
9. **`created` timestamp** — add `created: YYYY-MM-DD HH:MM:SS AM/PM` at the very top (after the `# heading`) on first creation; update `updated:` on every re-run
10. **Language** — TypeScript for all examples unless the folder is language-agnostic

## Sub-agent prompt template

```
You are generating an AI-reference _README.md for the folder: `{folder-name}`.

Maps folder: `{absolute-maps-folder-path}`
Source folder: `{absolute-source-folder-path}`

Step 1 — Read every .md map file in `{absolute-maps-folder-path}` (not subdirectories).
Step 2 — Read the actual source files in `{absolute-source-folder-path}` to extract real usage patterns for examples.
Step 3 — Write `{absolute-maps-folder-path}/_README.md` following this format exactly:

# {Folder Name}
created: {now}
updated: {now}

> {One sentence: what this folder is and its role in the system.}

## What lives here
- `filename.ts` — one-line description (from map)

## Public API
- `ExportedSymbol(param: Type): ReturnType` — ≤8-word note

## How it fits together
{2-4 sentences on dependency flow.}

## Working examples
\`\`\`typescript
// Example title
{actual code using only exported symbols}
\`\`\`

## DO NOT
- Do NOT ... — reason

## Internal (not for docs)
- `SymbolName` — why it exists internally (omit section if none)

Rules:
- Every symbol, type name, and method signature must be copied verbatim from the map files
- Working examples must only use symbols listed under ## Exports in the map files
- The DO NOT section must have at least 3 entries identifying realistic AI mistakes
- No invented or guessed symbols — if it is not in a map file, it does not go in the README
- Omit "Internal" section if no map file has "(internal — not exported)" markers
```

## Execution

1. **Discover** — list all subfolders inside the `.maps` directory (including root)
2. **Resolve timestamp** — run `date +"%Y-%m-%d %I:%M:%S %p"` once; pass the resulting literal string as `{now}` in every sub-agent prompt. **Never let a sub-agent determine the current time itself** — inject it as a literal before spawning.
3. **Parallelize** — spawn one sub-agent per folder in a single message
4. **Each sub-agent** reads its folder's map files + source files, then writes `_README.md`
