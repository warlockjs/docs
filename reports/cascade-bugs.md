# Cascade Source Bugs & Inconsistencies

**Source:** Flagged during `.maps/` regeneration on 2026-04-17 by Opus/Sonnet/Haiku agents reading every `.ts` file end-to-end.
**Scope:** Issues in `warlock.js/cascade/src/` — NOT in documentation. These are bugs/inconsistencies in Cascade's own TypeScript source.

Issues are tiered by severity. A fix agent should handle **Tier 1** and **Tier 2** mechanically. **Tier 3** and **Tier 4** require design decisions and should be reviewed by a human first.

---

## Fix status (2026-04-17)

**Tier 1 — 5 of 6 fixed:**
- ✅ #1 `MongoDbDriver.serialize` — return `serialized` instead of `data`
- ✅ #2 `executeArrayElementUpdate` — now uses PostgreSQL's `ctid` (PK-agnostic) instead of hardcoded `t.id`
- ✅ #3 `executeJsonbUpdate` — intermediate path segments use `->`, only final uses `->>`
- ✅ #4 `updateById` — now uses `ModelClass.primaryKey`
- ✅ #5 `databaseModelRule` typo — renamed to `databaseModel` (no callers referenced the typo'd string literal)
- ⚠️ #6 `loadBelongsToMany` pivot key — **NOT fixed**. Fix agent determined `relation-loader.ts` and `pivot-operations.ts` use identical mapping logic consistent with the `RelationDefinition` type contract. Needs real belongsToMany query tests to confirm there's any inversion at all. Leaving to human review.

**Tier 2 — 7 of 7 fixed:**
- ✅ #7 `MigrationContract.vector()` duplicate declaration removed
- ✅ #8 `getUuidDefault` JSDoc example updated to match `uuidv7()`
- ✅ #9 `PostgresDriver.atomic()` doc no longer claims unsupported locking
- ✅ #10 `DefineModelOptions.deleteStrategy` JSDoc default corrected to `"trash"`
- ✅ #11 `ModelEvents.onSaved` return type annotation added
- ✅ #12 `triggerSync` duplicate JSDoc removed
- ✅ #13 `MongoQueryBuilder.latest()` return type annotation added

**Tests NOT run** — the fix agent's bash was sandboxed. Run manually:
```bash
cd /home/mentoor/warlock.js/docs/warlock.js/cascade && yarn test
```

**Tier 3 and Tier 4** left untouched pending human decisions.

---

## Tier 1 — Real bugs (likely need fixing)

### 1. `MongoDbDriver.serialize()` returns unserialized data
**File:** `src/drivers/mongodb/mongodb-driver.ts` (lines 617-640)
**Problem:** The method builds a `serialized` local record but then returns the original `data` parameter unchanged.
**Fix:** Return the `serialized` record instead of `data`.

### 2. `PostgresSyncAdapter.executeArrayElementUpdate` hardcodes `t.id = u.id`
**File:** `src/drivers/postgres/postgres-sync-adapter.ts`
**Problem:** CTE join predicate is hardcoded to `t.id = u.id`. Breaks on any table whose PK is not named `id`.
**Fix:** Resolve the PK column from the model metadata (`ModelClass.primaryKey`) and template it into the join.

### 3. `PostgresSyncAdapter.executeJsonbUpdate` uses wrong JSONB path operator
**File:** `src/drivers/postgres/postgres-sync-adapter.ts`
**Problem:** Dotted filter paths join all segments with `->>` (text-returning operator). Invalid for paths deeper than 2 levels — intermediate segments must use `->` (jsonb-returning), only the final segment should use `->>`.
**Fix:** Switch all intermediate segments to `->` and keep only the final segment as `->>`.

### 4. `updateById` hardcodes `"id"` instead of `primaryKey`
**File:** `src/model/methods/query-methods.ts`
**Problem:** Filter uses hardcoded key `"id"` instead of `ModelClass.primaryKey`. Models configured with a non-`id` primary key break.
**Fix:** Replace the filter to use `{ [ModelClass.primaryKey]: id }`.

