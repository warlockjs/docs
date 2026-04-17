# database-id-generator.contract
source: contracts/database-id-generator.contract.ts
description: Defines IdGeneratorContract for sequential auto-increment ID generation in NoSQL databases.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
_(none)_

## Exports
- `GenerateIdOptions` — options for next-ID generation  [lines 4-11]
- `IdGeneratorContract` — interface for atomic sequential ID generation  [lines 44-111]

## Types / Interfaces

### `GenerateIdOptions` [lines 4-11]
- `table: string` — target collection name
- `initialId?: number` — starting value for first record = 1
- `incrementIdBy?: number` — step between IDs = 1

### `IdGeneratorContract` [lines 44-111]
Contract for atomic sequential ID generation in NoSQL stores.
- `generateNextId(options: GenerateIdOptions): Promise<number>` [lines 68-68]
  — throws: on concurrent write failure; side-effects: increments counter document
- `getLastId(table: string): Promise<number>` [line 84]
  — returns 0 if no IDs generated yet
- `setLastId(table: string, id: number): Promise<void>` [line 110]
  — side-effects: overwrites counter document
