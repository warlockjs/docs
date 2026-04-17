import { DatabaseWriter } from "../../writer/database-writer";
import type { WriterOptions } from "../../contracts";
import type { ChildModel, Model, ModelSchema } from "../model";
import { emitModelEvent } from "./instance-event-methods";

export async function saveModel<TModel extends Model>(
  model: TModel,
  options?: WriterOptions & { merge?: Partial<ModelSchema> },
): Promise<TModel> {
  if (options?.merge) {
    model.merge(options.merge);
  }
  const writer = new DatabaseWriter(model);
  await writer.save(options);
  return model;
}

export async function createRecord<
  TModel extends Model,
  TSchema extends ModelSchema = TModel extends Model<infer S> ? S : ModelSchema,
>(ModelClass: ChildModel<TModel>, data: Partial<TSchema>): Promise<TModel> {
  const model = new ModelClass(data);
  await model.save();
  return model;
}

export async function createManyRecords<
  TModel extends Model,
  TSchema extends ModelSchema = TModel extends Model<infer S> ? S : ModelSchema,
>(ModelClass: ChildModel<TModel>, data: Partial<TSchema>[]): Promise<TModel[]> {
  return await Promise.all(data.map((item) => createRecord(ModelClass, item)));
}

export async function findOrCreateRecord<
  TModel extends Model,
  TSchema extends ModelSchema = TModel extends Model<infer S> ? S : ModelSchema,
>(
  ModelClass: ChildModel<TModel>,
  filter: Partial<TSchema>,
  data: Partial<TSchema>,
): Promise<TModel> {
  const existing = await ModelClass.first(filter as Record<string, unknown>);

  if (existing) {
    return existing;
  }

  return await createRecord(ModelClass, { ...filter, ...data } as Partial<TSchema>);
}

export async function upsertRecord<
  TModel extends Model,
  TSchema extends ModelSchema = TModel extends Model<infer S> ? S : ModelSchema,
>(
  ModelClass: ChildModel<TModel>,
  filter: Partial<TSchema>,
  data: Partial<TSchema>,
  options?: Record<string, unknown>,
): Promise<TModel> {
  const driver = ModelClass.getDriver();
  const mergedData = { ...filter, ...data } as Record<string, unknown>;

  const tempModel = new ModelClass(mergedData as Partial<TSchema>);
  tempModel.isNew = true;

  await emitModelEvent(tempModel, "saving", {
    isInsert: true,
    options,
    mode: "upsert",
  });

  const createdAtColumn = ModelClass.createdAtColumn;
  const updatedAtColumn = ModelClass.updatedAtColumn;

  if (createdAtColumn !== false && createdAtColumn !== undefined) {
    const createdAtKey = createdAtColumn as string;
    if (!mergedData[createdAtKey]) {
      mergedData[createdAtKey] = new Date();
    }
  }

  if (updatedAtColumn !== false && updatedAtColumn !== undefined) {
    const updatedAtKey = updatedAtColumn as string;
    mergedData[updatedAtKey] = new Date();
  }

  await emitModelEvent(tempModel, "saving", { filter, data: mergedData, options, mode: "upsert" });

  const result = await driver.upsert(ModelClass.table, filter as Record<string, unknown>, mergedData, options);

  const model = ModelClass.hydrate(result as Record<string, unknown>) as TModel;
  model.dirtyTracker.reset();

  await emitModelEvent(model, "saved", { filter, data: result, options, mode: "upsert" });

  return model;
}
