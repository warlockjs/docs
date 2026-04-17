# column-builder
source: migration/column-builder.ts
description: Fluent builder for defining column properties, foreign keys, indexes, generated columns, and modifications within migrations.
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-opus-4-7
last-updated-by: claude-opus-4-7

## Imports
- `ColumnDefinition`, `ColumnType`, `ForeignKeyDefinition`, `VectorIndexOptions` (type) from `../contracts/migration-driver.contract`

## Exports
- `ColumnBuilder` — Fluent builder class for accumulating a `ColumnDefinition` via method chaining.  [lines 55-671]

## Classes / Functions / Types / Constants

### `MigrationLike` (internal type) [lines 12-19]
- Local structural type representing the subset of `Migration` that `ColumnBuilder` depends on, used to avoid circular imports.
- Shape: `{ addPendingIndex(index: { columns: string[]; unique?: boolean }): void; addForeignKeyOperation(fk: ForeignKeyDefinition): void; addPendingVectorIndex?(column: string, options: Omit<VectorIndexOptions, "column">): void; }`.

### `MutableForeignKeyDefinition` (internal interface) [lines 24-31]
- Mutable variant of `ForeignKeyDefinition` assembled during `.references()` → `.on()` / `.onDelete()` / `.onUpdate()` / `.cascadeAll()` chains.
- Fields: `name?: string`, `column: string`, `referencesTable: string`, `referencesColumn: string`, `onDelete: ForeignKeyDefinition["onDelete"]`, `onUpdate: ForeignKeyDefinition["onUpdate"]`.

### `ColumnBuilder` [lines 55-671]
- Fluent builder bound to a parent migration. Accumulates a `ColumnDefinition`; each modifier returns `this` for chaining except `change()` / `modify()` which return the parent migration to break the chain.
- Private state: `definition: ColumnDefinition`, `fkDefinition?: MutableForeignKeyDefinition`, `generatedExpression?: string`.

#### `constructor(migration: MigrationLike, name: string, type: ColumnType, options: Partial<Pick<ColumnDefinition, "length" | "precision" | "scale" | "dimensions" | "values">> = {})` [lines 73-87]
- Creates a builder bound to a migration; seeds `definition` with `{ name, type, nullable: false, ...options }`.

#### `nullable(): this` [lines 103-106]
- Sets `definition.nullable = true`.

#### `notNullable(): this` [lines 115-118]
- Sets `definition.nullable = false` (the default — primarily for clarity).

#### `default(value: string | number | boolean): this` [lines 141-145]
- Sets `defaultValue` and `isRawDefault = true` so the value is emitted as a raw SQL expression (no escaping).

#### `defaultString(value: string): this` [lines 162-166]
- Sets `defaultValue` with `isRawDefault = false` so the string is properly escaped/quoted.

#### `useCurrent(): this` [lines 180-183]
- Sets `defaultValue = { __type: "CURRENT_TIMESTAMP" }` — a driver-agnostic sentinel rendered per dialect (NOW / CURRENT_TIMESTAMP / GETDATE).

#### `useCurrentOnUpdate(): this` [lines 197-200]
- Sets `onUpdateCurrent = true` (MySQL-only; other drivers ignore).

#### `unique(): this` [lines 218-224]
- Registers a pending unique index `{ columns: [name], unique: true }` on the parent migration.

#### `index(): this` [lines 238-243]
- Registers a pending (non-unique) index `{ columns: [name] }` on the parent migration.

#### `vectorIndex(options: Omit<VectorIndexOptions, "dimensions"> = {}): this` [lines 258-266]
- If the migration supports `addPendingVectorIndex`, registers a vector index on this column using `definition.dimensions` (or 0). No-op otherwise.

#### `primary(): this` [lines 282-285]
- Sets `definition.primary = true`.

#### `autoIncrement(): this` [lines 300-303]
- Sets `definition.autoIncrement = true` (SQL AUTO_INCREMENT/SERIAL; NoSQL ignores).

#### `unsigned(): this` [lines 321-324]
- Sets `definition.unsigned = true` (numeric types).

#### `comment(text: string): this` [lines 343-346]
- Sets `definition.comment = text`.

#### `check(expression: string, name?: string): this` [lines 359-365]
- Sets `definition.checkConstraint = { expression, name: name ?? "check_<column>" }`.

#### `after(columnName: string): this` [lines 384-387]
- Sets `definition.after = columnName` (MySQL/MariaDB only; ignored elsewhere).

#### `first(): this` [lines 401-404]
- Sets `definition.first = true` (MySQL/MariaDB only).

#### `references(tableOrModel: string | { table: string }): this` [lines 436-448]
- Resolves table name from a string or Model-class with a static `table` property.
- Initializes `fkDefinition` with defaults (`referencesColumn: "id"`, `onDelete: "restrict"`, `onUpdate: "restrict"`) and immediately queues an `addForeignKeyOperation` with the mutable reference — subsequent `.on/.onDelete/.onUpdate/.cascadeAll` mutate the already-queued op.

#### `on(column: string): this` [lines 463-468]
- If `fkDefinition` is set, overrides `referencesColumn`.

#### `onDelete(action: ForeignKeyDefinition["onDelete"]): this` [lines 483-488]
- If `fkDefinition` is set, assigns the ON DELETE action.

#### `onUpdate(action: ForeignKeyDefinition["onUpdate"]): this` [lines 503-508]
- If `fkDefinition` is set, assigns the ON UPDATE action.

#### `cascadeAll(): this` [lines 522-528]
- Shorthand that sets both `onDelete` and `onUpdate` to `"cascade"` on the pending FK.

#### `change(): unknown` [lines 554-583]
- Breaks the builder chain and converts the pending `addColumn` op into a `modifyColumn` op. Logic:
  1. Reaches into `(migration as any).pendingOperations` and pops the trailing `addColumn` whose payload is this builder's `definition`.
  2. If `.references()` was called first, pops the trailing `addForeignKey` op so it can be re-queued after the modify.
  3. Pushes `{ type: "modifyColumn", payload: definition }`.
  4. Re-pushes the FK op if one was captured — ensuring SQL order: ALTER COLUMN → ADD CONSTRAINT.
- Returns the parent migration (typed as `unknown` due to the `MigrationLike` boundary).

#### `modify(): unknown` [lines 588-590]
- Alias for `change()`.

#### `generatedAs(expression: string): this` [lines 618-621]
- Stashes the SQL expression in `generatedExpression`; must be followed by `.stored()` or `.virtual()` to commit.

#### `stored(): this` [lines 630-638]
- If `generatedExpression` is set, commits `definition.generated = { expression, stored: true }` (computed and persisted).

#### `virtual(): this` [lines 647-655]
- If `generatedExpression` is set, commits `definition.generated = { expression, stored: false }` (not supported by PostgreSQL).

#### `getDefinition(): ColumnDefinition` [lines 668-670]
- Returns the accumulated `ColumnDefinition`. Called by the `Migration` class to extract the finalized definition.
