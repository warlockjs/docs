import { get } from "@mongez/reinforcements";
import { invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

const MONTHS = {
  1: "january",
  2: "february",
  3: "march",
  4: "april",
  5: "may",
  6: "june",
  7: "july",
  8: "august",
  9: "september",
  10: "october",
  11: "november",
  12: "december",
};

export type Month = keyof typeof MONTHS;

/**
 * Month rule - date must be in specific month (1-12)
 */
export const monthRule: SchemaRule<{ month: Month }> = {
  name: "month",
  defaultErrorMessage: "The :input must be in month :month",
  async validate(value: Date, context) {
    const inputDate = new Date(value);
    const month = inputDate.getMonth() + 1; // getMonth() returns 0-11

    if (month === this.context.options.month) {
      return VALID_RULE;
    }

    this.context.translatableParams.month =
      MONTHS[this.context.options.month as keyof typeof MONTHS];
    return invalidRule(this, context);
  },
};

/**
 * Year rule - date must be in specific year
 */
export const yearRule: SchemaRule<{ year: number }> = {
  name: "year",
  defaultErrorMessage: "The :input must be in year :year",
  async validate(value: Date, context) {
    const inputDate = new Date(value);
    const year = inputDate.getFullYear();

    if (year === this.context.options.year) {
      return VALID_RULE;
    }

    this.context.translationParams.year = this.context.options.year;
    return invalidRule(this, context);
  },
};

/**
 * Between years rule - date must be between start and end years
 * Supports field names with sibling scope
 */
export const betweenYearsRule: SchemaRule<{
  startYear: number | string;
  endYear: number | string;
  scope?: "global" | "sibling";
}> = {
  name: "betweenYears",
  defaultErrorMessage: "The :input must be between :startYear and :endYear",
  async validate(value: Date, context) {
    const { startYear, endYear, scope = "global" } = this.context.options;
    const inputDate = new Date(value);
    const inputYear = inputDate.getFullYear();

    // Extract start year
    let compareStartYear: number;
    if (typeof startYear === "number") {
      compareStartYear = startYear;
    } else {
      const source = scope === "sibling" ? context.parent : context.allValues;
      const fieldValue = get(source, startYear);

      if (fieldValue === undefined) {
        return VALID_RULE;
      }

      if (fieldValue instanceof Date) {
        compareStartYear = fieldValue.getFullYear();
      } else if (typeof fieldValue === "number") {
        compareStartYear = fieldValue;
      } else {
        const date = new Date(fieldValue);
        if (!isNaN(date.getTime())) {
          compareStartYear = date.getFullYear();
        } else {
          return VALID_RULE;
        }
      }
    }

    // Extract end year
    let compareEndYear: number;
    if (typeof endYear === "number") {
      compareEndYear = endYear;
    } else {
      const source = scope === "sibling" ? context.parent : context.allValues;
      const fieldValue = get(source, endYear);

      if (fieldValue === undefined) {
        return VALID_RULE;
      }

      if (fieldValue instanceof Date) {
        compareEndYear = fieldValue.getFullYear();
      } else if (typeof fieldValue === "number") {
        compareEndYear = fieldValue;
      } else {
        const date = new Date(fieldValue);
        if (!isNaN(date.getTime())) {
          compareEndYear = date.getFullYear();
        } else {
          return VALID_RULE;
        }
      }
    }

    if (inputYear >= compareStartYear && inputYear <= compareEndYear) {
      return VALID_RULE;
    }

    this.context.translationParams.startYear = compareStartYear;
    this.context.translationParams.endYear = compareEndYear;
    return invalidRule(this, context);
  },
};

/**
 * Between months rule - date must be between start and end months (1-12)
 * Supports field names with sibling scope
 */
export const betweenMonthsRule: SchemaRule<{
  startMonth: Month | string;
  endMonth: Month | string;
  scope?: "global" | "sibling";
}> = {
  name: "betweenMonths",
  defaultErrorMessage: "The :input must be between month :startMonth and :endMonth",
  async validate(value: Date, context) {
    const { startMonth, endMonth, scope = "global" } = this.context.options;
    const inputDate = new Date(value);
    const inputMonth = inputDate.getMonth() + 1; // getMonth() returns 0-11

    // Extract start month
    let compareStartMonth: number;
    if (typeof startMonth === "number") {
      compareStartMonth = startMonth;
      this.context.translatableParams.startMonth = MONTHS[compareStartMonth as keyof typeof MONTHS];
    } else {
      const source = scope === "sibling" ? context.parent : context.allValues;
      const fieldValue = get(source, startMonth);

      if (fieldValue === undefined) {
        return VALID_RULE;
      }

      this.context.translatableParams.startMonth = startMonth;

      if (fieldValue instanceof Date) {
        compareStartMonth = fieldValue.getMonth() + 1;
      } else if (typeof fieldValue === "number") {
        compareStartMonth = fieldValue;
      } else {
        const date = new Date(fieldValue);
        if (!isNaN(date.getTime())) {
          compareStartMonth = date.getMonth() + 1;
        } else {
          return VALID_RULE;
        }
      }
    }

    // Extract end month
    let compareEndMonth: number;
    if (typeof endMonth === "number") {
      compareEndMonth = endMonth;
      this.context.translatableParams.endMonth = MONTHS[compareEndMonth as keyof typeof MONTHS];
    } else {
      const source = scope === "sibling" ? context.parent : context.allValues;
      const fieldValue = get(source, endMonth);

      if (fieldValue === undefined) {
        return VALID_RULE;
      }

      this.context.translatableParams.endMonth = endMonth;

      if (fieldValue instanceof Date) {
        compareEndMonth = fieldValue.getMonth() + 1;
      } else if (typeof fieldValue === "number") {
        compareEndMonth = fieldValue;
      } else {
        const date = new Date(fieldValue);
        if (!isNaN(date.getTime())) {
          compareEndMonth = date.getMonth() + 1;
        } else {
          return VALID_RULE;
        }
      }
    }

    if (inputMonth >= compareStartMonth && inputMonth <= compareEndMonth) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * Between days rule - date must be between start and end days (1-31)
 * Supports field names with sibling scope
 */
export const betweenDaysRule: SchemaRule<{
  startDay: number | string;
  endDay: number | string;
  scope?: "global" | "sibling";
}> = {
  name: "betweenDays",
  defaultErrorMessage: "The :input must be between day :startDay and :endDay",
  async validate(value: Date, context) {
    const { startDay, endDay, scope = "global" } = this.context.options;
    const inputDate = new Date(value);
    const inputDay = inputDate.getDate();

    // Extract start day
    let compareStartDay: number;
    if (typeof startDay === "number") {
      compareStartDay = startDay;
    } else {
      const source = scope === "sibling" ? context.parent : context.allValues;
      const fieldValue = get(source, startDay);

      if (fieldValue === undefined) {
        return VALID_RULE;
      }

      if (fieldValue instanceof Date) {
        compareStartDay = fieldValue.getDate();
      } else if (typeof fieldValue === "number") {
        compareStartDay = fieldValue;
      } else {
        const date = new Date(fieldValue);
        if (!isNaN(date.getTime())) {
          compareStartDay = date.getDate();
        } else {
          return VALID_RULE;
        }
      }
    }

    // Extract end day
    let compareEndDay: number;
    if (typeof endDay === "number") {
      compareEndDay = endDay;
    } else {
      const source = scope === "sibling" ? context.parent : context.allValues;
      const fieldValue = get(source, endDay);

      if (fieldValue === undefined) {
        return VALID_RULE;
      }

      if (fieldValue instanceof Date) {
        compareEndDay = fieldValue.getDate();
      } else if (typeof fieldValue === "number") {
        compareEndDay = fieldValue;
      } else {
        const date = new Date(fieldValue);
        if (!isNaN(date.getTime())) {
          compareEndDay = date.getDate();
        } else {
          return VALID_RULE;
        }
      }
    }

    if (inputDay >= compareStartDay && inputDay <= compareEndDay) {
      return VALID_RULE;
    }

    this.context.translationParams.startDay = compareStartDay;
    this.context.translationParams.endDay = compareEndDay;
    return invalidRule(this, context);
  },
};

/**
 * Quarter rule - date must be in specific quarter (1-4)
 */
export const quarterRule: SchemaRule<{ quarter: 1 | 2 | 3 | 4 }> = {
  name: "quarter",
  defaultErrorMessage: "The :input must be in quarter :quarter",
  async validate(value: Date, context) {
    const inputDate = new Date(value);
    const month = inputDate.getMonth() + 1;
    const quarter = Math.ceil(month / 3);

    if (quarter === this.context.options.quarter) {
      return VALID_RULE;
    }

    this.context.translationParams.quarter = this.context.options.quarter;
    return invalidRule(this, context);
  },
};

/**
 * Between times rule - time must be between start and end times (HH:MM format)
 */
export const betweenTimesRule: SchemaRule<{
  startTime: string;
  endTime: string;
}> = {
  name: "betweenTimes",
  defaultErrorMessage: "The :input must be between :startTime and :endTime",
  async validate(value: Date, context) {
    const inputDate = new Date(value);
    const inputHour = inputDate.getHours();
    const inputMinute = inputDate.getMinutes();
    const inputTimeInMinutes = inputHour * 60 + inputMinute;

    const { startTime, endTime } = this.context.options;

    // Parse start time
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const startTimeInMinutes = startHour * 60 + startMinute;

    // Parse end time
    const [endHour, endMinute] = endTime.split(":").map(Number);
    const endTimeInMinutes = endHour * 60 + endMinute;

    if (inputTimeInMinutes >= startTimeInMinutes && inputTimeInMinutes <= endTimeInMinutes) {
      return VALID_RULE;
    }

    this.context.translationParams.startTime = startTime;
    this.context.translationParams.endTime = endTime;
    return invalidRule(this, context);
  },
};

/**
 * Min year rule - year must be >= given year or field
 * Smart detection: number or field name
 * Supports both global and sibling scope
 */
export const minYearRule: SchemaRule<{
  yearOrField: number | string;
  scope?: "global" | "sibling";
}> = {
  name: "minYear",
  description: "The date year must be at least the given year or field",
  defaultErrorMessage: "The :input year must be higher than :yearOrField",
  async validate(value: Date, context) {
    const { yearOrField, scope = "global" } = this.context.options;
    let compareYear: number;

    if (typeof yearOrField === "number") {
      compareYear = yearOrField;
      this.context.translationParams.yearOrField = yearOrField;
    } else {
      const source = scope === "sibling" ? context.parent : context.allValues;
      const fieldValue = get(source, yearOrField);

      if (fieldValue === undefined) {
        return VALID_RULE;
      }

      this.context.translatableParams.yearOrField = yearOrField;

      // If field contains a date, extract the year
      if (fieldValue instanceof Date) {
        compareYear = fieldValue.getFullYear();
      } else if (typeof fieldValue === "number") {
        compareYear = fieldValue;
      } else {
        // Try to parse as date and extract year
        const date = new Date(fieldValue);
        if (!isNaN(date.getTime())) {
          compareYear = date.getFullYear();
        } else {
          return VALID_RULE;
        }
      }
    }

    const inputDate = new Date(value);
    const inputYear = inputDate.getFullYear();

    if (inputYear >= compareYear) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * Max year rule - year must be <= given year or field
 * Smart detection: number or field name
 * Supports both global and sibling scope
 */
export const maxYearRule: SchemaRule<{
  yearOrField: number | string;
  scope?: "global" | "sibling";
}> = {
  name: "maxYear",
  description: "The date year must be at most the given year or field",
  defaultErrorMessage: "The :input year must be at most :yearOrField",
  async validate(value: Date, context) {
    const { yearOrField, scope = "global" } = this.context.options;
    let compareYear: number;

    if (typeof yearOrField === "number") {
      compareYear = yearOrField;
      this.context.translationParams.yearOrField = compareYear;
    } else {
      const source = scope === "sibling" ? context.parent : context.allValues;
      const fieldValue = get(source, yearOrField);

      if (fieldValue === undefined) {
        return VALID_RULE;
      }

      this.context.translatableParams.yearOrField = yearOrField;

      // If field contains a date, extract the year
      if (fieldValue instanceof Date) {
        compareYear = fieldValue.getFullYear();
      } else if (typeof fieldValue === "number") {
        compareYear = fieldValue;
      } else {
        // Try to parse as date and extract year
        const date = new Date(fieldValue);
        if (!isNaN(date.getTime())) {
          compareYear = date.getFullYear();
        } else {
          return VALID_RULE;
        }
      }
    }

    const inputDate = new Date(value);
    const inputYear = inputDate.getFullYear();

    if (inputYear <= compareYear) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * Min month rule - month must be >= given month or field (1-12)
 * Smart detection: number or field name
 * Supports both global and sibling scope
 */
export const minMonthRule: SchemaRule<{
  monthOrField: number | string;
  scope?: "global" | "sibling";
}> = {
  name: "minMonth",
  description: "The date month must be at least the given month or field",
  defaultErrorMessage: "The :input month must be at least :monthOrField",
  async validate(value: Date, context) {
    const { monthOrField, scope = "global" } = this.context.options;
    let compareMonth: number;

    if (typeof monthOrField === "number") {
      compareMonth = monthOrField;
      this.context.translationParams.monthOrField = compareMonth;
    } else {
      const source = scope === "sibling" ? context.parent : context.allValues;
      const fieldValue = get(source, monthOrField);

      if (fieldValue === undefined) {
        return VALID_RULE;
      }

      this.context.translatableParams.monthOrField = monthOrField;

      // If field contains a date, extract the month
      if (fieldValue instanceof Date) {
        compareMonth = fieldValue.getMonth() + 1; // getMonth() returns 0-11
      } else if (typeof fieldValue === "number") {
        compareMonth = fieldValue;
      } else {
        // Try to parse as date and extract month
        const date = new Date(fieldValue);
        if (!isNaN(date.getTime())) {
          compareMonth = date.getMonth() + 1;
        } else {
          return VALID_RULE;
        }
      }
    }

    const inputDate = new Date(value);
    const inputMonth = inputDate.getMonth() + 1; // getMonth() returns 0-11

    if (inputMonth >= compareMonth) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};

/**
 * Max month rule - month must be <= given month or field (1-12)
 * Smart detection: number or field name
 * Supports both global and sibling scope
 */
export const maxMonthRule: SchemaRule<{
  monthOrField: Month | string;
  scope?: "global" | "sibling";
}> = {
  name: "maxMonth",
  description: "The date month must be at most the given month or field",
  defaultErrorMessage: "The :input month must be at most :monthOrField",
  async validate(value: Date, context) {
    const { monthOrField, scope = "global" } = this.context.options;
    let compareMonth: number;

    if (typeof monthOrField === "number") {
      compareMonth = monthOrField;
      this.context.translatableParams.monthOrField = MONTHS[monthOrField];
    } else {
      const source = scope === "sibling" ? context.parent : context.allValues;
      const fieldValue = get(source, monthOrField);

      if (fieldValue === undefined) {
        return VALID_RULE;
      }

      this.context.translatableParams.monthOrField = monthOrField;

      // If field contains a date, extract the month
      if (fieldValue instanceof Date) {
        compareMonth = fieldValue.getMonth() + 1; // getMonth() returns 0-11
      } else if (typeof fieldValue === "number") {
        compareMonth = fieldValue;
      } else {
        // Try to parse as date and extract month
        const date = new Date(fieldValue);
        if (!isNaN(date.getTime())) {
          compareMonth = date.getMonth() + 1;
        } else {
          return VALID_RULE;
        }
      }
    }

    const inputDate = new Date(value);
    const inputMonth = inputDate.getMonth() + 1; // getMonth() returns 0-11

    if (inputMonth <= compareMonth) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * Min day rule - day must be >= given day or field (1-31)
 * Smart detection: number or field name
 * Supports both global and sibling scope
 */
export const minDayRule: SchemaRule<{
  dayOrField: number | string;
  scope?: "global" | "sibling";
}> = {
  name: "minDay",
  description: "The date day must be at least the given day or field",
  defaultErrorMessage: "The :input day must be higher than :dayOrField",
  async validate(value: Date, context) {
    const { dayOrField, scope = "global" } = this.context.options;
    let compareDay: number;

    if (typeof dayOrField === "number") {
      compareDay = dayOrField;
      this.context.translationParams.dayOrField = dayOrField;
    } else {
      const source = scope === "sibling" ? context.parent : context.allValues;
      const fieldValue = get(source, dayOrField);

      if (fieldValue === undefined) {
        return VALID_RULE;
      }

      this.context.translatableParams.dayOrField = dayOrField;

      // If field contains a date, extract the day
      if (fieldValue instanceof Date) {
        compareDay = fieldValue.getDate();
      } else if (typeof fieldValue === "number") {
        compareDay = fieldValue;
      } else {
        // Try to parse as date and extract day
        const date = new Date(fieldValue);
        if (!isNaN(date.getTime())) {
          compareDay = date.getDate();
        } else {
          return VALID_RULE;
        }
      }
    }

    const inputDate = new Date(value);
    const inputDay = inputDate.getDate();

    if (inputDay >= compareDay) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};

/**
 * Max day rule - day must be <= given day or field (1-31)
 * Smart detection: number or field name
 * Supports both global and sibling scope
 */
export const maxDayRule: SchemaRule<{
  dayOrField: number | string;
  scope?: "global" | "sibling";
}> = {
  name: "maxDay",
  description: "The date day must be at most the given day or field",
  defaultErrorMessage: "The :input day must be at most :dayOrField",
  async validate(value: Date, context) {
    const { dayOrField, scope = "global" } = this.context.options;
    let compareDay: number;

    if (typeof dayOrField === "number") {
      compareDay = dayOrField;
      this.context.translationParams.dayOrField = dayOrField;
    } else {
      const source = scope === "sibling" ? context.parent : context.allValues;
      const fieldValue = get(source, dayOrField);

      if (fieldValue === undefined) {
        return VALID_RULE;
      }

      this.context.translatableParams.dayOrField = dayOrField;

      // If field contains a date, extract the day
      if (fieldValue instanceof Date) {
        compareDay = fieldValue.getDate();
      } else if (typeof fieldValue === "number") {
        compareDay = fieldValue;
      } else {
        // Try to parse as date and extract day
        const date = new Date(fieldValue);
        if (!isNaN(date.getTime())) {
          compareDay = date.getDate();
        } else {
          return VALID_RULE;
        }
      }
    }

    const inputDate = new Date(value);
    const inputDay = inputDate.getDate();

    if (inputDay <= compareDay) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};
