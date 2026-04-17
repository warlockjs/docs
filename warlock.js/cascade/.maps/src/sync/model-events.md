# model-events
source: sync/model-events.ts
description: Type-safe event name helpers for model sync operations
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `ChildModel, Model` from `../model/model`

## Exports
- `MODEL_EVENT_PREFIX` — Event name prefix constant [lines 15-15]
- `ModelSyncEventType` — Event type enumeration [lines 20-23]
- `ModelSyncEventTypeName` — Event type name union [lines 25-25]
- `getModelUpdatedEvent` — Function for update event names [lines 39-41]
- `getModelDeletedEvent` — Function for delete event names [lines 55-57]
- `getModelEvent` — Function for generic event names [lines 72-74]

## Constants

### `MODEL_EVENT_PREFIX` [lines 15-15]
- Value: "model"
- Prefix for all model sync events

### `ModelSyncEventType` [lines 20-23]
- `UPDATED: "updated"` — Model update event type
- `DELETED: "deleted"` — Model deletion event type

## Types

### `ModelSyncEventTypeName` [lines 25-25]
- Union of ModelSyncEventType values
- "updated" | "deleted"

## Functions

### `getModelUpdatedEvent(modelClass: ChildModel<Model>): string` [lines 39-41]
- Returns event name for model update
- Format: "model.{ClassName}.updated"

### `getModelDeletedEvent(modelClass: ChildModel<Model>): string` [lines 55-57]
- Returns event name for model deletion
- Format: "model.{ClassName}.deleted"

### `getModelEvent(modelName: string, eventType: ModelSyncEventTypeName): string` [lines 72-74]
- Returns event name by string model name and event type
- Format: "model.{modelName}.{eventType}"
