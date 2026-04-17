# Source Map Generator

Generate machine-readable reference maps for every source file in a given folder.
Maps are consumed by AI agents during code review, documentation, and test generation —
they replace cold source-file reads with a compact, accurate reference.

## How to invoke

Provide a target folder path. Apply this entire instruction set to that folder.

Output maps at the same level as the target folder, never inside it:
`{target-folder}/../.maps/{target-folder-name}/{relative-path-to-file}.md`

Mirror the source structure exactly. Examples:
- target: `myproject/src` → maps root: `myproject/.maps/src/`
  - `src/utils/connect.ts` → `myproject/.maps/src/utils/connect.md`
  - `src/validators/string.ts` → `myproject/.maps/src/validators/string.md`
- target: `packages/auth/src` → maps root: `packages/auth/.maps/src/`
  - `src/middleware.ts` → `packages/auth/.maps/src/middleware.md`

The `_index.md` goes at the maps root: `{target-folder}/../.maps/_index.md`

## Model routing

Choose based on project type and file complexity:

**Framework / library packages** (precision matters more):
- **Haiku** — barrel indexes only (`index.ts` with re-exports only)
- **Sonnet** — types, utilities, decorators, contracts, simple classes
- **Opus** — complex driver implementations, large classes with many methods, intricate generics or multi-path control flow

**Application / normal projects** (speed and cost matter more):
- **Haiku** — pure type/interface files, barrel indexes, plain constants
- **Sonnet** — utility functions, decorators, simple classes, contracts
- **Opus** — same as above (reserve for truly complex files only)

## Map format

Strict structure — no prose, no usage examples, no opinions:

```
# {filename without extension}
source: {path relative to the target folder}
description: One sentence — what this file holds and its purpose in the system.
complexity: simple | medium | complex
first-mapped: YYYY-MM-DD HH:MM:SS AM/PM
last-mapped: YYYY-MM-DD HH:MM:SS AM/PM

## Imports
- `Symbol` from `package-or-relative-path`

## Exports
- `symbol(param: Type): ReturnType` — ≤8-word note  [line 12]
- `ClassName<T>` — ≤8-word note  [lines 20-85]
- `CONST_NAME: Type` — ≤8-word note  [line 9]

## Classes

### ClassName<TGeneric>  [lines 20-85] — ≤8-word purpose note
extends: ParentClass (or "none")
implements: InterfaceName (omit if none)
deprecated: reason (omit if not deprecated)

fields:
- `[abstract|readonly|static|protected] field: Type`  [line 24] — note if name is not self-explanatory
- `field?: Type = defaultValue`  [line 25] — note if name is not self-explanatory

methods:
- `[abstract|static|protected] method(param: Type): ReturnType`  [lines 40-50] — ≤8-word purpose note
  - throws: `ErrorType` — when condition
  - side-effects: what state/events/I-O it touches (omit if pure)

## Functions

### functionName<TGeneric>(param: Type, param2?: Type = default): ReturnType  [lines 90-110] — ≤8-word purpose note
deprecated: reason (omit if not deprecated)
- param: what it is
- param2?: what it is (default: value)
- returns: what
- throws: `ErrorType` — when condition (omit if never throws)
- side-effects: what state/events/I-O it touches (omit if pure)
- since: vX.Y.Z (omit if unknown or no @since tag)
- see: relative/path/to/related.md (omit if none)

## Types & Interfaces

### TypeName  [lines 115-122] — ≤8-word purpose note
deprecated: reason (omit if not deprecated)
- `field: Type` — note if name is not self-explanatory
- `field?: Type = defaultValue` — note if name is not self-explanatory
- `field: 'literal' | 'union'`
- see: relative/path/to/related.md (omit if none)

## Constants
- `NAME: Type`  [line 8] — what it holds
```

## Rules

1. **Read the actual file** — never infer or guess
2. **Exact names** — copy field names, option names, string literals verbatim from source
3. **Mark all modifiers** — `abstract`, `static`, `readonly`, `protected`, `override`
4. **Delegation** — if a method just calls another: `delegates to X.method()`
5. **Public surface only** — skip `private` members; if a symbol has no `export` keyword, either skip it entirely or include it marked as `(internal — not exported)` only when it is referenced by an exported symbol's signature
6. **No implementation** — what, not how
7. **≤80 lines per map** — if a file is large, one block per class is enough
8. **Skip non-logic files** — `*.spec.*`, `*.test.*`, pure barrel `index.*` (re-exports only), build artifacts, `node_modules`
9. **Barrel index** — if the file only re-exports, write one line: `re-exports: Symbol1, Symbol2, ...`
10. **Language-agnostic** — works for TypeScript, JavaScript, Python, Go, etc. Adapt type notation to the language
11. **Imports** — list every imported symbol and its source (package name or relative path); only include symbols actually used in the public surface; omit section if none
12. **description** — one sentence after `source:` summarising what the file holds and its role in the system
13. **complexity** — `simple` (only types/constants), `medium` (functions/small classes), `complex` (large classes, generics, multi-driver logic)
14. **Notes on definitions** — ≤8-word purpose note required on every class, function, and type/interface definition; optional on individual fields (only when the name alone is not self-explanatory)
15. **Default values** — append `= defaultValue` to optional fields/params when a default exists in source
16. **throws** — required on every async function and every method that can throw; list the specific error type and triggering condition
17. **side-effects** — note mutations, event emissions, or I/O beyond the return value; omit entirely if the function is pure
18. **deprecated** — add `deprecated: reason` under the definition header if the symbol has a `@deprecated` JSDoc tag
19. **since** — add `since: vX.Y.Z` if a `@since` JSDoc tag exists on the symbol
20. **see** — add `see: path/to/related.md` when a type references or is closely paired with another map file
21. **Timestamps** — `first-mapped` is set once on creation and never changed on re-runs; `last-mapped` is always updated to the current date-time; format: `YYYY-MM-DD HH:MM:SS AM/PM`. **The orchestrator (Claude) must resolve both values before spawning sub-agents** — read the existing map to extract `first-mapped` (or use now if no map exists), get the real current time via shell, then pass both as literal strings in the prompt. Never ask a sub-agent to determine the current time itself.

