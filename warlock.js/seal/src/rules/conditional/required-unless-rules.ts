import { getFieldValue, invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";
import { isEmptyValue } from "./../../helpers/is-empty-value";

/**
 * Required unless rule - field is required unless another field equals a specific value
 * Supports both global and sibling scope
 */
export const requiredUnlessRule: SchemaRule<{
  field: string;
  value: any;
  scope?: "global" | "sibling";
}> = {
  name: "requiredUnless",
  description: "The field is required unless another field equals a specific value",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const { value: expectedValue } = this.context.options;
    const fieldValue = getFieldValue(this, context);

    // Field is required unless the other field equals the expected value
    if (isEmptyValue(value) && fieldValue !== expectedValue) {
      this.context.translatableParams.field = this.context.options.field;
      this.context.translationParams.value = this.context.options.value;
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};
