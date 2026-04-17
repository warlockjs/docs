import { invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

/**
 * Unique array rule - array must contain unique values
 */
export const uniqueArrayRule: SchemaRule = {
  name: "uniqueArray",
  description: "The array must contain unique values",
  defaultErrorMessage: "The :input must contain unique values",
  async validate(value: any, context) {
    const uniqueValues = new Set(value);

    if (uniqueValues.size === value.length) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * Sorted array rule - array must be sorted
 */
export const sortedArrayRule: SchemaRule<{
  direction?: "asc" | "desc";
}> = {
  name: "sortedArray",
  description: "The array must be sorted",
  defaultErrorMessage: "The :input must be sorted",
  async validate(value: any[], context) {
    if (!Array.isArray(value) || value.length <= 1) {
      return VALID_RULE;
    }

    const direction = this.context.options.direction ?? "asc";
    this.context.translatableParams.direction = direction;

    for (let i = 0; i < value.length - 1; i++) {
      const current = value[i];
      const next = value[i + 1];

      if (direction === "asc") {
        if (current > next) {
          return invalidRule(this, context);
        }
      } else {
        if (current < next) {
          return invalidRule(this, context);
        }
      }
    }

    return VALID_RULE;
  },
};
