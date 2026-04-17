# sql-grammar
source: migration/sql-grammar.ts
description: Static utility class for classifying, phasing, and sorting SQL DDL statements
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- `SQLStatementType`, `TaggedSQL` from `./types`

## Exports
- `SQLGrammar` — Static utility class for SQL statement introspection: phase assignment, semantic classification, extension-name extraction, and phase-aware sorting  [lines 7-160]

## Classes / Functions / Types / Constants

### `SQLGrammar` [lines 7-160]
- All methods are `public static`. No instance state; class is used as a namespace for SQL introspection utilities.
- Operates on raw SQL strings by uppercasing and trimming before matching.

#### `phase(sql: string): 1 | 2 | 3 | 4 | 5 | 6` [lines 27-65]
- Returns the execution phase of a SQL statement to ensure DDL runs in dependency-safe order.
- Phase table:
  - `1` — CREATE EXTENSION / TYPE / DOMAIN / SCHEMA (prerequisites and shared objects)
  - `2` — CREATE TABLE (base table creation)
  - `3` — ALTER TABLE … ADD COLUMN / ADD PRIMARY KEY (column and PK additions)
  - `4` — ALTER TABLE … ADD FOREIGN KEY; CREATE [UNIQUE] INDEX (indexes and FK constraints)
  - `5` — ALTER TABLE … DROP COLUMN / DROP CONSTRAINT / ALTER COLUMN; DROP TABLE / TRUNCATE TABLE / DROP INDEX (destructive ops)
  - `6` — Everything else: raw DML, triggers, procedures, views

#### `classify(sql: string): SQLStatementType` [lines 81-110]
- Returns the semantic `SQLStatementType` for a given SQL statement; independent of phase.
- Matching order (to avoid misclassification): CREATE EXTENSION → CREATE SCHEMA → CREATE TYPE → CREATE DOMAIN → CREATE TABLE → DROP TABLE → TRUNCATE TABLE → DROP INDEX → CREATE UNIQUE INDEX → CREATE INDEX; then ALTER TABLE sub-clauses: ADD FOREIGN KEY → DROP FOREIGN KEY → ADD PRIMARY KEY → DROP CONSTRAINT (→ DROP_PRIMARY_KEY) → ADD COLUMN → DROP COLUMN → RENAME COLUMN → RENAME TO (→ RENAME_TABLE) → ALTER COLUMN (→ MODIFY_COLUMN).
- Falls back to `"RAW"` for unrecognized patterns.

#### `extractExtensionName(sql: string): string | undefined` [lines 125-132]
- Parses `CREATE EXTENSION [IF NOT EXISTS] <name>` with a case-insensitive regex and returns the lowercased extension name.
- Returns `undefined` if the statement is not a CREATE EXTENSION or the name cannot be parsed.

#### `sort(statements: TaggedSQL[]): TaggedSQL[]` [lines 137-159]
- Returns a new array (non-mutating `.slice()`) of `TaggedSQL` sorted by: (1) `phase` ascending, (2) `createdAt` date ascending (invalid/missing dates treated as `0`), (3) `migrationName` lexicographic tie-break.
