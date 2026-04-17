import { get } from "@mongez/reinforcements";
import { getFieldValue, invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

/**
 * Present with rule - field must be present if another field is present
 * Supports both global and sibling scope
 */
export const presentWithRule: SchemaRule<{
  field: string;
  scope?: "global" | "sibling";
}> = {
  name: "presentWith",
  description: "The field must be present if another field is present",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input field must be present",
  async validate(value: any, context) {
    const fieldValue = getFieldValue(this, context);

    // The field must be present if the other field is present
    if (value === undefined && fieldValue !== undefined) {
      this.context.translatableParams.field = this.context.options.field;
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Present with all rule - field must be present if all specified fields are present
 * Supports both global and sibling scope
 */
export const presentWithAllRule: SchemaRule<{
  fields: string[];
  scope?: "global" | "sibling";
}> = {
  name: "presentWithAll",
  description: "The field must be present if all specified fields are present",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input field must be present",
  async validate(value: any, context) {
    const { fields, scope = "global" } = this.context.options;
    const source = scope === "sibling" ? context.parent : context.allValues;

    // Check if all fields are present
    const allPresent = fields.every((field) => get(source, field) !== undefined);

    // Field must be present if all other fields are present
    if (value === undefined && allPresent) {
      fields.forEach((field) => {
        this.context.translatableParams.field = field;
      });

      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Present with any rule - field must be present if any of the specified fields is present
 * Supports both global and sibling scope
 */
export const presentWithAnyRule: SchemaRule<{
  fields: string[];
  scope?: "global" | "sibling";
}> = {
  name: "presentWithAny",
  description: "The field must be present if any of the specified fields is present",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input field must be present",
  async validate(value: any, context) {
    const { fields, scope = "global" } = this.context.options;
    const source = scope === "sibling" ? context.parent : context.allValues;

    // Check if any field is present
    const anyPresent = fields.some((field) => get(source, field) !== undefined);

    // Field must be present if any other field is present
    if (value === undefined && anyPresent) {
      fields.forEach((field) => {
        this.context.translatableParams.field = field;
      });

      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};
