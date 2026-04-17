# remover

Implements the full model deletion pipeline supporting trash, soft, and permanent strategies. `DatabaseRemover` receives a hydrated model instance, resolves the active delete strategy via a four-step priority chain, delegates the actual write to the driver, emits lifecycle events, and fires a fire-and-forget sync notification so downstream sync operations are notified without blocking the caller.

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [database-remover.md](./database-remover.md) — Deletion pipeline orchestrator supporting trash, soft-delete, and permanent strategies with event emission
