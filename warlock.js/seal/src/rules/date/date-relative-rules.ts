import { invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

/**
 * Within days rule - date must be within X days from now (past or future)
 */
export const withinDaysRule: SchemaRule<{ days: number }> = {
  name: "withinDays",
  defaultErrorMessage: "The :input must be within :days days from now",
  async validate(value: Date, context) {
    const now = new Date();
    const inputDate = new Date(value);
    const diffTime = Math.abs(inputDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= this.context.options.days) {
      return VALID_RULE;
    }

    this.context.translationParams.days = this.context.options.days;

    return invalidRule(this, context);
  },
};

/**
 * Within past days rule - date must be within X days in the past
 */
export const withinPastDaysRule: SchemaRule<{ days: number }> = {
  name: "withinPastDays",
  defaultErrorMessage: "The :input must be within the past :days days",
  async validate(value: Date, context) {
    const now = new Date();
    const inputDate = new Date(value);

    if (inputDate > now) {
      return invalidRule(this, context); // Must be in past
    }

    const diffTime = now.getTime() - inputDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= this.context.options.days) {
      return VALID_RULE;
    }

    this.context.translationParams.days = this.context.options.days;

    return invalidRule(this, context);
  },
};

/**
 * Within future days rule - date must be within X days in the future
 */
export const withinFutureDaysRule: SchemaRule<{ days: number }> = {
  name: "withinFutureDays",
  defaultErrorMessage: "The :input must be within the next :days days",
  async validate(value: Date, context) {
    const now = new Date();
    const inputDate = new Date(value);

    if (inputDate < now) {
      return invalidRule(this, context); // Must be in future
    }

    const diffTime = inputDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= this.context.options.days) {
      return VALID_RULE;
    }

    this.context.translationParams.days = this.context.options.days;

    return invalidRule(this, context);
  },
};
