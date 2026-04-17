# column-builder
source: migration/column-builder.ts
description: Fluent builder class for accumulating column definitions in migrations.
complexity: medium
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `ColumnDefinition, ColumnType, ForeignKeyDefinition, VectorIndexOptions` from `../contracts/migration-driver.contract`

## Exports
- `ColumnBuilder` — fluent column definition builder class  [lines 55-671]

## Classes
### ColumnBuilder  [lines 55-671] — fluent builder for column properties
extends: none

fields:
- `private readonly definition: ColumnDefinition`  [line 57] — accumulated column definition
- `private fkDefinition?: MutableForeignKeyDefinition`  [line 60] — mutable FK being built
- `private generatedExpression?: string`  [line 63] — pending generated column expression

methods:
- `constructor(migration: MigrationLike, name: string, type: ColumnType, options?: Partial<...>)`  [lines 73-87] — initializes column definition
- `nullable(): this`  [lines 103-106] — marks column as nullable
- `notNullable(): this`  [lines 115-118] — marks column as not nullable
- `default(value: string | number | boolean): this`  [lines 141-145] — sets raw SQL default value
- `defaultString(value: string): this`  [lines 162-166] — sets escaped literal default
- `useCurrent(): this`  [lines 180-183] — defaults to current timestamp
- `useCurrentOnUpdate(): this`  [lines 197-200] — updates to current on row update
- `unique(): this`  [lines 218-224] — adds unique index
  - side-effects: registers pending index on migration
- `index(): this`  [lines 238-243] — adds regular index
  - side-effects: registers pending index on migration
- `vectorIndex(options?: Omit<VectorIndexOptions, "dimensions">): this`  [lines 258-266] — adds vector search index
  - side-effects: registers pending vector index on migration
- `primary(): this`  [lines 282-285] — marks as primary key
- `autoIncrement(): this`  [lines 300-303] — marks as auto-increment
- `unsigned(): this`  [lines 321-324] — marks numeric as unsigned
- `comment(text: string): this`  [lines 343-346] — adds column comment
- `check(expression: string, name?: string): this`  [lines 359-365] — adds CHECK constraint
- `after(columnName: string): this`  [lines 384-387] — positions after column (MySQL)
- `first(): this`  [lines 401-404] — positions as first column (MySQL)
- `references(tableOrModel: string | { table: string }): this`  [lines 436-448] — declares foreign key constraint
  - side-effects: pushes addForeignKey operation on migration
- `on(column: string): this`  [lines 463-468] — sets referenced column
- `onDelete(action: ForeignKeyDefinition["onDelete"]): this`  [lines 483-488] — sets ON DELETE action
- `onUpdate(action: ForeignKeyDefinition["onUpdate"]): this`  [lines 503-508] — sets ON UPDATE action
- `cascadeAll(): this`  [lines 522-528] — shorthand cascade on delete/update
- `change(): unknown`  [lines 554-583] — converts to modifyColumn operation
  - side-effects: mutates migration pendingOperations queue
- `modify(): unknown`  [lines 588-590] — alias for change
  - side-effects: mutates migration pendingOperations queue
- `generatedAs(expression: string): this`  [lines 618-621] — marks as generated with expression
- `stored(): this`  [lines 630-638] — marks generated column as stored
- `virtual(): this`  [lines 647-655] — marks generated column as virtual
- `getDefinition(): ColumnDefinition`  [lines 668-670] — returns built column definition
