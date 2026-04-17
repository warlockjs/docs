# events

Defines the 16 model lifecycle event names, the typed listener callback signature, and the `ModelEvents` async emitter class that powers all Cascade model hooks. A `ModelEvents` instance is created per model class; the `globalModelEvents` singleton allows cross-cutting concerns to subscribe to every model type from a single registration point.

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [model-events.md](./model-events.md) — ModelEventName union, ModelEventListener signature, ModelEvents class, and globalModelEvents singleton
