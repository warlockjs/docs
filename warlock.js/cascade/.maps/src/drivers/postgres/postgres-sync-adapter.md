# postgres-sync-adapter
source: drivers/postgres/postgres-sync-adapter.ts
description: Batch sync adapter for PostgreSQL that propagates denormalized data updates via JSONB path expressions and array-element CTE updates.
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- `SyncAdapterContract`, `SyncInstruction` from `../../contracts/sync-adapter.contract`
- `PostgresDriver` from `./postgres-driver`

## Exports
- `PostgresSyncAdapter` — Implements `SyncAdapterContract`; handles batched JSONB and array-element updates for denormalized data.  [lines 35-237]

## Classes / Functions / Types / Constants

### `PostgresSyncAdapter` [lines 35-237]
- Implements `SyncAdapterContract`. Holds a private readonly reference to `PostgresDriver` injected via constructor.
- Two private helpers (`executeJsonbUpdate`, `executeArrayElementUpdate`) perform SQL generation and execution and are not part of the public surface.

#### `constructor(driver: PostgresDriver)` [lines 41-41]
- Stores `driver` as private readonly field. The driver supplies `dialect` (for quoting and placeholder generation) and the `query()` execution method.

#### `executeBatch(instructions: SyncInstruction[]): Promise<number>` [lines 49-61]
- Iterates each instruction sequentially. Dispatches to `executeArrayUpdate` when `instruction.isArrayUpdate` is truthy; otherwise dispatches to `executeOne`. Accumulates and returns the total number of affected rows across all instructions.

#### `executeOne(instruction: SyncInstruction): Promise<number>` [lines 69-72]
- Delegates to private `executeJsonbUpdate` using `instruction.targetTable`, `instruction.filter`, and `instruction.update`. Returns affected row count.

#### `executeArrayUpdate(instruction: SyncInstruction): Promise<number>` [lines 80-96]
- Destructures `arrayField`, `identifierField`, `identifierValue` from the instruction. Falls back to `executeOne` when any of these are absent. Otherwise delegates to private `executeArrayElementUpdate` with a synthetic `arrayFilter` of `{ [identifierField]: identifierValue }`.

---

### Private Methods (documented for completeness)

#### `executeJsonbUpdate(table, filter, update): Promise<number>` [lines 106-164]
- Builds an `UPDATE … SET … WHERE …` statement using numbered `$N` parameters.
- Dotted `update` keys (e.g., `"author.name"`) emit `jsonb_set(COALESCE(col, '{}'::jsonb), '{path}', $N::jsonb)`.
- Plain `update` keys emit `"col" = $N`.
- Dotted `filter` keys emit `col->>'key' = $N`; plain keys emit `"col" = $N`.
- Executes via `driver.query(sql, params)`; returns `result.rowCount ?? 0`.

#### `executeArrayElementUpdate(table, filter, arrayField, arrayFilter, update): Promise<number>` [lines 176-236]
- Uses a CTE (`WITH updated AS (…)`) to rebuild the JSONB array via `jsonb_agg` + `jsonb_array_elements`.
- Array element matching uses `elem->>'key' = $N`; matched elements are merged with `jsonb_build_object(…)`; unmatched elements pass through via `ELSE elem`.
- Final `UPDATE … FROM updated` writes the new array back with the join predicate `t.id = u.id`.
- Returns `result.rowCount ?? 0`.

---

### Ambiguities / Known Limitations
- `executeArrayElementUpdate` hard-codes `t.id = u.id` as the CTE join predicate, assuming every target table has an `id` primary key. Tables with differently-named PKs will silently produce incorrect results.
- The JSONB path filter in `executeJsonbUpdate` joins dotted path segments with `->>`  between each pair, which generates invalid SQL for paths deeper than two segments (intermediate steps require `->`, not `->>`).
