# sql-serializer

source: migration/sql-serializer.ts
description: Abstract base class for converting pending operations to SQL strings
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `PendingOperation` from `./migration` (type)

## Exports
- `SQLSerializer` — Abstract class for SQL serialization [lines 6-37]

## Classes / Functions / Types / Constants

### `SQLSerializer` [lines 6-37]
- Abstract base class for converting PendingOperation objects to SQL strings for specific database dialects

#### `serialize(operation: PendingOperation, table: string): string | string[] | null` [lines 14]
- Serialize a single pending operation into one or more SQL strings; returns single string for single-statement operations, string[] for multi-statement operations, null for no-ops

#### `serializeAll(operations: PendingOperation[], table: string): string[]` [lines 22-36]
- Serialize an array of operations to a flat list of SQL strings, automatically flattening arrays and filtering out nulls
