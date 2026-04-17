import { invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

/**
 * Starts with rule
 */
export const startsWithRule: SchemaRule<{ value: string }> = {
  name: "startsWith",
  defaultErrorMessage: "The :input must start with :value",
  async validate(value: any, context) {
    if (String(value).startsWith(this.context.options.value)) {
      return VALID_RULE;
    }

    this.context.translatableParams.value = this.context.options.value;

    return invalidRule(this, context);
  },
};

/**
 * Ends with rule
 */
export const endsWithRule: SchemaRule<{ value: string }> = {
  name: "endsWith",
  defaultErrorMessage: "The :input must end with :value",
  async validate(value: any, context) {
    if (String(value).endsWith(this.context.options.value)) {
      return VALID_RULE;
    }

    this.context.translatableParams.value = this.context.options.value;

    return invalidRule(this, context);
  },
};

/**
 * Contains rule
 */
export const containsRule: SchemaRule<{ value: string }> = {
  name: "contains",
  defaultErrorMessage: "The :input must contain :value",
  async validate(value: any, context) {
    if (String(value).includes(this.context.options.value)) {
      return VALID_RULE;
    }

    this.context.translatableParams.value = this.context.options.value;

    return invalidRule(this, context);
  },
};

/**
 * Not contains rule
 */
export const notContainsRule: SchemaRule<{ value: string }> = {
  name: "notContains",
  defaultErrorMessage: "The :input must not contain :value",
  async validate(value: any, context) {
    if (!String(value).includes(this.context.options.value)) {
      return VALID_RULE;
    }

    this.context.translatableParams.value = this.context.options.value;

    return invalidRule(this, context);
  },
};
