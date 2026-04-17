import { get } from "@mongez/reinforcements";
import { invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

/**
 * Matches rule - value must match another field value
 */
export const matchesRule: SchemaRule<{ field: string }> = {
  name: "matches",
  defaultErrorMessage: "The :input must match :field",
  async validate(value: any, context) {
    const otherFieldValue = get(context.allValues, this.context.options.field);

    if (value === otherFieldValue) {
      return VALID_RULE;
    }

    this.context.translatableParams.field = this.context.options.field;

    return invalidRule(this, context);
  },
};
