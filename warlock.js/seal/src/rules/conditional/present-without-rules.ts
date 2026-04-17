import { get } from "@mongez/reinforcements";
import { getFieldValue, invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

/**
 * Present without rule - field must be present if another field is missing
 * Supports both global and sibling scope
 */
export const presentWithoutRule: SchemaRule<{
  field: string;
  scope?: "global" | "sibling";
}> = {
  name: "presentWithout",
  description: "The field must be present if another field is missing",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input field must be present",
  async validate(value: any, context) {
    const fieldValue = getFieldValue(this, context);

    // Field must be present if the other field is missing
    if (value === undefined && fieldValue === undefined) {
      this.context.translatableParams.field = this.context.options.field;
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Present without all rule - field must be present if all specified fields are missing
 * Supports both global and sibling scope
 */
export const presentWithoutAllRule: SchemaRule<{
  fields: string[];
  scope?: "global" | "sibling";
}> = {
  name: "presentWithoutAll",
  description: "The field must be present if all specified fields are missing",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input field must be present",
  async validate(value: any, context) {
    const { fields, scope = "global" } = this.context.options;
    const source = scope === "sibling" ? context.parent : context.allValues;

    // Check if all fields are missing
    const allMissing = fields.every((field) => get(source, field) === undefined);

    // Field must be present if all other fields are missing
    if (value === undefined && allMissing) {
      fields.forEach((field) => {
        this.context.translatableParams.field = field;
      });

      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Present without any rule - field must be present if any of the specified fields is missing
 * Supports both global and sibling scope
 */
export const presentWithoutAnyRule: SchemaRule<{
  fields: string[];
  scope?: "global" | "sibling";
}> = {
  name: "presentWithoutAny",
  description: "The field must be present if any of the specified fields is missing",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input field must be present",
  async validate(value: any, context) {
    const { fields, scope = "global" } = this.context.options;
    const source = scope === "sibling" ? context.parent : context.allValues;

    // Check if any field is missing
    const anyMissing = fields.some((field) => get(source, field) === undefined);

    // Field must be present if any other field is missing
    if (value === undefined && anyMissing) {
      fields.forEach((field) => {
        this.context.translatableParams.field = field;
      });

      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};
