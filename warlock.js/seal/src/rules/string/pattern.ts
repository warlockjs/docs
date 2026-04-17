import { invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

/**
 * Pattern rule - validates against regex pattern
 */
export const patternRule: SchemaRule<{ pattern: RegExp }> = {
  name: "pattern",
  defaultErrorMessage: "The :input does not match the required pattern",
  async validate(value: any, context) {
    if (this.context.options.pattern.test(value)) {
      return VALID_RULE;
    }

    this.context.translationParams.pattern = this.context.options.pattern.toString();
    return invalidRule(this, context);
  },
};