## Execution

1. **Discover** — list all source files in the target folder recursively, applying skip rules above
2. **Parallelize** — launch one sub-agent per file in a single message (all parallel, no waiting); select model per the Model routing table above
3. **Before spawning agents** — run `date +"%Y-%m-%d %I:%M:%S %p"` to get the real current time; for each file that already has a map, read it to extract the existing `first-mapped` value
4. **Each sub-agent**:
   - Receives `first-mapped` and `last-mapped` as literal resolved strings in the prompt
   - Reads its assigned source file
   - Writes the map to the output path
   - Does nothing else
4. **After all complete** — write `_index.md` at the maps root grouped by category (Types, Functions, Classes, Constants), one line per symbol with its description

## Sub-agent prompt template

```
Read the source file at `{absolute-source-path}`.
If a map already exists at `{absolute-output-path}`, read it first to extract the existing `first-mapped` value (preserve it exactly). Otherwise set `first-mapped` to now.

Generate a source map following this format (strict — no prose, no examples):

# {filename}
source: {relative-path}
description: One sentence — what this file holds and its purpose in the system.
complexity: simple | medium | complex
first-mapped: {preserved or now}
last-mapped: {now}   ← format: YYYY-MM-DD HH:MM:SS AM/PM

## Imports
- `Symbol` from `package-or-relative-path`  (only symbols used in public surface; omit section if none)

## Exports
- `symbol` — ≤8-word note  [line N or lines N-M]

## Classes / Functions / Types / Constants
{per the format rules}

Rules:
- Exact names from source only, never guess
- Mark abstract, static, readonly, protected, override
- Include [line N] or [lines N-M] on every symbol, class, method, field
- Public surface only, skip private
- complexity: simple (types/constants only) | medium (functions/small classes) | complex (large classes, generics, multi-driver)
- ≤8-word purpose note required on every class, function, type/interface definition
- Field/param notes only when the name alone is not self-explanatory
- Append = defaultValue to optional fields/params when a default exists
- throws: required on async functions and throwing methods — list error type + condition
- side-effects: note mutations/events/I-O; omit if pure
- deprecated: add if @deprecated JSDoc tag present
- since: add vX.Y.Z if @since tag present
- see: link to related map file if closely paired
- ≤80 lines total

Write the result to `{absolute-output-path}`. Do nothing else.
```

## Example output

```
# connect
source: src/utils/connect.ts
description: Entry-point utilities for connecting to a message broker and accessing channels, publishing, and subscribing via a default broker instance.
complexity: medium
first-mapped: 2026-04-17 03:45:22 PM
last-mapped: 2026-04-17 03:45:22 PM

## Imports
- `ConnectionOptions` from `./types/connection.types`
- `Broker` from `./communicators/broker`
- `MissingBrokerError` from `./errors`

## Exports
- `connectToBroker(options: ConnectionOptions): Promise<Broker>` — connects and registers broker  [lines 59-106]
- `herald(name?: string): Broker` — returns broker by name or default  [line 136]
- `heraldChannel<TPayload>(name, options?): ChannelContract<TPayload>` — delegates to herald().channel()  [lines 156-161]
- `publishEvent<TPayload>(event: EventMessage<TPayload>): Promise<void>` — delegates to herald().publish()  [lines 175-177]
- `subscribeConsumer<TPayload>(Consumer: EventConsumerClass<TPayload>): Promise<void>` — delegates to herald().subscribe()  [lines 191-195]

## Functions

### connectToBroker(options: ConnectionOptions): Promise<Broker>  [lines 59-106] — instantiates driver, connects, registers broker
- options: union of driver-specific connection option types
- returns: connected, registered Broker instance
- throws: `Error` — if driver unknown or connection fails
- side-effects: registers broker in global BrokerRegistry

### herald(name?: string): Broker  [line 136] — returns broker by name or default
- name?: broker name; omit for default
- returns: Broker from registry
- throws: `MissingBrokerError` — if broker not found
- see: ../communicators/broker-registry.md

### heraldChannel<TPayload>(name: string, options?: ChannelOptions<TPayload>): ChannelContract<TPayload>  [lines 156-161] — shorthand for default broker channel
- delegates to herald().channel(name, options)

### publishEvent<TPayload>(event: EventMessage<TPayload>): Promise<void>  [lines 175-177] — publishes to default broker
- delegates to herald().publish(event)

### subscribeConsumer<TPayload>(Consumer: EventConsumerClass<TPayload>): Promise<void>  [lines 191-195] — subscribes to default broker
- delegates to herald().subscribe(Consumer)
```
