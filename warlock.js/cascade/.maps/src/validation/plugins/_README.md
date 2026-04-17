# validation/plugins

Seal plugin that augments the `v` factory with `v.embed` and `v.embedMany` methods for embedded model validation. The plugin is registered once as a side effect by `database-seal-plugins.ts` and installs both methods directly onto the seal `v` object, making them available everywhere `v` is imported.

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [embed-validator-plugin.md](./embed-validator-plugin.md) — embedValidator SealPlugin that installs v.embed and v.embedMany onto the seal validation factory
