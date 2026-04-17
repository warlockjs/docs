import { getFieldValue, invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";
import { isEmptyValue } from "./../../helpers/is-empty-value";

/**
 * Present if rule - field must be present if another field equals a specific value
 * Supports both global and sibling scope
 */
export const presentIfRule: SchemaRule<{
  field: string;
  value: any;
  scope?: "global" | "sibling";
}> = {
  name: "presentIf",
  description: "The field must be present if another field equals a specific value",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input field must be present",
  async validate(value: any, context) {
    const { value: expectedValue } = this.context.options;
    const fieldValue = getFieldValue(this, context);

    // Field must be present if the other field equals the expected value
    if (value === undefined && fieldValue === expectedValue) {
      this.context.translationParams.value = expectedValue;
      this.context.translatableParams.field = this.context.options.field;
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Present if empty rule - field must be present if another field is empty
 * Supports both global and sibling scope
 */
export const presentIfEmptyRule: SchemaRule<{
  field: string;
  scope?: "global" | "sibling";
}> = {
  name: "presentIfEmpty",
  description: "The field must be present if another field is empty",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input field must be present",
  async validate(value: any, context) {
    const fieldValue = getFieldValue(this, context);

    // Field must be present if the other field is empty
    if (value === undefined && isEmptyValue(fieldValue)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Present if not empty rule - field must be present if another field is not empty
 * Supports both global and sibling scope
 */
export const presentIfNotEmptyRule: SchemaRule<{
  field: string;
  scope?: "global" | "sibling";
}> = {
  name: "presentIfNotEmpty",
  description: "The field must be present if another field is not empty",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input field must be present",
  async validate(value: any, context) {
    const fieldValue = getFieldValue(this, context);

    // Field must be present if the other field is not empty
    if (value === undefined && !isEmptyValue(fieldValue)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Present if in rule - field must be present if another field's value is in the given array
 * Supports both global and sibling scope
 */
export const presentIfInRule: SchemaRule<{
  field: string;
  values: any[];
  scope?: "global" | "sibling";
}> = {
  name: "presentIfIn",
  description: "The field must be present if another field's value is in the given array",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input field must be present",
  async validate(value: any, context) {
    const { values } = this.context.options;
    const fieldValue = getFieldValue(this, context);

    // Field must be present if the other field's value is in the array
    if (value === undefined && values.includes(fieldValue)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Present if not in rule - field must be present if another field's value is NOT in the given array
 * Supports both global and sibling scope
 */
export const presentIfNotInRule: SchemaRule<{
  field: string;
  values: any[];
  scope?: "global" | "sibling";
}> = {
  name: "presentIfNotIn",
  description: "The field must be present if another field's value is NOT in the given array",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input field must be present",
  async validate(value: any, context) {
    const { values } = this.context.options;
    const fieldValue = getFieldValue(this, context);

    // Field must be present if the other field's value is NOT in the array
    if (value === undefined && !values.includes(fieldValue)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};
