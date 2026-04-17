# types
source: types.ts
description: Shared TypeScript type aliases for model behavior, deletion strategies, naming conventions, and migration defaults used across the cascade system.
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports

_(none — pure type declarations, no runtime imports)_

## Exports

- `StrictMode` — Union type controlling how unknown fields are handled during validation.  [line 19]
- `DeleteStrategy` — Union type controlling how model documents are deleted from the database.  [line 45]
- `NamingConvention` — Union type for database column naming convention (camelCase vs snake_case).  [line 67]
- `ModelDefaults` — Object type defining the full set of runtime model-level configuration defaults.  [lines 108-323]
- `UuidStrategy` — Union type for UUID generation strategy used in migrations.  [line 344]
- `MigrationDefaults` — Object type defining DDL-level defaults per data source for migrations.  [lines 370-413]

## Classes / Functions / Types / Constants

### `StrictMode` [line 19]
- String literal union: `"strip" | "fail" | "allow"`.
- `"strip"` silently removes unknown fields (default, recommended for APIs).
- `"fail"` throws a validation error when unknown fields are encountered.
- `"allow"` lets unknown fields pass through without modification.

### `DeleteStrategy` [line 45]
- String literal union: `"trash" | "permanent" | "soft"`.
- `"trash"` moves the document to a trash/recycle-bin collection before final deletion.
- `"permanent"` performs an immediate hard delete from the database.
- `"soft"` sets a `deletedAt` timestamp instead of removing the record.
- Priority order when resolving the active strategy: `destroy()` options > model static property > data-source default.

### `NamingConvention` [line 67]
- String literal union: `"camelCase" | "snake_case"`.
- Drives the default names of system columns (timestamps, soft-delete column).
- MongoDB driver defaults to `"camelCase"`; PostgreSQL driver defaults to `"snake_case"`.

### `ModelDefaults` [lines 108-323]
- Object type expressing the four-tier configuration hierarchy for model runtime behavior (model static > database config `modelDefaults` > driver defaults > framework fallback).
- All fields are optional; unset fields fall through to the next tier.

#### ID Generation fields (NoSQL only)

- `autoGenerateId?: boolean` — Auto-generate incremental integer `id` on insert. Default `true` (MongoDB), `false` (PostgreSQL).  [line 123]
- `initialId?: number` — Starting value for the first generated ID. Default `1`.  [line 135]
- `randomInitialId?: boolean | (() => number)` — Randomise the initial ID. `true` uses range 10000–499999; a function provides custom logic. Default `false`.  [line 153]
- `incrementIdBy?: number` — Step size between successive IDs. Default `1`.  [line 165]
- `randomIncrement?: boolean | (() => number)` — Randomise the increment. `true` picks 1–10; a function provides custom logic. Default `false`.  [line 183]

#### Timestamp fields

- `timestamps?: boolean` — Enable automatic `createdAt`/`updatedAt` management. Default `true`.  [line 197]
- `createdAtColumn?: string | false` — Column name for creation timestamp; `false` disables it entirely. Default `"createdAt"` (MongoDB) / `"created_at"` (PostgreSQL).  [line 212]
- `updatedAtColumn?: string | false` — Column name for update timestamp; `false` disables it entirely. Default `"updatedAt"` (MongoDB) / `"updated_at"` (PostgreSQL).  [line 227]

#### Deletion fields

- `deleteStrategy?: DeleteStrategy` — Strategy used when `destroy()` is called. Default `"permanent"`.  [line 248]
- `deletedAtColumn?: string | false` — Column name for the soft-delete timestamp. Default `"deletedAt"` (MongoDB) / `"deleted_at"` (PostgreSQL).  [line 263]
- `trashTable?: string | ((tableName: string) => string)` — Override for the trash collection name; a function receives the model's table name. Default pattern is `{table}Trash`.  [line 283]

#### Validation fields

- `strictMode?: StrictMode` — Unknown-field handling behavior. Default `"strip"`.  [line 303]

#### Convention fields

- `namingConvention?: NamingConvention` — Naming convention for system columns. Default `"camelCase"` (MongoDB) / `"snake_case"` (PostgreSQL).  [line 322]

### `UuidStrategy` [line 344]
- String literal union: `"v4" | "v7"`.
- `"v4"` maps to `gen_random_uuid()` (PG 13+) or `UUID()` (MySQL).
- `"v7"` maps to `uuid_generate_v7()` (PG 18+).

### `MigrationDefaults` [lines 370-413]
- Object type for DDL-level per-data-source defaults.
- Follows a three-tier hierarchy: inline migration call > `DataSource.migrationDefaults` > driver migration defaults.
- All fields are optional.

#### Fields

- `uuidStrategy?: UuidStrategy` — UUID generation strategy for `primaryUuid()`. Default `"v4"`.  [line 377]
- `uuidExpression?: string` — Raw SQL/expression override for UUID generation; takes precedence over `uuidStrategy` when set. E.g. `"uuid_generate_v1mc()"`.  [line 388]
- `primaryKey?: "uuid" | "int" | "bigInt"` — Default primary key type added by `Migration.create()`. Default `"int"`.  [line 412]
