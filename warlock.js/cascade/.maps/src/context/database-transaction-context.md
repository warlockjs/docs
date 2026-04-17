# database-transaction-context

source: context/database-transaction-context.ts
description: Manages database transaction sessions using AsyncLocalStorage context
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `Context, contextManager` from `@warlock.js/context`

## Exports
- `databaseTransactionContext` — Singleton context instance for transaction management [line 50]

## Classes / Functions / Types / Constants

### `TransactionContextStore` [lines 3-5]
- Interface containing optional session property for transaction storage

### `DatabaseTransactionContext` [lines 13-48]
- Extends Context class to manage database transaction sessions using AsyncLocalStorage

#### `getSession<TSession = unknown>(): TSession | undefined` [lines 17-19]
- Retrieves the current transaction session from context with optional type parameter

#### `hasActiveTransaction(): boolean` [lines 24-26]
- Checks if there's an active transaction in the current context

#### `setSession(session: unknown): void` [lines 31-33]
- Sets the transaction session in context

#### `exit(): void` [lines 38-40]
- Exits the transaction context by clearing stored session

#### `buildStore(): TransactionContextStore` [lines 45-47]
- Builds the initial transaction store with undefined session default

### `databaseTransactionContext` [line 50]
- Singleton instance of DatabaseTransactionContext registered with contextManager as "db.transaction"
