# foreign-key-builder
source: migration/foreign-key-builder.ts
description: Fluent builder for constructing and registering foreign key constraint definitions on a migration.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `ForeignKeyDefinition` from `../contracts/migration-driver.contract`

## Exports
- `ForeignKeyBuilder` — fluent FK constraint builder class  [lines 40-150]

## Classes / Functions / Types / Constants

### `ForeignKeyBuilder` [lines 40-150]
- Accumulates FK definition and registers it on the parent migration.
- side-effects: calls `migration.addForeignKeyOperation()` when `.references()` is invoked

#### `constructor(migration, column)` [lines 50-61]
- Initializes mutable definition with restrict defaults.

#### `name(name)` [lines 69-72]
- Sets optional constraint name; returns `this`.

#### `references(table, column?)` [lines 91-96]
- Sets referenced table/column and pushes FK to migration; returns `this`.
- side-effects: calls `migration.addForeignKeyOperation`

#### `onDelete(action)` [lines 111-114]
- Sets ON DELETE action on mutable definition; returns `this`.

#### `onUpdate(action)` [lines 129-132]
- Sets ON UPDATE action on mutable definition; returns `this`.

#### `cascadeAll()` [lines 144-148]
- Shorthand to set both onDelete and onUpdate to "cascade"; returns `this`.
