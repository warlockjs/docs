import { invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

/**
 * URL rule - validates URL format
 */
export const urlRule: SchemaRule = {
  name: "url",
  defaultErrorMessage: "The :input must be a valid URL",
  async validate(value: any, context) {
    try {
      new URL(value);
      return VALID_RULE;
    } catch {
      return invalidRule(this, context);
    }
  },
};
