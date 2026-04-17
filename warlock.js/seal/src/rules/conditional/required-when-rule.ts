import { invalidRule, VALID_RULE } from "../../helpers";
import { isEmptyValue } from "../../helpers/is-empty-value";
import type { SchemaContext, SchemaRule } from "../../types";

/**
 * Required when callback returns true.
 *
 * The callback receives only the SchemaContext (not the value),
 * because "required" is about surrounding conditions, not the field itself.
 *
 * @example
 * ```ts
 * v.string().requiredWhen((context) => {
 *   return context.allData.notificationMethod === 'email';
 * })
 * ```
 */
export const requiredWhenRule: SchemaRule<{
  callback: (context: SchemaContext) => boolean | Promise<boolean>;
}> = {
  name: "requiredWhen",
  defaultErrorMessage: "The :input is required",
  requiresValue: false,
  sortOrder: -2,
  async validate(value, context) {
    const shouldBeRequired = await this.context.options.callback?.(context);

    if (shouldBeRequired && isEmptyValue(value)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};
