import type { GenericObject } from "@mongez/reinforcements";
import type { Model } from "../model";

export function modelToJSON(model: Model): Record<string, unknown> {
  const ModelClass = model.self();
  const resource = ModelClass.resource;

  if (!resource) {
    const toJsonColumns = ModelClass.toJsonColumns;
    if (toJsonColumns && toJsonColumns.length > 0) {
      return model.only(toJsonColumns);
    }
    return model.data;
  }

  const resourceColumns = ModelClass.resourceColumns;
  let data: GenericObject =
    resourceColumns !== undefined && resourceColumns.length > 0
      ? model.only(resourceColumns)
      : { ...model.data };

  for (const [relationName, relatedModel] of model.loadedRelations) {
    if (Array.isArray(relatedModel)) {
      data[relationName] = relatedModel.map((m) =>
        m instanceof Object && typeof m.toJSON === "function" ? m.toJSON() : m,
      );
    } else if (relatedModel instanceof Object && typeof relatedModel.toJSON === "function") {
      data[relationName] = relatedModel.toJSON();
    } else {
      data[relationName] = relatedModel;
    }
  }

  return new resource(data).toJSON();
}
