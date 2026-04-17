import { isEmail } from "@mongez/supportive-is";
import { invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

/**
 * Email rule - validates email format
 */
export const emailRule: SchemaRule = {
  name: "email",
  defaultErrorMessage: "The :input must be a valid email address",
  async validate(value: any, context) {
    if (isEmail(value)) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};
