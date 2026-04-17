import { invalidRule, VALID_RULE, type SchemaRule } from "@warlock.js/seal";
import { ChildModel, Model } from "./../../model/model";
import { getModelFromRegistry } from "./../../model/register-model";

export const databaseModelRule: SchemaRule = {
  name: "databaseModule",
  defaultErrorMessage: "The :input must be a valid :model model",
  async validate(value, context) {
    if (value instanceof Model === false) {
      this.context.attributesList.model = this.context.options.model?.name;
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

export const databaseModelsRule: SchemaRule<{ model: ChildModel<any> | string }> = {
  name: "databaseModels",
  defaultErrorMessage: "The :input must be a list of valid :model",
  async validate(value, context) {
    let { model } = this.context.options;
    if (typeof model === "string") {
      model = getModelFromRegistry(model)!;
    }

    this.context.attributesList.model = model.name;

    if (!Array.isArray(value)) return invalidRule(this, context);

    if (value.every((item) => item instanceof Model)) return VALID_RULE;

    return invalidRule(this, context);
  },
};
