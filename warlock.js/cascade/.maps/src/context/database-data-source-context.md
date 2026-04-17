# database-data-source-context

source: context/database-data-source-context.ts
description: Manages active database connection/data source using AsyncLocalStorage context
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `Context, contextManager` from `@warlock.js/context`
- `DataSource` from `../data-source/data-source` (type)

## Exports
- `databaseDataSourceContext` — Singleton context instance for data source management [line 39]

## Classes / Functions / Types / Constants

### `DataSourceContextValue` [line 4]
- Type union of string or DataSource instance

### `DataSourceContextStore` [lines 6-8]
- Object type containing optional dataSource property

### `DatabaseDataSourceContext` [lines 16-37]
- Extends Context class to manage active database connection/data source using AsyncLocalStorage

#### `getDataSource(): DataSourceContextValue | undefined` [lines 20-22]
- Retrieves the current data source from context

#### `setDataSource(dataSource: DataSourceContextValue): void` [lines 27-29]
- Sets the data source in context

#### `buildStore(): DataSourceContextStore` [lines 34-36]
- Builds the initial data source store with undefined defaults

### `databaseDataSourceContext` [line 39]
- Singleton instance of DatabaseDataSourceContext registered with contextManager as "db.datasource"
