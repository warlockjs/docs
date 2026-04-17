# database-id-generator.contract
source: contracts/database-id-generator.contract.ts
description: Contract for auto-increment ID generation in NoSQL databases
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Exports
- `GenerateIdOptions` — Configuration for ID generation [lines 4-11]
- `IdGeneratorContract` — Interface for sequential ID management [lines 44-111]

## Types

### `GenerateIdOptions` [lines 4-11]
- `table: string` — Table/collection name
- `initialId?: number` — Initial ID value for first record (default: 1)
- `incrementIdBy?: number` — Increment amount per new record (default: 1)

## Interfaces

### `IdGeneratorContract` [lines 44-111]

#### `generateNextId(options: GenerateIdOptions): Promise<number>` [lines 68-68]
- Generates next sequential ID for a table
- Atomically increments counter in tracking collection
- Creates counter document if not exists using initialId
- Returns generated ID

#### `getLastId(table: string): Promise<number>` [lines 84-84]
- Returns last generated ID for a table
- Returns 0 if no IDs have been generated yet

#### `setLastId(table: string, id: number): Promise<void>` [lines 110-110]
- Sets last ID for a table
- Useful for migrations, manual ID management, and testing
