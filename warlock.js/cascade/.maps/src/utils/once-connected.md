# once-connected
source: utils/once-connected.ts
description: Exports onceConnected and onceDisconnected helpers that fire a callback immediately or on the matching DataSource connection event.
complexity: medium
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `DataSource` from `../data-source/data-source`
- `dataSourceRegistry` from `../data-source/data-source-registry`

## Exports
- `onceConnected` — fires callback when target DataSource connects  [lines 75-135]
- `onceDisconnected` — fires callback when target DataSource disconnects  [lines 208-268]

## Classes / Functions / Types / Constants

### `onceConnected`
function  [lines 75-135]
throws: `Error` if data source name/instance provided without callback.
side-effects: registers/removes listener on `dataSourceRegistry` "connected" event.
Fires callback immediately if connected, else on next event.

### `onceDisconnected`
function  [lines 208-268]
throws: `Error` if data source name/instance provided without callback.
side-effects: registers listener on `dataSourceRegistry` "disconnected" event.
Fires callback immediately if disconnected, else on next event.
