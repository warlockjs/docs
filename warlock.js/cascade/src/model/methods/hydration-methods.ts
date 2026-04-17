import { RelationHydrator, type ModelSnapshot, type SerializedRelation } from "../../relations/relation-hydrator";
import type { ChildModel, Model } from "../model";

export function hydrateModel<TModel extends Model = Model>(
  ModelClass: ChildModel<TModel>,
  data: Record<string, unknown>,
): TModel {
  const model = new ModelClass(ModelClass.getDriver().deserialize(data));
  model.isNew = false;
  return model;
}

export function modelFromSnapshot<TModel extends Model>(
  ModelClass: ChildModel<TModel>,
  snapshot: ModelSnapshot,
): TModel {
  const model = ModelClass.hydrate(snapshot.data) as TModel;
  RelationHydrator.hydrate(model, ModelClass.relations, snapshot.relations);
  return model;
}

export function modelToSnapshot(model: Model): ModelSnapshot {
  const driver = (model.constructor as typeof Model).getDataSource().driver;
  const relations: Record<string, SerializedRelation> = {};

  for (const [name, related] of model.loadedRelations) {
    if (related === null) {
      relations[name] = null;
    } else if (Array.isArray(related)) {
      relations[name] = related.map((m) => (m instanceof Object && typeof m.toSnapshot === "function" ? m.toSnapshot() : m));
    } else if (related instanceof Object && typeof related.toSnapshot === "function") {
      relations[name] = related.toSnapshot();
    }
  }

  return {
    data: driver.serialize({ ...model.data }) as Record<string, unknown>,
    relations,
  };
}

export function serializeModel(model: Model) {
  return (model.constructor as typeof Model).getDataSource().driver.serialize(model.data);
}

export function cloneModel<TModel extends Model>(model: TModel): TModel {
  const clonedData = JSON.parse(JSON.stringify(model.data));
  const ModelClass = model.self();
  const clonedModel = new ModelClass(clonedData) as TModel;

  clonedModel.isNew = model.isNew;
  deepFreezeObject(clonedModel.data);
  clonedModel.dirtyTracker.reset();

  return clonedModel;
}

export function deepFreezeObject<T>(obj: T): T {
  Object.freeze(obj);

  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = (obj as any)[prop];
    if (
      value !== null &&
      (typeof value === "object" || typeof value === "function") &&
      !Object.isFrozen(value)
    ) {
      deepFreezeObject(value);
    }
  });

  return obj;
}

export function replaceModelData<TModel extends Model>(
  model: TModel,
  data: Record<string, unknown>,
): void {
  model.data = data as any;
  model.dirtyTracker.replaceCurrentData(data);
}
