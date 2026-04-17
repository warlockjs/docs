import { getFieldValue, invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

/**
 * Equals field rule - value must equal another field's value
 * Supports both global and sibling scope
 */
export const equalsFieldRule: SchemaRule<{
  field: string;
  scope?: "global" | "sibling";
}> = {
  name: "equalsField",
  description: "The value must equal another field's value",
  sortOrder: -1,
  requiresValue: true,
  defaultErrorMessage: "The :input must match the :field field",
  async validate(value: any, context) {
    const fieldValue = getFieldValue(this, context);

    // Value must equal the other field's value
    if (value !== fieldValue) {
      this.context.translatableParams.field = this.context.options.field;
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Not equals field rule - value must NOT equal another field's value
 * Supports both global and sibling scope
 */
export const notEqualsFieldRule: SchemaRule<{
  field: string;
  scope?: "global" | "sibling";
}> = {
  name: "notEqualsField",
  description: "The value must NOT equal another field's value",
  sortOrder: -1,
  requiresValue: true,
  defaultErrorMessage: "The :input must not match the :field field",
  async validate(value: any, context) {
    const fieldValue = getFieldValue(this, context);

    // Value must NOT equal the other field's value
    if (value === fieldValue) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};