### 5. `database-model-rule` — typo in rule name
**File:** `src/validation/rules/database-model-rule.ts`
**Problem:** Rule name is registered as `"databaseModule"` instead of `"databaseModel"`. Likely a typo — the file is named `database-model-rule.ts`.
**Fix:** Verify intent with git blame. If typo, correct to `"databaseModel"`. Check all callers that reference the rule name and update them too.

### 6. `RelationLoader.loadBelongsToMany` pivot key mapping inversion
**File:** `src/relations/relation-loader.ts` (lines 337-340)
**Problem:** Maps `definition.localKey` → `pivotLocalKey` and vice versa; this inversion looks wrong compared to the `BelongsToManyOptions` type contract.
**Fix:** Cross-check against `PivotOperations.getPivotConfig()` (which has the same swap). Exactly one of them is wrong — either the loader or the pivot ops helper. Verify against expected SQL output for a real belongsToMany query, then correct.

---

## Tier 2 — Doc/spec drift (JSDoc vs code)

Low-risk mechanical fixes: adjust JSDoc or type annotation to match runtime behavior.

### 7. `MigrationContract.vector()` declared twice
**File:** `src/migration/migration.ts` (lines 349 and 622)
**Fix:** Remove the duplicate declaration (keep one; the class only has a single implementation).

### 8. `getUuidDefault` JSDoc mismatches implementation
**File:** `src/drivers/postgres/postgres-migration-driver.ts`
**Problem:** JSDoc example says v7 returns `uuid_generate_v7()`, code returns `uuidv7()`.
**Fix:** Update JSDoc example to reflect actual return value (or change code if the JSDoc represents intent — requires a decision).

### 9. `PostgresDriver.atomic()` doc claims unsupported row-level locking
**File:** `src/drivers/postgres/postgres-driver.ts`
**Problem:** JSDoc mentions `SELECT FOR UPDATE` but implementation doesn't issue any lock — it just reuses the single-row update path.
**Fix:** Remove the locking claim from the JSDoc, OR implement `SELECT FOR UPDATE` (design decision — leave JSDoc fix for now).

### 10. `DefineModelOptions` JSDoc vs factory default
**File:** `src/utils/define-model.ts`
**Problem:** `DefineModelOptions.deleteStrategy` JSDoc says default is `"hard"` but the factory defaults to `"trash"`.
**Fix:** Update JSDoc to `"trash"` (factory behavior is the ground truth).

### 11. `ModelEvents.onSaved` return type missing
**File:** `src/events/model-events.ts` (line 186)
**Problem:** `onSaved` implementation returns `() => void` (the unsubscribe function) but the return type annotation is missing. Other shorthand methods have it.
**Fix:** Add `: () => void` return type annotation.

### 12. Duplicate JSDoc block for `triggerSync`
**File:** `src/writer/database-writer.ts` (lines 474-480 repeated at 481-489)
**Fix:** Remove the duplicate JSDoc block.

### 13. `MongoQueryBuilder.latest()` missing return type annotation
**File:** `src/drivers/mongodb/mongodb-query-builder.ts` (lines 1360-1362)
**Problem:** Method returns `Promise<T[]>` (via `.get()`) but has no declared return type, breaking inference for chained callers.
**Fix:** Add `: Promise<T[]>` return type annotation.

---

## Tier 3 — Design decisions / inconsistencies (needs review, NOT mechanical)

Do NOT let the fix agent touch these. Each needs a human decision about intended behavior.

