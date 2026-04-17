# Context
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> Async-scoped context singletons that track the active database data source and transaction session per request/async chain using `@warlock.js/context`.

## What lives here
- `database-data-source-context.ts` — singleton context for the active database data source per async scope, registered as `db.datasource`
- `database-transaction-context.ts` — singleton context for the active database transaction session per async scope, registered as `db.transaction`

## Public API
- `databaseDataSourceContext.getDataSource(): DataSourceContextValue | undefined` — reads active data source from current scope
- `databaseDataSourceContext.setDataSource(dataSource: DataSourceContextValue): void` — writes data source into context store
- `databaseTransactionContext.getSession<TSession>(): TSession | undefined` — returns current transaction session cast to TSession
- `databaseTransactionContext.hasActiveTransaction(): boolean` — true if a session is currently set
- `databaseTransactionContext.setSession(session: unknown): void` — writes session into context store
- `databaseTransactionContext.exit(): void` — clears the entire transaction context store

## How it fits together
Both singletons extend `Context` from `@warlock.js/context` and are auto-registered with `contextManager` under `db.datasource` and `db.transaction` respectively. They are imported and used by higher-level cascade layers (repositories, query builders, transaction managers) to read or write the per-async-scope state without passing it explicitly through call chains. The data source context depends on the `DataSource` type from `../data-source/data-source`, while the transaction context is self-contained.

## Working examples
```typescript
// Set and read the active data source for the current async scope
import { databaseDataSourceContext } from "./database-data-source-context";

databaseDataSourceContext.setDataSource(myDataSource);
const ds = databaseDataSourceContext.getDataSource(); // DataSource | string | undefined
```

```typescript
// Manage a transaction session within the current async scope
import { databaseTransactionContext } from "./database-transaction-context";

databaseTransactionContext.setSession(queryRunnerSession);

if (databaseTransactionContext.hasActiveTransaction()) {
  const session = databaseTransactionContext.getSession<QueryRunner>();
  // use session...
}

databaseTransactionContext.exit(); // clears session when transaction ends
```

## DO NOT
- Do NOT instantiate `DatabaseDataSourceContext` or `DatabaseTransactionContext` directly — use the exported singletons `databaseDataSourceContext` and `databaseTransactionContext` instead, as re-instantiation bypasses the `contextManager` registration.
- Do NOT call `databaseTransactionContext.setSession()` with a value and forget to call `exit()` — the session will leak across subsequent async work in the same scope.
- Do NOT read `databaseDataSourceContext.getDataSource()` outside of an active async context run — the result will be `undefined` and silently skip the intended data source.
- Do NOT pass raw string identifiers to `setDataSource` unless the consumer is prepared to resolve them; prefer passing a resolved `DataSource` instance to avoid ambiguous state.
