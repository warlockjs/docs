import { invalidRule, VALID_RULE } from "../../helpers";
import { isEmptyValue } from "../../helpers/is-empty-value";
import type { SchemaRule } from "../../types";

/**
 * Forbidden rule - value must not be present
 */
export const forbiddenRule: SchemaRule = {
  name: "forbidden",
  defaultErrorMessage: "The :input is forbidden",
  async validate(value: any, context) {
    if (!isEmptyValue(value)) {
      return invalidRule(this, context);
    }
    return VALID_RULE;
  },
};
