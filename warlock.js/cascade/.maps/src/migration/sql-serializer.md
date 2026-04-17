# sql-serializer
source: migration/sql-serializer.ts
description: Abstract base for dialect-specific serializers that convert pending migration operations into SQL strings.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `PendingOperation` from `./migration`

## Exports
- `SQLSerializer` — Abstract dialect-specific SQL serializer  [lines 6-37]

## Classes / Functions / Types / Constants
- `abstract class SQLSerializer` — Base class converting operations to SQL  [lines 6-37]
  - `abstract serialize(operation: PendingOperation, table: string): string | string[] | null` — Serialize one operation to SQL  [line 14]
  - `serializeAll(operations: PendingOperation[], table: string): string[]` — Serialize array, flatten, drop nulls  [lines 22-36]
