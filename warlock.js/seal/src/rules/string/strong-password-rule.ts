import { invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

/**
 * Strong Password rule - validates password strength
 * Requirements:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export const strongPasswordRule: SchemaRule<{ minLength?: number }> = {
  name: "strongPassword",
  defaultErrorMessage:
    "The :input must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
  async validate(value: any, context) {
    const password = String(value);
    const minLength = this.context.options.minLength ?? 8;

    // Check minimum length
    if (password.length < minLength) {
      return invalidRule(this, context);
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return invalidRule(this, context);
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return invalidRule(this, context);
    }

    // Check for at least one number
    if (!/[0-9]/.test(password)) {
      return invalidRule(this, context);
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};
