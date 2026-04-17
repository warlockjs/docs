import { invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";
import type { BaseValidator } from "../../validators/base-validator";

/**
 * Union rule - value must match at least one of the provided validators
 */
export const unionRule: SchemaRule<{ validators: BaseValidator[] }> = {
  name: "union",
  defaultErrorMessage: "Value must match one of the allowed types",
  async validate(value: any, context) {
    const validators = this.context.options.validators;
    const firstErrorOnly = context.configurations?.firstErrorOnly ?? true;
    const allErrors: string[] = [];

    // Try each validator
    for (const validator of validators) {
      // Skip if type doesn't match (optimization)
      if (!validator.matchesType(value)) {
        continue;
      }

      // Type matches - validate
      const result = await validator.validate(value, context);

      if (result.isValid) {
        // Success! Validator matched and validated
        return VALID_RULE;
      }

      // Failed - collect error message
      const errorMsg = result.errors?.[0]?.error || "Validation failed";
      allErrors.push(errorMsg);

      // If firstErrorOnly, stop after first failed validator
      if (firstErrorOnly) {
        break;
      }
    }

    // All failed or no validator matched the type
    if (allErrors.length > 0) {
      // At least one validator matched type but failed validation
      this.context.errorMessage = firstErrorOnly
        ? allErrors[0]
        : allErrors.join("; ");
    }

    return invalidRule(this, context);
  },
};
