import { get } from "@mongez/reinforcements";
import { invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

/**
 * Min rule - value must be equal or greater than minimum
 * Supports field names with sibling scope
 */
export const minRule: SchemaRule<{
  min: number | string;
  scope?: "global" | "sibling";
}> = {
  name: "min",
  defaultErrorMessage: "The :input must be at least :min",
  async validate(value: any, context) {
    const { min, scope = "global" } = this.context.options;
    let compareMin: number;

    if (typeof min === "number") {
      compareMin = min;
      this.context.translationParams.min = min;
    } else {
      const source = scope === "sibling" ? context.parent : context.allValues;
      const fieldValue = get(source, min);

      if (fieldValue === undefined) {
        return VALID_RULE;
      }

      this.context.translatableParams.min = min;

      compareMin = Number(fieldValue);

      if (isNaN(compareMin)) {
        return VALID_RULE;
      }
    }

    if (value >= compareMin) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * Max rule - value must be equal or less than maximum
 * Supports field names with sibling scope
 */
export const maxRule: SchemaRule<{
  max: number | string;
  scope?: "global" | "sibling";
}> = {
  name: "max",
  defaultErrorMessage: "The :input must equal to or less than :max",
  async validate(value: any, context) {
    const { max, scope = "global" } = this.context.options;
    let compareMax: number;

    if (typeof max === "number") {
      compareMax = max;
      this.context.translationParams.max = max;
    } else {
      const source = scope === "sibling" ? context.parent : context.allValues;
      const fieldValue = get(source, max);

      if (fieldValue === undefined) {
        return VALID_RULE;
      }

      this.context.translatableParams.max = max;

      compareMax = Number(fieldValue);

      if (isNaN(compareMax)) {
        return VALID_RULE;
      }
    }

    if (value <= compareMax) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * Greater than rule - value must be strictly greater than minimum
 * Supports field names with sibling scope
 */
export const greaterThanRule: SchemaRule<{
  value: number | string;
  scope?: "global" | "sibling";
}> = {
  name: "greaterThan",
  defaultErrorMessage: "The :input must be greater than :value",
  async validate(value: any, context) {
    const { value: compareValue, scope = "global" } = this.context.options;
    let compareNumber: number;

    if (typeof compareValue === "number") {
      compareNumber = compareValue;
      this.context.translationParams.value = compareValue;
    } else {
      const source = scope === "sibling" ? context.parent : context.allValues;
      const fieldValue = get(source, compareValue);

      if (fieldValue === undefined) {
        return VALID_RULE;
      }

      this.context.translatableParams.value = compareValue;

      compareNumber = Number(fieldValue);

      if (isNaN(compareNumber)) {
        return VALID_RULE;
      }
    }

    if (value > compareNumber) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * Less than rule - value must be strictly less than maximum
 * Supports field names with sibling scope
 */
export const lessThanRule: SchemaRule<{
  value: number | string;
  scope?: "global" | "sibling";
}> = {
  name: "lessThan",
  defaultErrorMessage: "The :input must be less than :value",
  async validate(value: any, context) {
    const { value: compareValue, scope = "global" } = this.context.options;
    let compareNumber: number;

    if (typeof compareValue === "number") {
      compareNumber = compareValue;
      this.context.translationParams.value = compareValue;
    } else {
      const source = scope === "sibling" ? context.parent : context.allValues;
      const fieldValue = get(source, compareValue);

      if (fieldValue === undefined) {
        return VALID_RULE;
      }

      this.context.translatableParams.value = compareValue;

      compareNumber = Number(fieldValue);

      if (isNaN(compareNumber)) {
        return VALID_RULE;
      }
    }

    if (value < compareNumber) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * Positive rule - value must be greater than 0
 */
export const positiveRule: SchemaRule = {
  name: "positive",
  defaultErrorMessage: "The :input must be a positive number",
  async validate(value: any, context) {
    if (value > 0) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * Negative rule - value must be less than 0
 */
export const negativeRule: SchemaRule = {
  name: "negative",
  defaultErrorMessage: "The :input must be a negative number",
  async validate(value: any, context) {
    if (value < 0) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * Odd rule - value must be an odd number
 */
export const oddRule: SchemaRule = {
  name: "odd",
  defaultErrorMessage: "The :input must be an odd number",
  async validate(value: any, context) {
    if (value % 2 !== 0) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * Even rule - value must be an even number
 */
export const evenRule: SchemaRule = {
  name: "even",
  defaultErrorMessage: "The :input must be an even number",
  async validate(value: any, context) {
    if (value % 2 === 0) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * Modulo rule - value must be divisible by given number
 */
export const moduloRule: SchemaRule<{ value: number }> = {
  name: "modulo",
  defaultErrorMessage: "The :input must be divisible by :value",
  async validate(value: any, context) {
    if (value % this.context.options.value === 0) {
      return VALID_RULE;
    }

    this.context.translationParams.value = this.context.options.value;

    return invalidRule(this, context);
  },
};

/**
 * Between rule - value must be between the given two numbers (Inclusive)
 * Supports field names with sibling scope
 */
export const betweenNumbersRule: SchemaRule<{
  min: number | string;
  max: number | string;
  scope?: "global" | "sibling";
}> = {
  name: "betweenNumbers",
  defaultErrorMessage: "The :input must be between :min and :max",
  async validate(value: any, context) {
    const { min, max, scope = "global" } = this.context.options;

    // Extract min value
    let compareMin: number;
    if (typeof min === "number") {
      compareMin = min;
      this.context.translationParams.min = min;
    } else {
      const source = scope === "sibling" ? context.parent : context.allValues;
      const fieldValue = get(source, min);

      if (fieldValue === undefined) {
        return VALID_RULE;
      }

      this.context.translatableParams.min = min;

      compareMin = Number(fieldValue);
      if (isNaN(compareMin)) {
        return VALID_RULE;
      }
    }

    // Extract max value
    let compareMax: number;
    if (typeof max === "number") {
      compareMax = max;
      this.context.translationParams.max = max;
    } else {
      const source = scope === "sibling" ? context.parent : context.allValues;
      const fieldValue = get(source, max);

      if (fieldValue === undefined) {
        return VALID_RULE;
      }

      this.context.translatableParams.max = max;

      compareMax = Number(fieldValue);
      if (isNaN(compareMax)) {
        return VALID_RULE;
      }
    }

    if (value >= compareMin && value <= compareMax) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};
