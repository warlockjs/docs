# utils

Shared utility functions and types that wire together database connections, model definition, pre-save transformation, date validation, and connection lifecycle hooks for Cascade. `connectToDatabase` is the primary bootstrap entry point; `defineModel` provides a declarative factory for typed model subclasses; `useModelTransformer` adapts model-context callbacks into the seal transformer pipeline; `onceConnected`/`onceDisconnected` allow reactive connection lifecycle handling.

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [connect-to-database.md](./connect-to-database.md) — High-level factory that instantiates a driver, creates a DataSource, registers it, and opens the connection
- [database-writer.utils.md](./database-writer.utils.md) — Factory wrapping a model-aware callback into a seal TransformerCallback for pre-save value transformation
- [define-model.md](./define-model.md) — Declarative factory for creating typed Model subclasses with schema, strategies, and custom statics
- [is-valid-date-value.md](./is-valid-date-value.md) — Pure guard function validating numeric timestamps and strict ISO 8601 date strings
- [once-connected.md](./once-connected.md) — Helpers that fire a callback immediately or on the matching DataSource connection/disconnection event
