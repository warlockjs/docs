# write-methods
source: model/methods/write-methods.ts
description: Model persistence and record creation/update operations
complexity: simple
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-haiku-4-5
last-updated-by: claude-haiku-4-5

## Imports
- `DatabaseWriter` from `../../writer/database-writer`
- `WriterOptions` from `../../contracts`
- `ChildModel, Model, ModelSchema` from `../model`
- `emitModelEvent` from `./instance-event-methods`

## Exports
- `saveModel` — Save model with optional merge and options [lines 6-16]
- `createRecord` — Create single record from data [lines 18-25]
- `createManyRecords` — Create multiple records [lines 27-32]
- `findOrCreateRecord` — Find or create record [lines 34-49]
- `upsertRecord` — Create or update record with timestamp handling [lines 51-97]

## Classes / Functions / Types / Constants

### `saveModel<TModel extends Model>(model: TModel, options?: WriterOptions & { merge?: Partial<ModelSchema> }): Promise<TModel>` [lines 6-16]
- Merges optional data and saves model using DatabaseWriter; returns model

### `createRecord<TModel extends Model, TSchema extends ModelSchema = TModel extends Model<infer S> ? S : ModelSchema>(ModelClass: ChildModel<TModel>, data: Partial<TSchema>): Promise<TModel>` [lines 18-25]
- Creates and saves new record; returns saved model

### `createManyRecords<TModel extends Model, TSchema extends ModelSchema = TModel extends Model<infer S> ? S : ModelSchema>(ModelClass: ChildModel<TModel>, data: Partial<TSchema>[]): Promise<TModel[]>` [lines 27-32]
- Creates and saves multiple records; returns array of saved models

### `findOrCreateRecord<TModel extends Model, TSchema extends ModelSchema = TModel extends Model<infer S> ? S : ModelSchema>(ModelClass: ChildModel<TModel>, filter: Partial<TSchema>, data: Partial<TSchema>): Promise<TModel>` [lines 34-49]
- Finds existing record by filter or creates with merged filter and data

### `upsertRecord<TModel extends Model, TSchema extends ModelSchema = TModel extends Model<infer S> ? S : ModelSchema>(ModelClass: ChildModel<TModel>, filter: Partial<TSchema>, data: Partial<TSchema>, options?: Record<string, unknown>): Promise<TModel>` [lines 51-97]
- Inserts or updates record; manages createdAt/updatedAt timestamps; emits saving events with mode context; resets dirty tracker
