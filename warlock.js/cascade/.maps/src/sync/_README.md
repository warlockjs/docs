# sync

Implements the cascade sync system — the engine that propagates field updates and deletions from a source model to all embedded copies in target models, with configurable depth limiting and cycle detection. The `modelSync` singleton is the user-facing entry point; each call to `sync`/`syncMany` creates a `ModelSyncOperation` that subscribes to model events and delegates execution to `SyncManager`, which consults `SyncContextManager` at every level to validate depth and detect circular chains.

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [types.md](./types.md) — Core TypeScript types and contracts: SyncContext, SyncResult, SyncInstruction, SyncConfig, ModelSyncContract
- [index.md](./index.md) — Barrel re-exporting all public sync symbols
- [model-events.md](./model-events.md) — Type-safe event name helpers for model updated/deleted events
- [model-sync-operation.md](./model-sync-operation.md) — Manages a single source-to-target model sync relationship via event subscriptions
- [model-sync.md](./model-sync.md) — modelSync facade singleton that registers and manages all sync operations with HMR cleanup
- [sync-context.md](./sync-context.md) — Static helpers for sync context creation, depth validation, and cycle detection
- [sync-manager.md](./sync-manager.md) — Orchestrates multi-level sync operations across models with depth limiting and batch execution
