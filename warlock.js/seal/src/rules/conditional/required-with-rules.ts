import { get } from "@mongez/reinforcements";
import { getFieldValue, invalidRule, VALID_RULE } from "../../helpers";
import { isEmptyValue } from "../../helpers/is-empty-value";
import type { SchemaRule } from "../../types";

/**
 * Required with rule - field is required if another field is present
 * Supports both global and sibling scope
 */
export const requiredWithRule: SchemaRule<{
  field: string;
  scope?: "global" | "sibling";
}> = {
  name: "requiredWith",
  description: "The field is required if another field is present",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const fieldValue = getFieldValue(this, context);

    // Field is required if the other field is present
    if (isEmptyValue(value) && fieldValue !== undefined) {
      this.context.translatableParams.field = this.context.options.field;
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Required with all rule - field is required if all specified fields are present
 * Supports both global and sibling scope
 */
export const requiredWithAllRule: SchemaRule<{
  fields: string[];
  scope?: "global" | "sibling";
}> = {
  name: "requiredWithAll",
  description: "The field is required if all specified fields are present",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const { fields, scope = "global" } = this.context.options;
    const source = scope === "sibling" ? context.parent : context.allValues;

    // Check if all fields are present
    const allPresent = fields.every((field) => get(source, field) !== undefined);

    // Field is required if all other fields are present
    if (isEmptyValue(value) && allPresent) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Required with any rule - field is required if any of the specified fields is present
 * Supports both global and sibling scope
 */
export const requiredWithAnyRule: SchemaRule<{
  fields: string[];
  scope?: "global" | "sibling";
}> = {
  name: "requiredWithAny",
  description: "The field is required if any of the specified fields is present",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const { fields, scope = "global" } = this.context.options;
    const source = scope === "sibling" ? context.parent : context.allValues;

    // Check if any field is present
    const anyPresent = fields.some((field) => get(source, field) !== undefined);

    // Field is required if any other field is present
    if (isEmptyValue(value) && anyPresent) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};
