import { getFieldValue, invalidRule, VALID_RULE } from "../../helpers";
import { isEmptyValue } from "../../helpers/is-empty-value";
import type { SchemaRule } from "../../types";

/**
 * Forbidden if rule - field is forbidden if another field equals a specific value
 * Supports both global and sibling scope
 */
export const forbiddenIfRule: SchemaRule<{
  field: string;
  value: any;
  scope?: "global" | "sibling";
}> = {
  name: "forbiddenIf",
  description: "The field is forbidden if another field equals a specific value",
  sortOrder: -2,
  defaultErrorMessage: "The :input is forbidden",
  async validate(value: any, context) {
    const { value: expectedValue } = this.context.options;
    const fieldValue = getFieldValue(this, context);

    // Field is forbidden if it has a value and the other field equals the expected value
    if (!isEmptyValue(value) && fieldValue === expectedValue) {
      this.context.translatableParams.field = this.context.options.field;
      this.context.translationParams.value = expectedValue;
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Forbidden if not rule - field is forbidden if another field does NOT equal a specific value
 * Supports both global and sibling scope
 */
export const forbiddenIfNotRule: SchemaRule<{
  field: string;
  value: any;
  scope?: "global" | "sibling";
}> = {
  name: "forbiddenIfNot",
  description: "The field is forbidden if another field does NOT equal a specific value",
  sortOrder: -2,
  defaultErrorMessage: "The :input is forbidden",
  async validate(value: any, context) {
    const { value: expectedValue } = this.context.options;
    const fieldValue = getFieldValue(this, context);

    // Field is forbidden if it has a value and the other field does NOT equal the expected value
    if (!isEmptyValue(value) && fieldValue !== expectedValue) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Forbidden if empty rule - field is forbidden if another field is empty
 * Supports both global and sibling scope
 */
export const forbiddenIfEmptyRule: SchemaRule<{
  field: string;
  scope?: "global" | "sibling";
}> = {
  name: "forbiddenIfEmpty",
  description: "The field is forbidden if another field is empty",
  sortOrder: -2,
  defaultErrorMessage: "The :input is forbidden",
  async validate(value: any, context) {
    const fieldValue = getFieldValue(this, context);

    // Field is forbidden if it has a value and the other field is empty
    if (!isEmptyValue(value) && isEmptyValue(fieldValue)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Forbidden if not empty rule - field is forbidden if another field is not empty
 * Supports both global and sibling scope
 */
export const forbiddenIfNotEmptyRule: SchemaRule<{
  field: string;
  scope?: "global" | "sibling";
}> = {
  name: "forbiddenIfNotEmpty",
  description: "The field is forbidden if another field is not empty",
  sortOrder: -2,
  defaultErrorMessage: "The :input is forbidden",
  async validate(value: any, context) {
    const fieldValue = getFieldValue(this, context);

    // Field is forbidden if it has a value and the other field is not empty
    if (!isEmptyValue(value) && !isEmptyValue(fieldValue)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Forbidden if in rule - field is forbidden if another field's value is in the given array
 * Supports both global and sibling scope
 */
export const forbiddenIfInRule: SchemaRule<{
  field: string;
  values: any[];
  scope?: "global" | "sibling";
}> = {
  name: "forbiddenIfIn",
  description: "The field is forbidden if another field's value is in the given array",
  sortOrder: -2,
  defaultErrorMessage: "The :input is forbidden",
  async validate(value: any, context) {
    const { values } = this.context.options;
    const fieldValue = getFieldValue(this, context);

    // Field is forbidden if it has a value and the other field's value is in the array
    if (!isEmptyValue(value) && values.includes(fieldValue)) {
      this.context.translationParams.values = values.join(", ");
      this.context.translatableParams.field = this.context.options.field;
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Forbidden if not in rule - field is forbidden if another field's value is NOT in the given array
 * Supports both global and sibling scope
 */
export const forbiddenIfNotInRule: SchemaRule<{
  field: string;
  values: any[];
  scope?: "global" | "sibling";
}> = {
  name: "forbiddenIfNotIn",
  description: "The field is forbidden if another field's value is NOT in the given array",
  sortOrder: -2,
  defaultErrorMessage: "The :input is forbidden",
  async validate(value: any, context) {
    const { values } = this.context.options;
    const fieldValue = getFieldValue(this, context);

    // Field is forbidden if it has a value and the other field's value is NOT in the array
    if (!isEmptyValue(value) && !values.includes(fieldValue)) {
      this.context.translationParams.values = values.join(", ");
      this.context.translatableParams.field = this.context.options.field;
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};
