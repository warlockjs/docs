import { get } from "@mongez/reinforcements";
import { getFieldValue, invalidRule, VALID_RULE } from "../../helpers";
import { isEmptyValue } from "../../helpers/is-empty-value";
import type { SchemaRule } from "../../types";

/**
 * Required if rule - field is required if another field equals a specific value
 * Supports both global and sibling scope
 */
export const requiredIfRule: SchemaRule<{
  field: string;
  value: any;
  scope?: "global" | "sibling";
}> = {
  name: "requiredIf",
  description: "The field is required if another field equals a specific value",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const { value: expectedValue } = this.context.options;
    const fieldValue = getFieldValue(this, context);

    // Field is required if the other field equals the expected value
    if (isEmptyValue(value) && fieldValue === expectedValue) {
      this.context.translatableParams.field = this.context.options.field;
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Required if empty rule - field is required if another field is empty
 * Supports both global and sibling scope
 */
export const requiredIfEmptyRule: SchemaRule<{
  field: string;
  scope?: "global" | "sibling";
}> = {
  name: "requiredIfEmpty",
  description: "The field is required if :field is empty",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const fieldValue = getFieldValue(this, context);

    // Field is required if the other field is empty
    if (isEmptyValue(value) && isEmptyValue(fieldValue)) {
      this.context.translatableParams.field = this.context.options.field;
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Required if not empty rule - field is required if another field is not empty
 * Supports both global and sibling scope
 */
export const requiredIfNotEmptyRule: SchemaRule<{
  field: string;
  scope?: "global" | "sibling";
}> = {
  name: "requiredIfNotEmpty",
  description: "The field is required if :field is not empty",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const fieldValue = getFieldValue(this, context);

    // Field is required if the other field is not empty
    if (isEmptyValue(value) && !isEmptyValue(fieldValue)) {
      this.context.translatableParams.field = this.context.options.field;
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Required if in rule - field is required if another field's value is in the given array
 * Supports both global and sibling scope
 */
export const requiredIfInRule: SchemaRule<{
  field: string;
  values: any[];
  scope?: "global" | "sibling";
}> = {
  name: "requiredIfIn",
  description: "The field is required if :field value is in the given array",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const { values } = this.context.options;
    const fieldValue = getFieldValue(this, context);

    // Field is required if the other field's value is in the array
    if (isEmptyValue(value) && values.includes(fieldValue)) {
      this.context.translatableParams.field = this.context.options.field;
      this.context.translationParams.values = this.context.options.values.join(", ");
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Required if not in rule - field is required if another field's value is NOT in the given array
 * Supports both global and sibling scope
 */
export const requiredIfNotInRule: SchemaRule<{
  field: string;
  values: any[];
  scope?: "global" | "sibling";
}> = {
  name: "requiredIfNotIn",
  description: "The field is required if another field's value is NOT in the given array",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const { values } = this.context.options;
    const fieldValue = getFieldValue(this, context);

    // Field is required if the other field's value is NOT in the array
    if (isEmptyValue(value) && !values.includes(fieldValue)) {
      this.context.translatableParams.field = this.context.options.field;
      this.context.translationParams.values = this.context.options.values.join(", ");
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Get multiple field values based on scope
 */
function getFieldsValues(
  rule: SchemaRule<{ fields: string[]; scope?: "global" | "sibling" }>,
  context: any,
): any[] {
  const { fields, scope = "global" } = (rule as any).context.options;
  const source = scope === "sibling" ? context.parent : context.allValues;
  return fields.map((field: string) => get(source, field));
}

/**
 * Required if all empty rule - field is required if ALL specified fields are empty
 * Supports both global and sibling scope
 */
export const requiredIfAllEmptyRule: SchemaRule<{
  fields: string[];
  scope?: "global" | "sibling";
}> = {
  name: "requiredIfAllEmpty",
  description: "The field is required if all :fields are empty",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const fieldValues = getFieldsValues(this, context);

    // Field is required if ALL other fields are empty
    const allEmpty = fieldValues.every((v) => isEmptyValue(v));
    if (isEmptyValue(value) && allEmpty) {
      this.context.options.fields.forEach((field) => {
        this.context.translatableParams.field = field;
      });
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Required if any empty rule - field is required if ANY of the specified fields is empty
 * Supports both global and sibling scope
 */
export const requiredIfAnyEmptyRule: SchemaRule<{
  fields: string[];
  scope?: "global" | "sibling";
}> = {
  name: "requiredIfAnyEmpty",
  description: "The field is required if any of the :fields is empty",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const fieldValues = getFieldsValues(this, context);

    // Field is required if ANY other field is empty
    const anyEmpty = fieldValues.some((v) => isEmptyValue(v));
    if (isEmptyValue(value) && anyEmpty) {
      this.context.options.fields.forEach((field) => {
        this.context.translatableParams.field = field;
      });
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Required if all not empty rule - field is required if ALL specified fields are NOT empty
 * Supports both global and sibling scope
 */
export const requiredIfAllNotEmptyRule: SchemaRule<{
  fields: string[];
  scope?: "global" | "sibling";
}> = {
  name: "requiredIfAllNotEmpty",
  description: "The field is required if all :fields are not empty",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const fieldValues = getFieldsValues(this, context);

    // Field is required if ALL other fields are NOT empty
    const allNotEmpty = fieldValues.every((v) => !isEmptyValue(v));
    if (isEmptyValue(value) && allNotEmpty) {
      this.context.options.fields.forEach((field) => {
        this.context.translatableParams.field = field;
      });
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Required if any not empty rule - field is required if ANY of the specified fields is NOT empty
 * Supports both global and sibling scope
 */
export const requiredIfAnyNotEmptyRule: SchemaRule<{
  fields: string[];
  scope?: "global" | "sibling";
}> = {
  name: "requiredIfAnyNotEmpty",
  description: "The field is required if any of the :fields is not empty",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const fieldValues = getFieldsValues(this, context);

    // Field is required if ANY other field is NOT empty
    const anyNotEmpty = fieldValues.some((v) => !isEmptyValue(v));
    if (isEmptyValue(value) && anyNotEmpty) {
      this.context.options.fields.forEach((field) => {
        this.context.translatableParams.field = field;
      });
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};
