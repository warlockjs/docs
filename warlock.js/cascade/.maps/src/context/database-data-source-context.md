# database-data-source-context
source: context/database-data-source-context.ts
description: Defines and exports a singleton context that tracks the active database data source per async scope.
complexity: simple
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `Context`, `contextManager` from `@warlock.js/context`
- `DataSource` from `../data-source/data-source`

## Exports
- `databaseDataSourceContext` — singleton instance registered as `db.datasource`  [line 39]

## Classes / Functions / Types / Constants

### `DataSourceContextValue` [line 4]
type: `string | DataSource`

### `DataSourceContextStore` [line 6-8]
type: object with optional `dataSource` field

### `DatabaseDataSourceContext` [lines 16-37]
class — extends `Context<DataSourceContextStore>` for data source tracking
- `public getDataSource()` — returns current data source or undefined  [lines 20-22]
- `public setDataSource(dataSource)` — writes data source into context store  [lines 27-29]
  - side-effects: mutates context store
- `public buildStore()` — returns default store with undefined dataSource  [lines 34-36]
