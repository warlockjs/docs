# transaction-rollback.error
source: errors/transaction-rollback.error.ts
description: Error thrown when a transaction is explicitly rolled back via ctx.rollback().
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `Error` from builtin

## Exports
- `TransactionRollbackError` — Error class for transaction rollback [line 8]

## Classes
### TransactionRollbackError [lines 8-29] — Represents transaction rollback error
extends: Error
fields:
- `reason?: string`  [line 12]
