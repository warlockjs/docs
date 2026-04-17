import { invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

/**
 * Without whitespace rule - value must not contain whitespace
 */
export const withoutWhitespaceRule: SchemaRule = {
  name: "withoutWhitespace",
  defaultErrorMessage: "The :input must not contain whitespace",
  async validate(value: any, context) {
    if (!/\s/.test(value)) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};
