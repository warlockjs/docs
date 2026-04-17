# sql-grammar
source: migration/sql-grammar.ts
description: Parses, classifies, and sorts SQL statements by execution phase for dependency-safe migration ordering.
complexity: medium
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `SQLStatementType`, `TaggedSQL` from `./types`

## Exports
- `SQLGrammar` — SQL classifier and phase sorter  [lines 7-160]

## Classes / Functions / Types / Constants
- `class SQLGrammar` — Global SQL phase/type classification utility  [lines 7-160]
  - `static phase(sql: string): 1 | 2 | 3 | 4 | 5 | 6` — Determine execution phase for DDL ordering  [lines 27-65]
  - `static classify(sql: string): SQLStatementType` — Classify statement into semantic type  [lines 81-110]
  - `static extractExtensionName(sql: string): string | undefined` — Parse name from CREATE EXTENSION  [lines 125-132]
  - `static sort(statements: TaggedSQL[]): TaggedSQL[]` — Sort by phase, date, migration name  [lines 137-159]
