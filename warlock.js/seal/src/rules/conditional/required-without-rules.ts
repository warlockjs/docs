import { get } from "@mongez/reinforcements";
import { getFieldValue, invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";
import { isEmptyValue } from "./../../helpers/is-empty-value";

/**
 * Required without rule - field is required if another field is missing
 * Supports both global and sibling scope
 */
export const requiredWithoutRule: SchemaRule<{
  field: string;
  scope?: "global" | "sibling";
}> = {
  name: "requiredWithout",
  description: "The field is required if another field is missing",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const fieldValue = getFieldValue(this, context);

    // Field is required if the other field is missing
    if (isEmptyValue(value) && fieldValue === undefined) {
      this.context.translatableParams.field = this.context.options.field;
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Required without all rule - field is required if all specified fields are missing
 * Supports both global and sibling scope
 */
export const requiredWithoutAllRule: SchemaRule<{
  fields: string[];
  scope?: "global" | "sibling";
}> = {
  name: "requiredWithoutAll",
  description: "The field is required if all specified fields are missing",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const { fields, scope = "global" } = this.context.options;
    const source = scope === "sibling" ? context.parent : context.allValues;

    // Check if all fields are missing
    const allMissing = fields.every((field) => get(source, field) === undefined);

    // Field is required if all other fields are missing
    if (isEmptyValue(value) && allMissing) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Required without any rule - field is required if any of the specified fields is missing
 * Supports both global and sibling scope
 */
export const requiredWithoutAnyRule: SchemaRule<{
  fields: string[];
  scope?: "global" | "sibling";
}> = {
  name: "requiredWithoutAny",
  description: "The field is required if any of the specified fields is missing",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const { fields, scope = "global" } = this.context.options;
    const source = scope === "sibling" ? context.parent : context.allValues;

    // Check if any field is missing
    const anyMissing = fields.some((field) => get(source, field) === undefined);

    // Field is required if any other field is missing
    if (isEmptyValue(value) && anyMissing) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};
