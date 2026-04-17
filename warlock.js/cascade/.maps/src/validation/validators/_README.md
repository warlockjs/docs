# validation/validators

Houses the `EmbedModelValidator` class, the integration point for the entire validation subsystem. It extends `BaseValidator` and exposes a fluent API that composes mutators, rules, and the transformer from their respective sibling directories onto seal's internal pipeline. It is instantiated by `v.embed` and `v.embedMany` after the `embedValidator` plugin has been registered.

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [embed-validator.md](./embed-validator.md) — EmbedModelValidator BaseValidator subclass wiring embed mutators, rules, and transformer into a complete pipeline
