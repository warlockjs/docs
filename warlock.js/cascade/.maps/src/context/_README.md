# context

Provides two AsyncLocalStorage-based context singletons that propagate ambient state across async boundaries within a single request or operation. `databaseDataSourceContext` carries the active DataSource so that model operations can resolve their driver without explicit injection, while `databaseTransactionContext` carries the current transaction session so that nested queries automatically participate in the same transaction.

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [database-data-source-context.md](./database-data-source-context.md) — AsyncLocalStorage singleton for propagating the active DataSource across async boundaries
- [database-transaction-context.md](./database-transaction-context.md) — AsyncLocalStorage singleton for propagating the active transaction session across async boundaries
