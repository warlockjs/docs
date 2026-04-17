import { invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";
import type { WeekDay } from "../../types/date-types";
import { WEEK_DAYS } from "../../types/date-types";

/**
 * Weekend rule - date must be Saturday or Sunday
 */
export const weekendRule: SchemaRule = {
  name: "weekend",
  defaultErrorMessage: "The :input must be a weekend (Saturday or Sunday)",
  async validate(value: Date, context) {
    const inputDate = new Date(value);
    const dayOfWeek = inputDate.getDay();

    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};

/**
 * Weekday rule - date must be Monday through Friday
 */
export const weekdayRule: SchemaRule = {
  name: "weekday",
  defaultErrorMessage: "The :input must be a weekday (Monday-Friday)",
  async validate(value: Date, context) {
    const inputDate = new Date(value);
    const dayOfWeek = inputDate.getDay();

    // 1-5 = Monday-Friday
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * Weekdays rule - date must be one of specified weekdays
 */
export const weekdaysRule: SchemaRule<{ days: WeekDay[] }> = {
  name: "weekdays",
  defaultErrorMessage: "The :input must be one of: :days",
  async validate(value: Date, context) {
    const inputDate = new Date(value);
    const dayOfWeek = inputDate.getDay();
    const { days } = this.context.options;

    const allowedDays = days.map((day) => WEEK_DAYS[day]);

    if (allowedDays.includes(dayOfWeek)) {
      return VALID_RULE;
    }

    days.forEach((day) => {
      this.context.translatableParams[day] = day;
    });

    return invalidRule(this, context);
  },
};

/**
 * Business day rule - date must be Monday-Friday (no weekends)
 */
export const businessDayRule: SchemaRule = {
  name: "businessDay",
  defaultErrorMessage: "The :input must be a business day",
  async validate(value: Date, context) {
    const inputDate = new Date(value);
    const dayOfWeek = inputDate.getDay();

    // 1-5 = Monday-Friday
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};
