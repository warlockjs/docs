import { get } from "@mongez/reinforcements";
import { invalidRule, VALID_RULE } from "../../helpers";
import { isDateValue } from "../../helpers/date-helpers";
import type { SchemaRule } from "../../types";
import type { WeekDay } from "../../types/date-types";
import { WEEK_DAYS } from "../../types/date-types";

/**
 * Date rule - validates date format
 */
export const dateRule: SchemaRule = {
  name: "date",
  defaultErrorMessage: "The :input must be a valid date",
  async validate(value: any, context) {
    if (value instanceof Date && !isNaN(value.getTime())) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * Min date rule - date must be >= given date or field
 * Smart detection: date value or field name
 */
export const minDateRule: SchemaRule<{
  dateOrField: Date | string | number;
  scope?: "global" | "sibling";
}> = {
  name: "minDate",
  description: "The field must be at least the given date or field",
  defaultErrorMessage: "The :input must be at least :dateOrField",
  async validate(value: Date, context) {
    const { dateOrField, scope = "global" } = this.context.options;
    let compareDate: Date;

    if (isDateValue(dateOrField)) {
      // Value comparison
      compareDate = new Date(dateOrField);
    } else {
      // Field comparison
      const source = scope === "sibling" ? context.parent : context.allValues;
      const fieldValue = get(source, dateOrField as string);

      if (fieldValue === undefined) {
        return VALID_RULE;
      }

      compareDate = new Date(fieldValue);
    }

    const inputDate = new Date(value);

    if (inputDate >= compareDate) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};

/**
 * Max date rule - date must be <= given date or field
 * Smart detection: date value or field name
 */
export const maxDateRule: SchemaRule<{
  dateOrField: Date | string | number;
  scope?: "global" | "sibling";
}> = {
  name: "maxDate",
  defaultErrorMessage: "The :input must be at most :dateOrField",
  async validate(value: Date, context) {
    const { dateOrField, scope = "global" } = this.context.options;
    let compareDate: Date;

    if (isDateValue(dateOrField)) {
      // Value comparison
      compareDate = new Date(dateOrField);
    } else {
      // Field comparison
      const source = scope === "sibling" ? context.parent : context.allValues;
      const fieldValue = get(source, dateOrField as string);

      if (fieldValue === undefined) {
        return VALID_RULE;
      }

      compareDate = new Date(fieldValue);
    }

    const inputDate = new Date(value);

    if (inputDate <= compareDate) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};

/**
 * From today rule - date must be today or in the future
 */
export const fromTodayRule: SchemaRule = {
  name: "fromToday",
  defaultErrorMessage: "The :input must be today or in the future",
  async validate(value: Date, context) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(value);
    inputDate.setHours(0, 0, 0, 0);

    if (inputDate >= today) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};

/**
 * Before today rule - date must be before today
 */
export const beforeTodayRule: SchemaRule = {
  name: "beforeToday",
  defaultErrorMessage: "The :input must be before today",
  async validate(value: Date, context) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(value);
    inputDate.setHours(0, 0, 0, 0);

    if (inputDate < today) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};

/**
 * From hour rule - time must be from specific hour onwards
 */
export const fromHourRule: SchemaRule<{ hour: number }> = {
  name: "fromHour",
  defaultErrorMessage: "The :input must be from :hour:00 onwards",
  async validate(value: Date, context) {
    const inputDate = new Date(value);
    const hour = inputDate.getHours();

    if (hour >= this.context.options.hour) {
      return VALID_RULE;
    }

    this.context.translationParams.hour = this.context.options.hour;
    return invalidRule(this, context);
  },
};

/**
 * Before hour rule - time must be before specific hour
 */
export const beforeHourRule: SchemaRule<{ hour: number }> = {
  name: "beforeHour",
  defaultErrorMessage: "The :input must be before :hour:00",
  async validate(value: Date, context) {
    const inputDate = new Date(value);
    const hour = inputDate.getHours();

    if (hour < this.context.options.hour) {
      return VALID_RULE;
    }

    this.context.translationParams.hour = this.context.options.hour;
    return invalidRule(this, context);
  },
};

/**
 * Between hours rule - time must be between start and end hours
 */
export const betweenHoursRule: SchemaRule<{
  startHour: number;
  endHour: number;
}> = {
  name: "betweenHours",
  defaultErrorMessage: "The :input must be between :startHour:00 and :endHour:00",
  async validate(value: Date, context) {
    const inputDate = new Date(value);
    const hour = inputDate.getHours();
    const { startHour, endHour } = this.context.options;

    if (hour >= startHour && hour <= endHour) {
      return VALID_RULE;
    }

    this.context.translationParams.startHour = startHour;
    this.context.translationParams.endHour = endHour;
    return invalidRule(this, context);
  },
};

/**
 * From minute rule - time must be from specific minute onwards
 */
export const fromMinuteRule: SchemaRule<{ minute: number }> = {
  name: "fromMinute",
  defaultErrorMessage: "The :input must be from minute :minute onwards",
  async validate(value: Date, context) {
    const inputDate = new Date(value);
    const minute = inputDate.getMinutes();

    if (minute >= this.context.options.minute) {
      return VALID_RULE;
    }

    this.context.translationParams.minute = this.context.options.minute;

    return invalidRule(this, context);
  },
};

/**
 * Before minute rule - time must be before specific minute
 */
export const beforeMinuteRule: SchemaRule<{ minute: number }> = {
  name: "beforeMinute",
  defaultErrorMessage: "The :input must be before minute :minute",
  async validate(value: Date, context) {
    const inputDate = new Date(value);
    const minute = inputDate.getMinutes();

    if (minute < this.context.options.minute) {
      return VALID_RULE;
    }

    this.context.translationParams.minute = this.context.options.minute;

    return invalidRule(this, context);
  },
};

/**
 * Between minutes rule - time must be between start and end minutes
 */
export const betweenMinutesRule: SchemaRule<{
  startMinute: number;
  endMinute: number;
}> = {
  name: "betweenMinutes",
  defaultErrorMessage: "The :input must be between minute :startMinute and :endMinute",
  async validate(value: Date, context) {
    const inputDate = new Date(value);
    const minute = inputDate.getMinutes();
    const { startMinute, endMinute } = this.context.options;

    if (minute >= startMinute && minute <= endMinute) {
      return VALID_RULE;
    }

    this.context.translationParams.startMinute = startMinute;
    this.context.translationParams.endMinute = endMinute;

    return invalidRule(this, context);
  },
};

/**
 * Age rule - calculate age from date
 */
export const ageRule: SchemaRule<{ years: number }> = {
  name: "age",
  defaultErrorMessage: "The :input must be exactly :years years old",
  async validate(value: Date, context) {
    const birthDate = new Date(value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age === this.context.options.years) {
      return VALID_RULE;
    }

    this.context.translationParams.years = this.context.options.years;

    return invalidRule(this, context);
  },
};

/**
 * Min age rule - minimum age requirement
 */
export const minAgeRule: SchemaRule<{ years: number }> = {
  name: "minAge",
  defaultErrorMessage: "The :input must be at least :years years old",
  async validate(value: Date, context) {
    const birthDate = new Date(value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age >= this.context.options.years) {
      return VALID_RULE;
    }

    this.context.translationParams.years = this.context.options.years;

    return invalidRule(this, context);
  },
};

/**
 * Max age rule - maximum age requirement
 */
export const maxAgeRule: SchemaRule<{ years: number }> = {
  name: "maxAge",
  defaultErrorMessage: "The :input must be at most :years years old",
  async validate(value: Date, context) {
    const birthDate = new Date(value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age <= this.context.options.years) {
      return VALID_RULE;
    }

    this.context.translationParams.years = this.context.options.years;

    return invalidRule(this, context);
  },
};

/**
 * Week day rule - date must be specific weekday
 */
export const weekDayRule: SchemaRule<{ day: WeekDay }> = {
  name: "weekDay",
  defaultErrorMessage: "The :input must be a :day",
  async validate(value: Date, context) {
    const inputDate = new Date(value);
    const dayOfWeek = inputDate.getDay();
    const expectedDay = WEEK_DAYS[this.context.options.day];

    if (dayOfWeek === expectedDay) {
      return VALID_RULE;
    }

    this.context.translatableParams.day = this.context.options.day;

    return invalidRule(this, context);
  },
};
