# database-transaction-context
source: context/database-transaction-context.ts
description: Defines and exports a singleton context that manages database transaction sessions per async scope.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `Context`, `contextManager` from `@warlock.js/context`

## Exports
- `databaseTransactionContext` — singleton instance registered as `db.transaction`  [line 50]

## Classes / Functions / Types / Constants

### `TransactionContextStore` [lines 3-5]
interface: object with optional `session` of type `unknown`

### `DatabaseTransactionContext` [lines 13-48]
class — extends `Context<TransactionContextStore>` for transaction session tracking
- `public getSession<TSession>()` — returns current session cast to TSession  [lines 17-19]
- `public hasActiveTransaction()` — returns true if session is defined  [lines 24-26]
- `public setSession(session)` — writes session into context store  [lines 31-33]
  - side-effects: mutates context store
- `public exit()` — clears entire context store  [lines 38-40]
  - side-effects: clears context store
- `public buildStore()` — returns default store with undefined session  [lines 45-47]
