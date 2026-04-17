import { invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

/**
 * Credit card rule - validates credit card number
 */
export const isCreditCardRule: SchemaRule = {
  name: "creditCard",
  defaultErrorMessage: "The :input must be a valid credit card number",
  async validate(value: any, context) {
    // Luhn algorithm for credit card validation
    const cardNumber = String(value).replace(/\s/g, "");

    if (!/^\d+$/.test(cardNumber)) {
      return invalidRule(this, context);
    }

    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    if (sum % 10 === 0) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};
