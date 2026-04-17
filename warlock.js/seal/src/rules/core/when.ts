import { get } from "@mongez/reinforcements";
import { invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule, WhenRuleOptions } from "../../types";

/**
 * When rule - conditional validation based on another field value
 */
export const whenRule: SchemaRule<WhenRuleOptions> = {
  name: "when",
  description: "Apply conditional validation based on another field value",
  async validate(value: any, context) {
    const fieldToCheck = this.context.options.field;
    const conditions = this.context.options.is;
    const otherwise = this.context.options.otherwise;
    const scope = this.context.options.scope || "global";

    const fieldValue =
      scope === "global"
        ? get(context.allValues, fieldToCheck)
        : get(context.parent, fieldToCheck);

    // Convert field value to string for key lookup
    // This handles boolean, number, and string field values
    const fieldValueKey = String(fieldValue);

    if (conditions[fieldValueKey]) {
      const result = await conditions[fieldValueKey].validate(value, context);
      if (result.isValid) {
        return VALID_RULE;
      }

      // Safe error access
      this.context.errorMessage =
        result.errors?.[0]?.error || "Validation failed";
      return invalidRule(this, context);
    }

    if (otherwise) {
      const result = await otherwise.validate(value, context);

      if (result.isValid) {
        return VALID_RULE;
      }

      // Safe error access
      this.context.errorMessage =
        result.errors?.[0]?.error || "Validation failed";
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};
