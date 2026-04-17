# Errors
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> Custom error classes for data source resolution and transaction lifecycle management.

## What lives here
- `missing-data-source.error.ts` — Error thrown when requested data source not found
- `transaction-rollback.error.ts` — Error thrown when transaction explicitly rolled back

## Public API
- `MissingDataSourceError` — Extends Error, includes optional dataSourceName field
- `TransactionRollbackError` — Extends Error, includes optional reason field

## How it fits together
These error classes provide typed exceptions for cascade's core operations. MissingDataSourceError signals registry lookup failures, while TransactionRollbackError manages explicit transaction unwinding. Both maintain proper stack traces via Error.captureStackTrace for V8 environments. They're caught and handled by transaction wrappers and data source resolution logic.

## Working examples
```typescript
// Throwing MissingDataSourceError
try {
  throw new MissingDataSourceError("Data source 'users' not found", "users");
} catch (error) {
  if (error instanceof MissingDataSourceError) {
    console.log(error.dataSourceName); // "users"
  }
}

// Throwing TransactionRollbackError
try {
  throw new TransactionRollbackError("User cancelled operation");
} catch (error) {
  if (error instanceof TransactionRollbackError) {
    console.log(error.reason); // "User cancelled operation"
  }
}
```

## DO NOT
- Do NOT throw base Error class — use typed error classes instead for better error handling
- Do NOT assume data source exists without catching MissingDataSourceError
- Do NOT suppress TransactionRollbackError — let transaction wrapper handle cleanup
