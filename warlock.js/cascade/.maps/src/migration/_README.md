# Migration
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> Provides the full DDL/migration subsystem: abstract base class, fluent column/FK builders, SQL serialization, phase-ordered execution, and a runner that tracks batch state in the database.

## What lives here
- `migration.ts` — Abstract `Migration` base class and `MigrationContract`/`OperationType`/`PendingOperation` types; the central DDL API
- `column-builder.ts` — Fluent `ColumnBuilder` that accumulates a `ColumnDefinition` and registers indexes/FK ops on the parent migration
- `column-helpers.ts` — `DetachedColumnBuilder` subclass and standalone per-type column helpers (e.g. `string`, `integer`, `uuid`, `vector`) usable outside a migration context
- `foreign-key-builder.ts` — Fluent `ForeignKeyBuilder` that builds and registers a `ForeignKeyDefinition` on the parent migration
- `migration-runner.ts` — `MigrationRunner` class and `migrationRunner` singleton; registers, runs, rolls back, and tracks migrations in the DB
- `sql-grammar.ts` — `SQLGrammar` static utility that classifies, phases, and sorts SQL statements for dependency-safe ordering
- `sql-serializer.ts` — Abstract `SQLSerializer` base class that dialect adapters extend to convert `PendingOperation` queues to SQL strings
- `types.ts` — Shared interfaces: `MigrationResult`, `MigrationStatus`, `PendingMigration`, `MigrationRecord`, `MigrationRunnerOptions`, `RunMigrationsOptions`, `RollbackOptions`, `SQLStatementType`, `TaggedSQL`
- `index.ts` — Re-exports all public symbols from the migration subsystem

## Public API
- `Migration` — Abstract base; subclass and implement `up()`/`down()`
- `MigrationContract` — Full interface type for a migration class
- `MigrationConstructor` — Constructor interface with static `migrationName`/`createdAt`/`order`
- `OperationType` — Union of all supported DDL/DML operation strings
- `PendingOperation` — Queued operation tuple (type + payload)
- `ColumnBuilder` — Fluent column definition builder; chain modifiers, call `getDefinition()`
- `DetachedColumnBuilder` — `ColumnBuilder` with self-contained sink; no parent migration required
- `ForeignKeyBuilder` — Fluent FK builder; call `.references(table, col)` to register
- `MigrationRunner` — Registers and executes migration batches against a DB
- `migrationRunner` — Default singleton `MigrationRunner` instance
- `SQLGrammar.phase(sql): 1|2|3|4|5|6` — Returns execution phase for a SQL statement
- `SQLGrammar.classify(sql): SQLStatementType` — Classifies statement into semantic type
- `SQLGrammar.sort(statements: TaggedSQL[]): TaggedSQL[]` — Sorts by phase/date/name
- `SQLSerializer.serialize(op, table): string|string[]|null` — Abstract; dialect converts one op to SQL
- `SQLSerializer.serializeAll(ops, table): string[]` — Flattens all ops, drops nulls
- `string(length?): DetachedColumnBuilder` — Standalone VARCHAR column helper
- `integer(name?): DetachedColumnBuilder` — Standalone INTEGER column helper
- `uuid(name?): DetachedColumnBuilder` — Standalone UUID column helper
- `vector(dimensions): DetachedColumnBuilder` — Standalone vector column for AI embeddings
- `enumCol(values): DetachedColumnBuilder` — Standalone ENUM column helper
- `MigrationResult` — Readonly result of a single migration execution
- `MigrationStatus` — File-level status with executed flag and batch info
- `MigrationRecord` — Row stored in the `_migrations` tracking table
- `MigrationRunnerOptions` — Config: glob pattern, directory, table name, dryRun, verbose
- `RunMigrationsOptions` — Forward-run options: optional `only` names, `dryRun`
- `RollbackOptions` — Rollback options: batches count, optional `only` names, `dryRun`
- `TaggedSQL` — SQL annotated with phase, statementType, createdAt, migrationName

## How it fits together
`Migration` accumulates `PendingOperation` entries as its fluent DDL methods are called; `ColumnBuilder` and `ForeignKeyBuilder` are the builders that produce those entries. A dialect-specific `SQLSerializer` subclass converts the pending queue into SQL strings via `serializeAll`, and `SQLGrammar` then classifies and phase-sorts those strings for safe execution ordering. `MigrationRunner` (or its singleton `migrationRunner`) wires it all together: it registers `Migration` subclasses, resolves a `MigrationDriverContract`, calls `up()`/`down()`, writes tracking records to the database, and can export phase-ordered `.sql` files to disk.

## Working examples
```typescript
import {
  Migration,
  migrationRunner,
  MigrationRunnerOptions,
  string,
  integer,
  uuid,
  timestamp,
  ForeignKeyBuilder,
} from "@warlock.js/cascade";

// Define a migration
class CreateUsersTable extends Migration {
  static migrationName = "CreateUsersTable";
  static createdAt = "2026-04-17";

  up() {
    this.createTable("users", table => {
      table.id();
      table.string("name", 255).notNullable();
      table.string("email", 255).unique().notNullable();
      table.timestamp("created_at").useCurrent();
    });
  }

  down() {
    this.dropTable("users");
  }
}

// Define a migration using standalone helpers (e.g. for schema definitions)
const nameCol = string(255).notNullable().getDefinition();
const idCol = uuid().primary().getDefinition();

// Register and run migrations
migrationRunner.register(CreateUsersTable);
await migrationRunner.runAll({ verbose: true } as MigrationRunnerOptions);

// Roll back the last batch
await migrationRunner.rollbackLast();

// Check migration status
const statuses = await migrationRunner.status();
```

## DO NOT
- Do NOT call `execute()` on a `Migration` instance directly — it is deprecated; use `MigrationRunner.run()` or `migrationRunner.runAll()` instead
- Do NOT subclass `SQLSerializer` without implementing `serialize(operation, table)` — it is abstract and calling `serializeAll` on an incomplete subclass will throw
- Do NOT invoke `ColumnBuilder` methods that register indexes or FK operations (`.unique()`, `.index()`, `.references()`) on a `DetachedColumnBuilder` and then discard the sink — pending indexes and FK operations accumulate on the detached sink and will never be applied to a real migration
- Do NOT register a `Migration` subclass with `migrationRunner.register()` without setting a static `migrationName` property — the runner throws an `Error` at registration time if the property is missing
- Do NOT rely on operation order within `toSQL()` output without going through `SQLGrammar.sort()` — raw serialization does not guarantee dependency-safe DDL ordering across phases
