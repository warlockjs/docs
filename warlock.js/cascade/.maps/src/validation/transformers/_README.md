# validation/transformers

Seal transformer that extracts embed data from validated `Model` instances at the end of the pipeline, converting them to storage-ready plain objects before they are persisted. A string embed key accesses the property directly; an array of keys calls `model.only(keys)` to pick a subset. Non-model values pass through unchanged.

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [embed-model-transformer.md](./embed-model-transformer.md) — databaseModelTransformer seal TransformerCallback extracting embed fields from Model instances
