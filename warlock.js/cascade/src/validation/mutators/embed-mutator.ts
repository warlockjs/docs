import type { Mutator } from "@warlock.js/seal";
import { ChildModel, Model } from "../../model/model";
import { getModelFromRegistry } from "../../model/register-model";

type DatabaseModelMutatorOptions = {
  model: ChildModel<any> | string;
};

export const databaseModelMutator: Mutator<DatabaseModelMutatorOptions> = async (
  value,
  context,
) => {
  let { model: ModelClass } = context?.options || {};

  if (typeof ModelClass === "string") {
    ModelClass = getModelFromRegistry(ModelClass)!;
  }

  if (!ModelClass) {
    throw new Error(`Model ${ModelClass} not found in registry`);
  }

  if (value instanceof Model) return value;

  if (typeof value === "object" && value?.id) {
    value = Number(value.id);
  }

  if (typeof value !== "number") return value;

  return await ModelClass.find(value);
};

export const databaseModelsMutator: Mutator<DatabaseModelMutatorOptions> = async (
  value,
  context,
) => {
  if (!Array.isArray(value)) return value;

  let { model: ModelClass } = context?.options || {};

  if (typeof ModelClass === "string") {
    ModelClass = getModelFromRegistry(ModelClass)!;
  }

  if (!ModelClass) {
    throw new Error(`Model ${ModelClass} not found in registry`);
  }

  // first, if all values are list of models, then return them.
  if (value.every((item) => item instanceof Model)) return value;

  const ids = value.map((item) => item?.id || item).filter((item) => item !== undefined);

  return await ModelClass.query().whereIn("id", ids).get();
};
