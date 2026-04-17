import { getFieldValue, invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

/**
 * Present unless rule - field must be present unless another field equals a specific value
 * Supports both global and sibling scope
 */
export const presentUnlessRule: SchemaRule<{
  field: string;
  value: any;
  scope?: "global" | "sibling";
}> = {
  name: "presentUnless",
  description: "The field must be present unless another field equals a specific value",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input field must be present",
  async validate(value: any, context) {
    const { value: expectedValue } = this.context.options;
    const fieldValue = getFieldValue(this, context);

    // Field must be present unless the other field equals the expected value
    if (value === undefined && fieldValue !== expectedValue) {
      this.context.translationParams.value = expectedValue;
      this.context.translatableParams.field = this.context.options.field;
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};
