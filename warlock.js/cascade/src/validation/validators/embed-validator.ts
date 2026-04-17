import { arrayRule, BaseValidator } from "@warlock.js/seal";
import { Model, type ChildModel } from "../../model/model";
import { databaseModelMutator, databaseModelsMutator } from "../mutators/embed-mutator";
import { databaseModelRule, databaseModelsRule } from "../rules/database-model-rule";
import { databaseModelTransformer } from "../transformers/embed-model-transformer";

export class EmbedModelValidator extends BaseValidator {
  /**
   * Check if value is a string type
   */
  public matchesType(value: any): boolean {
    return (
      value instanceof Model ||
      typeof value === "number" ||
      (Array.isArray(value) && value.every((item) => item instanceof Model))
    );
  }

  /**
   * Mutate the value to be a model, also fail if the mutated value is not a valid model
   */
  public model(model: ChildModel<any> | string, errorMessage?: string): EmbedModelValidator {
    this.addMutator(databaseModelMutator, {
      model,
    });

    return this.addRule(databaseModelRule, errorMessage, {
      model,
    });
  }

  /**
   * Validate the value is a list of models
   */
  public models(model: ChildModel<any> | string, errorMessage?: string): EmbedModelValidator {
    const instance = this.instance;
    instance.addMutator(databaseModelsMutator, {
      model,
    });

    instance.addMutableRule(arrayRule);
    instance.addMutableRule(databaseModelsRule, errorMessage, {
      model,
    });

    return instance;
  }

  /**
   * Determine how the data will be stored as an embedded document
   */
  public embed(embed?: string | string[]): EmbedModelValidator {
    return this.addTransformer(databaseModelTransformer, {
      embed,
    });
  }
}
