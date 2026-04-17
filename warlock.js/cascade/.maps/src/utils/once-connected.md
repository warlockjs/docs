# once-connected
source: utils/once-connected.ts
description: Utility functions that execute a callback once a data source is connected or disconnected, with immediate execution if the condition is already met.
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-sonnet-4-6
last-updated-by: claude-sonnet-4-6

## Imports
- `DataSource` from `../data-source/data-source`
- `dataSourceRegistry` from `../data-source/data-source-registry`

## Exports
- `onceConnected` — Executes a callback once the target data source fires a `"connected"` event, or immediately if already connected  [lines 75-135]
- `onceDisconnected` — Executes a callback once the target data source fires a `"disconnected"` event, or immediately if already disconnected  [lines 208-268]

## Classes / Functions / Types / Constants

### `onceConnected(dataSourceOrNameOrCallback: DataSource | string | ((dataSource: DataSource) => void), callback?: (dataSource: DataSource) => void): void` [lines 75-135]
- Overloaded-style signature: accepts either `(callback)` or `(dataSourceOrName, callback)`.
- When first argument is a function it is used as the callback and the default data source (`"default"`) is targeted.
- When first argument is a `DataSource` instance or string name, `callback` must be provided or an `Error` is thrown.
- Resolves the target `DataSource` via `dataSourceRegistry.get()`; silently ignores errors (data source not yet registered).
- If the resolved data source already has `driver.isConnected === true`, calls the callback immediately and returns.
- Otherwise registers a persistent listener on `dataSourceRegistry`'s `"connected"` event (via `dataSourceRegistry.on`) that matches by `ds.isDefault` (for `"default"`), `ds.name`, or reference equality, then removes itself via `dataSourceRegistry.off("connected", listener)` once matched.

### `onceDisconnected(dataSourceOrNameOrCallback: DataSource | string | ((dataSource: DataSource) => void), callback?: (dataSource: DataSource) => void): void` [lines 208-268]
- Mirror of `onceConnected` for the disconnected state.
- Fires the callback immediately if `resolvedDataSource.driver.isConnected === false`.
- Otherwise subscribes via `dataSourceRegistry.once("disconnected", listener)`.
- Ambiguity: uses `once` (not `on`) — on a non-matching event the listener re-subscribes itself with another `dataSourceRegistry.once("disconnected", listener)` call to keep listening. This differs from `onceConnected` which uses the persistent `on`/`off` pattern.
