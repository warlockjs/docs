import { invalidRule, resolveTranslation, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

/**
 * Enum rule - value must be one of the enum values
 */
export const enumRule: SchemaRule<{ enum: any }> = {
  name: "enum",
  defaultErrorMessage: "The :input must be one of the following values: :enum",
  async validate(value: any, context) {
    const enumValues = this.context.options.enum;

    if (enumValues.includes(value)) {
      return VALID_RULE;
    }

    // Translate each enum value individually, then join into a display string
    this.context.translationParams.enum = enumValues
      .map((v: any) =>
        resolveTranslation({ key: String(v), rawValue: String(v), rule: this, context }),
      )
      .join(", ");

    return invalidRule(this, context);
  },
};

/**
 * In rule - value must be in the given array
 */
export const inRule: SchemaRule<{ values: any[] }> = {
  name: "in",
  defaultErrorMessage: "The :input must be one of the following values: :values",
  async validate(value: any, context) {
    if (this.context.options.values.includes(value)) {
      return VALID_RULE;
    }

    // Translate each value individually, then join
    this.context.translationParams.values = this.context.options.values
      .map((v: any) =>
        resolveTranslation({ key: String(v), rawValue: String(v), rule: this, context }),
      )
      .join(", ");

    return invalidRule(this, context);
  },
};

/**
 * Allowed values rule - value must be one of allowed values
 */
export const allowedValuesRule: SchemaRule<{ allowedValues: any[] }> = {
  name: "allowedValues",
  defaultErrorMessage: "The :input must be one of the allowed values",
  async validate(value: any, context) {
    if (this.context.options.allowedValues.includes(value)) {
      return VALID_RULE;
    }

    // Translate each value individually, then join
    this.context.translationParams.allowedValues = this.context.options.allowedValues
      .map((v: any) =>
        resolveTranslation({ key: String(v), rawValue: String(v), rule: this, context }),
      )
      .join(", ");

    return invalidRule(this, context);
  },
};

/**
 * Not allowed values rule - value must not be in forbidden list
 */
export const notAllowedValuesRule: SchemaRule<{ notAllowedValues: any[] }> = {
  name: "notAllowedValues",
  defaultErrorMessage: "The :input contains a forbidden value",
  async validate(value: any, context) {
    if (!this.context.options.notAllowedValues.includes(value)) {
      return VALID_RULE;
    }

    // Translate each value individually, then join
    this.context.translationParams.notAllowedValues = this.context.options.notAllowedValues
      .map((v: any) =>
        resolveTranslation({ key: String(v), rawValue: String(v), rule: this, context }),
      )
      .join(", ");

    return invalidRule(this, context);
  },
};
