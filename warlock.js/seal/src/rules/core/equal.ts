import { invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

/**
 * Equal rule - value must be equal to a specific value
 */
export const equalRule: SchemaRule<{ value: any }> = {
  name: "equal",
  defaultErrorMessage: "The :input must be equal to :value",
  async validate(value: any, context) {
    if (value !== this.context.options.value) {
      this.context.translatableParams.value = this.context.options.value;
      return invalidRule(this, context);
    }
    return VALID_RULE;
  },
};
