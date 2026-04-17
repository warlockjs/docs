# Cascade Docs Implementation — Handoff for New Session

**Context:** This conversation got long after an audit → doc-fix → map-regen chain. This file is a self-contained brief for a fresh session to pick up the remaining docs work.

**Status on 2026-04-17:** Maps regenerated (trustworthy). Several doc fixes landed. Migrations docs still broken. Restructure not done.

---

## 0. Repo layout (abs paths)

- **Docs site (Docusaurus 3.4.0):** `/home/mentoor/warlock.js/docs/docs/cascade/`
- **Cascade package source (ground truth):** `/home/mentoor/warlock.js/docs/warlock.js/cascade/src/`
- **Source maps (regenerated, trustworthy):** `/home/mentoor/warlock.js/docs/warlock.js/cascade/.maps/src/`
- **Reports folder (where plans live):** `/home/mentoor/warlock.js/docs/reports/`

Key files in reports/:
- `cascade-docs-fix-plan.md` — original fix plan (some items already done)
- `cascade-maps-regeneration-plan.md` — map regen plan (DONE; describes format/attribution contract)
- `cascade-bugs.md` — source-level bugs flagged during map regen
- `cascade-docs-impl.md` — this file

---

## 1. Current state of docs/cascade/

```
docs/cascade/
├── advanced/          (auto-increment, master-mind, introduction)
├── aggregate/         (16 pages — too granular, candidate for collapse)
├── contracts/
├── drivers/           (mongodb/, postgres/)
├── events/
├── getting-started/   (installation, connecting, data-sources, drivers, transactions, multi-database, roadmap, introduction)
├── indexing/
├── migrations/        ⚠️ BROKEN — see §3
├── models/            ✅ mostly fixed
├── queries/
├── query-builder/
├── relationships/     ✅ fixed
├── scopes/
├── utilities/
└── validation/        ✅ fixed
```

---

## 2. What was fixed already

**Models** (✅ done):
- Replaced `static collection` → `static table` across 12 files (30+ occurrences). The real class property is `static table`. The "collection" name was invented in docs.
- Deleted `docs/cascade/models/casting-data.mdx` and `casting-custom-fields.mdx`. The `protected casts: Casts = {...}` pattern is legacy — modern Cascade uses schema-based validation via `@warlock.js/seal` and `v.embed()`.
- `embedded-documents.mdx`: removed invented props `embedAllExceptTimestampsAndUserColumns`, `embedAllExcept`. Only `static embed?: string[]` and `get embedData()` exist.
- `model-data.mdx`: `user._id` → `user.get("_id")` (MongoDB raw field, not a first-class getter).

**Relationships** (✅ done):
- `defining-relations.mdx`: `BelongsToOptions.localKey` → `ownerKey`. Real type is `ownerKey` (only belongsTo uses this name; hasMany/hasOne legitimately use `localKey`).

**Validation** (✅ done):
- `custom-transformers.mdx`: `ModelTransformCallback` signature fixed. Real signature: `(options: { model, column, value, isChanged, isNew }) => string`. Returns `string` (not `any`). JSON.stringify examples updated to match.

---

## 3. What's still broken — MIGRATIONS DOCS (HIGHEST PRIORITY)

**Problem:** The docs describe a Laravel-style API that doesn't exist in Cascade.

- Docs say: `createTable("users", (table) => {...})`, `addColumn("users", cb)`, `addIndex("users", cols, opts)`, `addForeignKey("users", cb)`.
- Real API: `this.table = "users"` as a class property, then `this.createTable()` (no args), `this.string("name")`, `this.index(cols, name?, opts?)`, `this.foreign("col").references("users", "id")`.

**Affected files (need full rewrite):**
- `docs/cascade/migrations/introduction.mdx`
- `docs/cascade/migrations/writing-migrations.mdx`
- `docs/cascade/migrations/table-operations.mdx`
- `docs/cascade/migrations/foreign-keys.mdx`

**Probably fine but verify:**
- `docs/cascade/migrations/columns.mdx` — describes ColumnBuilder chain methods (those are real)
- `docs/cascade/migrations/column-helpers.mdx` — describes standalone helpers (those are real)
- `docs/cascade/migrations/defaults.mdx`
- `docs/cascade/migrations/indexes.mdx`
- `docs/cascade/migrations/running.mdx`

**Ground truth to rewrite against:**
- `.maps/src/migration/migration.md` — 108 public methods on Migration class, 89 members on MigrationContract
- `.maps/src/migration/column-builder.md` — 25 methods on ColumnBuilder
- `.maps/src/migration/column-helpers.md` — 48 standalone exports
- `.maps/src/migration/foreign-key-builder.md` — ForeignKeyBuilder class
- `.maps/src/migration/migration-runner.md` — MigrationRunner (15 public methods)
- `.maps/src/migration/types.md` — 9 type exports

**Migration class — real public API (key patterns):**

