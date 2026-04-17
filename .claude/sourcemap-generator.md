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

## Map format

Strict structure — no prose, no usage examples, no opinions:

```
# {filename without extension}
source: {path relative to the target folder}

## Exports
- `symbol(param: Type): ReturnType` — ≤8-word note  [line 12]
- `ClassName<T>` — ≤8-word note  [lines 20-85]
- `CONST_NAME: Type` — ≤8-word note  [line 9]

## Classes

### ClassName<TGeneric>  [lines 20-85]
extends: ParentClass (or "none")
implements: InterfaceName (omit if none)

fields:
- `[abstract|readonly|static|protected] field: Type`  [line 24]

methods:
- `[abstract|static|protected] method(param: Type): ReturnType`  [lines 40-50] — note if non-obvious

## Functions

### functionName<TGeneric>(param: Type, param2?: Type): ReturnType  [lines 90-110]
- param: what it is
- param2?: what it is
- returns: what

## Types & Interfaces

### TypeName  [lines 115-122]
- `field: Type`
- `field?: Type`
- `field: 'literal' | 'union'`

## Constants
- `NAME: Type`  [line 8] — what it holds
```

## Rules

1. **Read the actual file** — never infer or guess
2. **Exact names** — copy field names, option names, string literals verbatim from source
3. **Mark all modifiers** — `abstract`, `static`, `readonly`, `protected`, `override`
4. **Delegation** — if a method just calls another: `delegates to X.method()`
5. **Public surface only** — skip `private` members
6. **No implementation** — what, not how
7. **≤80 lines per map** — if a file is large, one block per class is enough
8. **Skip non-logic files** — `*.spec.*`, `*.test.*`, pure barrel `index.*` (re-exports only), build artifacts, `node_modules`
9. **Barrel index** — if the file only re-exports, write one line: `re-exports: Symbol1, Symbol2, ...`
10. **Language-agnostic** — works for TypeScript, JavaScript, Python, Go, etc. Adapt type notation to the language

## Execution

1. **Discover** — list all source files in the target folder recursively, applying skip rules above
2. **Parallelize** — launch one sub-agent per file in a single message (all parallel, no waiting)
3. **Each sub-agent**:
   - Reads its assigned file
   - Writes the map to the output path
   - Does nothing else
4. **After all complete** — write `_index.md` at the maps root listing every map file and its exported symbols (one line per symbol)

## Sub-agent prompt template

```
Read the source file at `{absolute-source-path}`.

Generate a source map following this format (strict — no prose, no examples):

# {filename}
source: {relative-path}

## Exports
- `symbol` — ≤8-word note  [line N or lines N-M]

## Classes / Functions / Types / Constants
{per the format rules — include [line N] or [lines N-M] on every symbol, class, method, and field}

Rules:
- Exact names from source only, never guess
- Mark abstract, static, readonly, protected
- Include line numbers for every entry so the source can be jumped to directly
- Public surface only, skip private
- ≤80 lines total

Write the result to `{absolute-output-path}`. Do nothing else.
```

## Example output

```
# connect
source: src/utils/connect.ts

## Exports
- `connectToBroker(options: ConnectionOptions): Promise<Broker>` — connects and registers broker  [lines 59-106]
- `herald(name?: string): Broker` — returns broker by name or default  [line 136]
- `heraldChannel<TPayload>(name, options?): ChannelContract<TPayload>` — delegates to herald().channel()  [lines 156-161]
- `publishEvent<TPayload>(event: EventMessage<TPayload>): Promise<void>` — delegates to herald().publish()  [lines 175-177]
- `subscribeConsumer<TPayload>(Consumer: EventConsumerClass<TPayload>): Promise<void>` — delegates to herald().subscribe()  [lines 191-195]

## Functions

### connectToBroker(options: ConnectionOptions): Promise<Broker>  [lines 59-106]
- options: union of driver-specific connection option types
- returns: connected, registered Broker instance
- throws: if driver unknown or connection fails

### herald(name?: string): Broker  [line 136]
- name?: broker name; omit for default
- returns: Broker from registry
- throws: MissingBrokerError if not found

### heraldChannel<TPayload>(name: string, options?: ChannelOptions<TPayload>): ChannelContract<TPayload>  [lines 156-161]
- delegates to herald().channel(name, options)

### publishEvent<TPayload>(event: EventMessage<TPayload>): Promise<void>  [lines 175-177]
- delegates to herald().publish(event)

### subscribeConsumer<TPayload>(Consumer: EventConsumerClass<TPayload>): Promise<void>  [lines 191-195]
- delegates to herald().subscribe(Consumer)
```
