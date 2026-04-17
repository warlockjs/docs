import { getFieldValue, invalidRule, VALID_RULE } from "../../helpers";
import { isEmptyValue } from "../../helpers/is-empty-value";
import type { SchemaRule } from "../../types";

const isAcceptedValue = (value: any) => {
  return ["1", "true", "yes", "y", "on", 1, true, "Yes", "Y", "On"].includes(value);
};

/**
 * Validate value as accepted if it equals:
 * 1 | "1" | true | "true" | "yes" | "y" | "on"
 */
export const acceptedRule: SchemaRule = {
  name: "accepted",
  defaultErrorMessage: "The :input must be accepted",
  description:
    "The value must be accepted if it equals: 1 | '1' | true | 'true' | 'yes' | 'y' | 'on' | 1 | true | 'Yes' | 'Y' | 'On'",
  async validate(value: any, context) {
    if (isAcceptedValue(value)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * Accepted value if another field's value equals to a specific value
 */
export const acceptedIfRule: SchemaRule<{ field: string; value: any }> = {
  name: "acceptedIf",
  description: "The field must be accepted if :field's value equals to :value",
  defaultErrorMessage: "The :input must be accepted",
  async validate(value: any, context) {
    const fieldValue = getFieldValue(this, context);
    const { value: expectedValue } = this.context.options;

    this.context.translatableParams.field = this.context.options.field;
    this.context.translatableParams.value = this.context.options.value;
    if (fieldValue !== expectedValue) {
      return invalidRule(this, context);
    }

    if (!isAcceptedValue(value)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Accepted if another field is not equal to the given value
 */
export const acceptedUnlessRule: SchemaRule<{ field: string; value: any }> = {
  name: "acceptedUnless",
  description: "The field must be accepted if :field's value is not equal to :value",
  defaultErrorMessage: "The :input must be accepted",
  async validate(value: any, context) {
    const fieldValue = getFieldValue(this, context);
    const { value: expectedValue } = this.context.options;

    this.context.translatableParams.field = this.context.options.field;
    this.context.translatableParams.value = this.context.options.value;

    if (fieldValue === expectedValue) {
      return invalidRule(this, context);
    }

    if (!isAcceptedValue(value)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Accepted if another field is required
 */
export const acceptedIfRequiredRule: SchemaRule<{ field: string }> = {
  name: "acceptedIfRequired",
  description: "The field must be accepted if :field is required",
  defaultErrorMessage: "The :input must be accepted",
  async validate(value: any, context) {
    const fieldValue = getFieldValue(this, context);
    this.context.translatableParams.field = this.context.options.field;

    if (isEmptyValue(fieldValue)) {
      return invalidRule(this, context);
    }

    if (!isAcceptedValue(value)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Accepted if another field is present
 */
export const acceptedIfPresentRule: SchemaRule<{ field: string }> = {
  name: "acceptedIfPresent",
  description: "The field must be accepted if :field is present",
  defaultErrorMessage: "The :input must be accepted",
  async validate(value: any, context) {
    const fieldValue = getFieldValue(this, context);
    this.context.translatableParams.field = this.context.options.field;

    if (fieldValue === undefined) {
      return invalidRule(this, context);
    }

    if (!isAcceptedValue(value)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Accepted if another field is missing
 */
export const acceptedWithoutRule: SchemaRule<{ field: string }> = {
  name: "acceptedWithout",
  description: "The field must be accepted if :field is missing",
  defaultErrorMessage: "The :input must be accepted",
  async validate(value: any, context) {
    const fieldValue = getFieldValue(this, context);
    this.context.translatableParams.field = this.context.options.field;

    if (fieldValue !== undefined) {
      return invalidRule(this, context);
    }

    if (!isAcceptedValue(value)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};