```typescript
export default class CreateUsersTable extends Migration {
  // Class-level properties
  public table = "users";                    // required — names the target table
  public static migrationName = "...";       // optional
  public static createdAt = "...";           // optional ISO timestamp
  public dataSource?: string | DataSource;   // optional
  public transactional?: boolean;            // optional

  async up() {
    this.createTable();                      // no args — uses `this.table`
    this.id();                               // shorthand for `bigInt("id").autoIncrement().primary()`
    this.string("name", 255).notNullable();
    this.string("email").unique();
    this.timestamps();                       // adds created_at, updated_at
    this.index(["status", "created_at"]);
    this.foreign("user_id").references("users", "id").onDelete("cascade");
  }

  async down() {
    this.dropTable();                        // no args
  }
}
```

**Design note on docs rewrite:** Because a migration operates on exactly one table (set via `this.table`), many examples in table-operations.mdx about "addColumn/dropColumn on a different table" are architecturally wrong — you'd need a new migration file with `public table = "other_table"`. The docs should explain this mental model clearly up front.

**When rewriting:**
1. Start with a clear "how a migration works" mental model at top of `introduction.mdx`.
2. Every code sample should include the `public table = "..."` class property.
3. List every Migration method category (columns, indexes, foreign keys, raw, etc.) — reference the categories in migration.md.
4. Remove any references to `createTable(name, callback)`, `addColumn`, `addIndex`, `addForeignKey(name, cb)`, `dropTable(name)`, `renameTable(from, to)` — none of those exist.

---

## 4. Re-audit recommendation

The original doc audit (done in the previous session) ran against the **broken** maps. Now that maps are accurate, a re-audit may surface issues that weren't visible before:

- Models/relationships/validation docs → re-audit light (most fixes already applied).
- Query builder, aggregate, scopes, events, advanced, drivers → never formally audited.
- Every page that references a type/method name is a candidate.

Recommended approach: one Sonnet agent per section, comparing each `.mdx` against the corresponding `.maps/` tree. Report only discrepancies.

---

## 5. Restructure / nav reshape (parked)

From `cascade-docs-fix-plan.md` Part 2 — proposed to collapse 13 sidebar sections into a task-oriented hierarchy with landing pages:

```
cascade/
├── getting-started/          (unchanged)
├── concepts/                 (NEW — data-sources-and-drivers, models-vs-query-builder, multi-database, contracts)
├── models/
│   ├── defining-models/
│   ├── working-with-data/
│   ├── schema-and-casting/   (after rewrite per §2)
│   ├── lifecycle/
│   └── embedding/
├── relationships/            (unchanged)
├── query-builder/            (unchanged)
├── aggregate/                (collapse 16 pages → 5)
├── migrations/               (AFTER rewrite per §3)
├── validation/               (unchanged)
├── advanced/                 (unchanged)
└── utilities/                (unchanged)
```

Do this AFTER migrations rewrite lands, so the reshape doesn't move broken content around.

Add Docusaurus redirect frontmatter on every moved page so external links don't 404.

---

## 6. Map attribution contract (for reference)

Every regenerated map carries:

```
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-<model>
last-updated-by: claude-<model>
```

When you re-run a single map (e.g. after code changes):
- **Preserve** `created-by` and `first-mapped`.
- **Overwrite** `last-updated-by` to the current agent's model id and `last-mapped` to today.

If the doc rewrite agent needs to verify a map is still current against source, it can compare `last-mapped` vs `git log` on the source file. Maps with `last-mapped` older than the latest source change may need regen.

---

## 7. Known map-format drift (minor)

Haiku wave normalized most but drifted on some files:
- H1 inconsistent: `# migration` vs `# sync/index` vs `# Embed Model Transformer` (title-cased in a handful)
- `source:` prefix inconsistent: some say `src/errors/...`, others `errors/...` (spec was no `src/` prefix)

A separate Sonnet agent has been dispatched to normalize this. If format is still off by the time you read this, grep `# \w+ \w+` on the map files to find title-cased H1s.

---

## 8. Recommended first steps for the new session

1. **Read** `.maps/src/migration/migration.md` to understand the real Migration API.
2. **Read** `warlock.js/cascade/usage.md` lines 440-500 — shows a real migration example (`CreateUsersCollection`). Useful canonical pattern.
3. **Spawn** an Opus agent (migration.ts is complex; worth the budget) to rewrite `docs/cascade/migrations/{introduction,writing-migrations,table-operations,foreign-keys}.mdx` against the new map.
4. **Verify** columns.mdx, column-helpers.mdx, defaults.mdx, indexes.mdx, running.mdx still accurate (likely yes; they describe ColumnBuilder/helpers which are correct).
5. **Re-audit** remaining sections (§4).
6. **Restructure** nav (§5) — last step.

---

## 9. Source-level bugs flagged (reference only)

See `reports/cascade-bugs.md`. Those are in Cascade's own TS source, separate track from docs. Some doc prose may become out-of-date once those bugs are fixed — worth a cross-check at the end.