- `MongoQueryBuilder.has`/`whereHas`/`doesntHave`/`whereDoesntHave` — marked TODO; currently push placeholder match operations.
- `MongoQueryBuilder.rightJoin`/`fullJoin` — MongoDB cannot natively perform those; current implementation emits a left-join with a `type` flag.
- `QueryBuilder.latest(column)` returns `Promise<T[]>` (breaks fluent chain) while sibling `oldest(column)` returns `this`.
- `QueryBuilder.whereDateNotBetween` writes a `whereNotBetween` op type rather than a dedicated op.
- `QueryBuilder.orWhereFullText` delegates straight to `whereFullText`, records `whereFullText` op instead of a distinct OR variant.
- `QueryBuilder.textSearch(query, filters?)` accepts `query` but only records `filters` via `where()`; does not emit a text-search op — drivers override.
- `QueryBuilder.whereStartsWith`/`Ends`/`Not` variants accept `string | number` but only call `whereLike(field, pattern)` — numbers coerced via template literal without explicit conversion.
- `PostgresDriver.insertMany()` returns `result.rows` cast as `InsertResult[]` while `insert()` wraps the row in `{ document }` — inconsistent shape under the same contract.
- `PostgresDriver.replace()` and `upsert()` skip `deserialize()` on returned rows, unlike other read paths.
- `QueryBuilderContract.join(options: JoinOptions)` declared twice (lines 1033 and 1573).
- `QueryBuilderContract.whereExists`/`whereNotExists` each declared twice (callback-based nested check vs MongoDB-style field existence check).
- `DriverContract.query<T>(sql, params?): Promise<any>` declares generic `T` that is unused — return type is `Promise<any>`, not `Promise<T>`.
- `DriverContract.delete`/`deleteMany` filter is optional — calling without a filter would affect all rows (destructive; left to driver implementation).
- `DriverEvent` union is `"connected" | "disconnected" | string` — collapses to `string` at the type level; literal hints are doc-only.
- `PostgresQueryParser` declares union variants (`has`, `whereHas`, `doesntHave`, `whereDoesntHave`, `whereExists`, `whereNotExists`, `whereDate*`) that have no handler in `processOperation` — silently dropped.
- `PostgresMigrationDriver.addColumn` silently drops `virtual: true` on generated columns; `modifyColumn` default-value handling diverges from `addColumn`.
- `PostgresMigrationDriver.listIndexes` column parsing uses a naive first-parenthesized-group regex — fragile for expression/INCLUDE indexes.
- `onceConnected` uses persistent `on`/`off`; `onceDisconnected` uses `once` and re-subscribes on non-matching events — asymmetric behavior.
- `DatabaseWriter.generateNextId` carries a `@private` JSDoc tag but is declared with the TypeScript `public` modifier.
- `MongoIdGenerator.generateNextId` directly calls `database.collection(...).findOneAndUpdate` bypassing driver session wrappers — potential transaction-safety gap.
- `belongsTo` helper accepts a bare string as 2nd arg (shorthand for foreignKey) with `ownerKey` hardcoded to `"id"` — not overridable in that shorthand path.

---

## Tier 4 — Cleanups / dead code / cosmetic

Lowest priority. Can be a follow-up sweep.

- `transactionClient` private getter on `PostgresMigrationDriver` — defined but never referenced.
- `SyncManager.buildFilter` has identical branches for `isMany=true` vs single (same dotted-path filter).
- `SyncManager.getEmbedData` — fallback returns `data.embedData` as a property, not a call (source comment says "Fallback: use embedData() if available").
- `SyncManager.executeBatch` catches errors only to immediately re-throw — try/catch is vestigial.
- `ModelSyncOperation.removeTargetDocuments` — identical filter code in both `isMany=true` and `isMany=false` branches (lines 342-344).
- `MongoMigrationDriver.createIndex` sets `unique`/`sparse` to `true` but never to `false` when the flag is absent.
- `MongoMigrationDriver.dropUniqueIndex` requires index keys to match the column list in exact order.
- `MongoMigrationDriver.dropIndex` with columns array always generates ascending keys (`_1` suffix) regardless of original direction.
- `ModelEvents.emitFetching` passes `query` as the `model` argument (cast to `any`) — semantically unusual.
- `DatabaseWriterValidationError.toString()` uses `err.input` (not `err.path`) as field grouping key; `(err as any).value` cast means `value` is not in `ValidationResult["errors"]` type.
- `Migration.create` / `Migration.alter` are declared as static property stubs and then reassigned via `Migration.create = …` below the class body — unusual for a class with a stable shape.
- `ForeignKeyBuilder` accumulates mutable state and registers on `.references()` — subsequent `.onDelete()`/`.onUpdate()` mutate the already-queued definition. Works but fragile.

---

## How to use this file

A fix agent should:
1. Read each Tier 1 and Tier 2 item.
2. For each, verify the bug still exists in current source (file paths and line numbers may drift).
3. Apply the fix as described.
4. Run the Cascade test suite (`cd warlock.js/cascade && npm test` or `yarn test`) after each tier is complete.
5. Report back: which issues were fixed, which were skipped (and why), which broke tests.

Tier 3 and Tier 4 should NOT be touched by an automated agent.
