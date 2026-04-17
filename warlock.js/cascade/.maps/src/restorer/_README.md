# restorer

Implements the full model restoration pipeline for trash and soft-delete strategies. `DatabaseRestorer` operates at the model-class level, resolves the active strategy, and rejects `"permanent"` upfront since those records are unrecoverable. For `"trash"` it re-inserts from the trash table; for `"soft"` it unsets the `deletedAt` column. ID conflicts during bulk restoration are handled via configurable `onIdConflict` behavior.

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [database-restorer.md](./database-restorer.md) — Restoration pipeline orchestrator for trash and soft-delete strategies with ID-conflict resolution
