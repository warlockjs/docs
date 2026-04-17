import { invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

/**
 * Alpha rule - allows only alphabetic characters
 */
export const alphaRule: SchemaRule = {
  name: "alpha",
  defaultErrorMessage: "The :input must contain only alphabetic characters",
  async validate(value: any, context) {
    if (/^[a-zA-Z]+$/.test(value)) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};

/**
 * AlphaNumeric rule - allows only alphanumeric characters
 */
export const alphaNumericRule: SchemaRule = {
  name: "alphaNumeric",
  defaultErrorMessage: "The :input must contain only alphanumeric characters",
  async validate(value: any, context) {
    if (/^[a-zA-Z0-9]+$/.test(value)) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};

/**
 * Numeric string rule - allows only numeric characters
 */
export const isNumericRule: SchemaRule = {
  name: "numeric",
  defaultErrorMessage: "The :input must contain only numeric characters",
  async validate(value: any, context) {
    if (/^[0-9]+$/.test(String(value))) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};
