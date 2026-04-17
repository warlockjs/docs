import { invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

/**
 * Between dates rule - date must be between start and end dates
 */
export const betweenDatesRule: SchemaRule<{
  startDate: Date;
  endDate: Date;
}> = {
  name: "betweenDates",
  defaultErrorMessage: "The :input must be between :startDate and :endDate",
  async validate(value: Date, context) {
    const { startDate, endDate } = this.context.options;
    const inputDate = new Date(value);

    if (inputDate >= startDate && inputDate <= endDate) {
      this.context.translationParams.startDate = startDate.toISOString();
      this.context.translationParams.endDate = endDate.toISOString();
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * Today rule - date must be exactly today
 */
export const todayRule: SchemaRule = {
  name: "today",
  defaultErrorMessage: "The :input must be today",
  async validate(value: Date, context) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(value);
    inputDate.setHours(0, 0, 0, 0);

    if (inputDate.getTime() === today.getTime()) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};

/**
 * Past rule - date must be in the past
 */
export const pastRule: SchemaRule = {
  name: "past",
  defaultErrorMessage: "The :input must be in the past",
  async validate(value: Date, context) {
    const now = new Date();
    const inputDate = new Date(value);

    if (inputDate < now) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};

/**
 * Future rule - date must be in the future
 */
export const futureRule: SchemaRule = {
  name: "future",
  defaultErrorMessage: "The :input must be in the future",
  async validate(value: Date, context) {
    const now = new Date();

    if (value > now) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * After today rule - date must be after today (not including today)
 */
export const afterTodayRule: SchemaRule = {
  name: "afterToday",
  defaultErrorMessage: "The :input must be after today",
  async validate(value: Date, context) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(value);
    inputDate.setHours(0, 0, 0, 0);

    if (inputDate > today) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};
