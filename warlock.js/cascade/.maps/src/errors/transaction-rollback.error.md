# transaction-rollback.error

source: errors/transaction-rollback.error.ts
description: Error signaling explicit transaction rollback without application error semantics
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
None

## Exports
- `TransactionRollbackError` — Custom error class for transaction rollbacks [lines 8-29]

## Classes / Functions / Types / Constants

### `TransactionRollbackError` [lines 8-29]
- Error thrown when a transaction is explicitly rolled back via ctx.rollback()

#### `reason?: string` [line 12]
- Optional reason for the rollback (for logging/debugging)

#### `constructor(reason?: string)` [lines 19-28]
- Creates a new TransactionRollbackError with optional rollback reason; sets error name and captures stack trace
