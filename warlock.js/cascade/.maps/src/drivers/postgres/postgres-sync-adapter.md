# postgres-sync-adapter
source: drivers/postgres/postgres-sync-adapter.ts
description: Implements SyncAdapterContract for batch JSONB denormalized-data updates in PostgreSQL.
complexity: medium
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `SyncAdapterContract`, `SyncInstruction` from `../../contracts/sync-adapter.contract`
- `PostgresDriver` from `./postgres-driver`

## Exports
- `PostgresSyncAdapter` — Batch JSONB sync adapter for PostgreSQL  [lines 35-237]

## Classes / Functions / Types / Constants

### class `PostgresSyncAdapter` implements `SyncAdapterContract`  [lines 35-237]
Handles batch JSONB field updates using jsonb_set and CTE array element updates.

- `constructor(driver: PostgresDriver)`  [lines 41-41]
- `executeBatch(instructions: SyncInstruction[]): Promise<number>` — Runs all instructions, returns total affected rows  [lines 49-61]
  - side-effects: executes UPDATE queries against the database
- `executeOne(instruction: SyncInstruction): Promise<number>` — Runs single JSONB UPDATE, returns affected rows  [lines 69-72]
  - side-effects: executes UPDATE query
- `executeArrayUpdate(instruction: SyncInstruction): Promise<number>` — Updates matched elements inside a JSONB array column  [lines 80-96]
  - side-effects: executes UPDATE query via CTE
