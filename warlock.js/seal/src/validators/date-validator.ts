import dayjs from "dayjs";
import {
  addDaysMutator,
  addHoursMutator,
  addMonthsMutator,
  addYearsMutator,
  dateMutator,
  toEndOfDayMutator,
  toEndOfMonthMutator,
  toEndOfYearMutator,
  toStartOfDayMutator,
  toStartOfMonthMutator,
  toStartOfYearMutator,
  toUTCMutator,
} from "../mutators";
import {
  afterFieldRule,
  afterTodayRule,
  ageRule,
  beforeFieldRule,
  beforeHourRule,
  beforeMinuteRule,
  beforeTodayRule,
  betweenAgeRule,
  betweenDatesRule,
  betweenDaysRule,
  betweenHoursRule,
  betweenMinutesRule,
  betweenMonthsRule,
  betweenTimesRule,
  betweenYearsRule,
  birthdayRule,
  businessDayRule,
  dateRule,
  fromHourRule,
  fromMinuteRule,
  fromTodayRule,
  futureRule,
  leapYearRule,
  maxAgeRule,
  maxDateRule,
  maxDayRule,
  maxMonthRule,
  maxYearRule,
  minAgeRule,
  minDateRule,
  minDayRule,
  minMonthRule,
  minYearRule,
  Month,
  monthRule,
  pastRule,
  quarterRule,
  sameAsFieldDateRule,
  todayRule,
  weekDayRule,
  weekdaysRule,
  weekendRule,
  withinDaysRule,
  withinFutureDaysRule,
  withinPastDaysRule,
  yearRule,
} from "../rules";
import type { WeekDay } from "../types/date-types";
import { isDateValue } from "./../helpers/date-helpers";
import { BaseValidator } from "./base-validator";
import { applyNullable, getRuleOptions } from "../standard-schema/json-schema";
import type { JsonSchemaResult, JsonSchemaTarget } from "../standard-schema/json-schema";

/**
 * Date validator class
 */
export class DateValidator extends BaseValidator {
  public constructor(errorMessage?: string) {
    super();
    this.addMutableMutator(dateMutator); // Normalize to Date object first
    this.addMutableRule(dateRule, errorMessage);
  }

  /**
   * Check if value is a Date type
   */
  public matchesType(value: any): boolean {
    return isDateValue(value);
  }

  // ==================== Output Transformers ====================
  // These transform the Date after validation into different formats

  /**
   * Convert date to ISO string format
   * @category transformer
   */
  public toISOString() {
    return this.addTransformer((data) => (data instanceof Date ? data.toISOString() : data));
  }

  /** Convert date to Unix timestamp (milliseconds) */
  public toTimestamp() {
    return this.addTransformer((data) => (data instanceof Date ? data.getTime() : data));
  }

  // ==================== String Format Transformers ====================
  // These convert Date to formatted strings after validation

  /** Convert date to specific format using dayjs */
  public toFormat(format: string) {
    return this.addTransformer(
      (data, { options }) => (data instanceof Date ? dayjs(data).format(options.format) : data),
      { format },
    );
  }

  /** Convert to date only (remove time, returns YYYY-MM-DD) */
  public toDateOnly() {
    return this.addTransformer((data) =>
      data instanceof Date ? dayjs(data).format("YYYY-MM-DD") : data,
    );
  }

  /** Convert to time only (returns HH:MM:SS) */
  public toTimeOnly() {
    return this.addTransformer((data) =>
      data instanceof Date ? dayjs(data).format("HH:mm:ss") : data,
    );
  }

  // ==================== Date Mutators ====================
  // These modify the Date object before validation

  /**
   * Convert date to start of day (00:00:00)
   * @category mutator
   */
  public toStartOfDay() {
    return this.addMutator(toStartOfDayMutator);
  }

  /** Convert date to end of day (23:59:59.999) */
  public toEndOfDay() {
    return this.addMutator(toEndOfDayMutator);
  }

  /** Add or subtract days from date */
  public addDays(days: number) {
    return this.addMutator(addDaysMutator, { days });
  }

  /** Add or subtract months from date */
  public addMonths(months: number) {
    return this.addMutator(addMonthsMutator, { months });
  }

  /** Add or subtract years from date */
  public addYears(years: number) {
    return this.addMutator(addYearsMutator, { years });
  }

  /** Add or subtract hours from date */
  public addHours(hours: number) {
    return this.addMutator(addHoursMutator, { hours });
  }

  /** Convert date to UTC */
  public toUTC() {
    return this.addMutator(toUTCMutator);
  }

  // ==================== Date Range Mutators ====================

  /** Set to start of month */
  public toStartOfMonth() {
    return this.addMutator(toStartOfMonthMutator);
  }

  /** Set to end of month */
  public toEndOfMonth() {
    return this.addMutator(toEndOfMonthMutator);
  }

  /** Set to start of year */
  public toStartOfYear() {
    return this.addMutator(toStartOfYearMutator);
  }

  /** Set to end of year */
  public toEndOfYear() {
    return this.addMutator(toEndOfYearMutator);
  }

  // ==================== Date Comparison ====================

  /**
   * Date must be greater than or equal to the given date or field (inclusive)
   *
   * Smart detection:
   * - Date instance, timestamp, or date string (with - or /) → value comparison
   * - Plain string → field comparison
   *
   * @param dateOrField - Date, timestamp, date string, or field name
   *
   * @example
   * ```ts
   * // Value comparison
   * v.date().min('2024-01-01')
   * v.date().min(new Date())
   * v.date().min(1698278400000)
   *
   * // Field comparison
   * v.date().min('startsAt')
   * ```
   *
   * @category Validation Rule
   */
  public min(dateOrField: Date | string | number, errorMessage?: string): this {
    return this.addRule(minDateRule, errorMessage, {
      dateOrField,
      scope: "global",
    });
  }

  /**
   * Date must be less than or equal to the given date or field (inclusive)
   *
   * Smart detection:
   * - Date instance, timestamp, or date string (with - or /) → value comparison
   * - Plain string → field comparison
   *
   * @category Validation Rule
   */
  public max(dateOrField: Date | string | number, errorMessage?: string): this {
    return this.addRule(maxDateRule, errorMessage, {
      dateOrField,
      scope: "global",
    });
  }

  /**
   * Date must be strictly less than the given date or field (exclusive)
   *
   * Smart detection:
   * - Date instance, timestamp, or date string (with - or /) → value comparison
   * - Plain string → field comparison
   *
   * @category Validation Rule
   */
  public before(dateOrField: Date | string | number, errorMessage?: string): this {
    return this.addRule(beforeFieldRule, errorMessage, {
      dateOrField,
      scope: "global",
    });
  }

  /**
   * Date must be strictly greater than the given date or field (exclusive)
   *
   * Smart detection:
   * - Date instance, timestamp, or date string (with - or /) → value comparison
   * - Plain string → field comparison
   *
   * @category Validation Rule
   */
  public after(dateOrField: Date | string | number, errorMessage?: string): this {
    return this.addRule(afterFieldRule, errorMessage, {
      dateOrField,
      scope: "global",
    });
  }

  /** Date must be between start and end dates */
  public between(startDate: Date, endDate: Date, errorMessage?: string) {
    return this.addRule(betweenDatesRule, errorMessage, { startDate, endDate });
  }

  /** Date must be exactly today */
  public today(errorMessage?: string) {
    return this.addRule(todayRule, errorMessage);
  }

  /** Date must be today or in the future */
  public fromToday(errorMessage?: string) {
    return this.addRule(fromTodayRule, errorMessage);
  }

  /** Date must be before today */
  public beforeToday(errorMessage?: string) {
    return this.addRule(beforeTodayRule, errorMessage);
  }

  /** Date must be after today (not including today) */
  public afterToday(errorMessage?: string) {
    return this.addRule(afterTodayRule, errorMessage);
  }

  /** Date must be in the past */
  public past(errorMessage?: string) {
    return this.addRule(pastRule, errorMessage);
  }

  /** Date must be in the future */
  public future(errorMessage?: string) {
    return this.addRule(futureRule, errorMessage);
  }

  // ==================== Sibling Field Comparison ====================
  // Explicit sibling scope methods

  /**
   * Date must be >= sibling field value (inclusive)
   * @category Validation Rule
   */
  public minSibling(field: string, errorMessage?: string): this {
    return this.addRule(minDateRule, errorMessage, {
      dateOrField: field,
      scope: "sibling",
    });
  }

  /**
   * Date must be <= sibling field value (inclusive)
   * @category Validation Rule
   */
  public maxSibling(field: string, errorMessage?: string): this {
    return this.addRule(maxDateRule, errorMessage, {
      dateOrField: field,
      scope: "sibling",
    });
  }

  /**
   * Date must be < sibling field value (exclusive)
   * @category Validation Rule
   */
  public beforeSibling(field: string, errorMessage?: string): this {
    return this.addRule(beforeFieldRule, errorMessage, {
      dateOrField: field,
      scope: "sibling",
    });
  }

  /**
   * Date must be > sibling field value (exclusive)
   * @category Validation Rule
   */
  public afterSibling(field: string, errorMessage?: string): this {
    return this.addRule(afterFieldRule, errorMessage, {
      dateOrField: field,
      scope: "sibling",
    });
  }

  /** Date must be the same as another field's date */
  public sameAsField(field: string, errorMessage?: string) {
    return this.addRule(sameAsFieldDateRule, errorMessage, {
      field,
      scope: "global",
    });
  }

  /** Date must be the same as another sibling field's date */
  public sameAsFieldSibling(field: string, errorMessage?: string) {
    return this.addRule(sameAsFieldDateRule, errorMessage, {
      field,
      scope: "sibling",
    });
  }

  // ==================== Time Validation ====================

  /** Time must be from specific hour onwards (0-23) */
  public fromHour(hour: number, errorMessage?: string) {
    return this.addRule(fromHourRule, errorMessage, { hour });
  }

  /** Time must be before specific hour (0-23) */
  public beforeHour(hour: number, errorMessage?: string) {
    return this.addRule(beforeHourRule, errorMessage, { hour });
  }

  /** Time must be between start and end hours (0-23) */
  public betweenHours(startHour: number, endHour: number, errorMessage?: string) {
    return this.addRule(betweenHoursRule, errorMessage, { startHour, endHour });
  }

  /** Time must be from specific minute onwards (0-59) */
  public fromMinute(minute: number, errorMessage?: string) {
    return this.addRule(fromMinuteRule, errorMessage, { minute });
  }

  /** Time must be before specific minute (0-59) */
  public beforeMinute(minute: number, errorMessage?: string) {
    return this.addRule(beforeMinuteRule, errorMessage, { minute });
  }

  /** Time must be between start and end minutes (0-59) */
  public betweenMinutes(startMinute: number, endMinute: number, errorMessage?: string) {
    return this.addRule(betweenMinutesRule, errorMessage, {
      startMinute,
      endMinute,
    });
  }

  /** Time must be between start and end times (HH:MM format) */
  public betweenTimes(startTime: string, endTime: string, errorMessage?: string) {
    return this.addRule(betweenTimesRule, errorMessage, { startTime, endTime });
  }

  // ==================== Age Validation ====================

  /** Age must be exactly the given years */
  public age(years: number, errorMessage?: string) {
    return this.addRule(ageRule, errorMessage, { years });
  }

  /** Minimum age requirement */
  public minAge(years: number, errorMessage?: string) {
    return this.addRule(minAgeRule, errorMessage, { years });
  }

  /** Maximum age requirement */
  public maxAge(years: number, errorMessage?: string) {
    return this.addRule(maxAgeRule, errorMessage, { years });
  }

  /** Age must be between min and max years */
  public betweenAge(minAge: number, maxAge: number, errorMessage?: string) {
    return this.addRule(betweenAgeRule, errorMessage, { minAge, maxAge });
  }

  // ==================== Day Validation ====================

  /** Date must be specific weekday */
  public weekDay(day: WeekDay, errorMessage?: string) {
    return this.addRule(weekDayRule, errorMessage, { day });
  }

  /** Date must be one of specified weekdays */
  public weekdays(days: WeekDay[], errorMessage?: string) {
    return this.addRule(weekdaysRule, errorMessage, { days });
  }

  /** Date must be a weekend (Saturday or Sunday) */
  public weekend(errorMessage?: string) {
    return this.addRule(weekendRule, errorMessage);
  }

  /** Date must be a business day (Monday-Friday) */
  public businessDay(errorMessage?: string) {
    return this.addRule(businessDayRule, errorMessage);
  }

  /** Date must match specific format */
  public format(format: string, errorMessage?: string) {
    return this.addRule(dateRule, errorMessage, { format });
  }

  // ==================== Relative Date Validation ====================

  /** Date must be within X days from now (past or future) */
  public withinDays(days: number, errorMessage?: string) {
    return this.addRule(withinDaysRule, errorMessage, { days });
  }

  /** Date must be within X days in the past */
  public withinPastDays(days: number, errorMessage?: string) {
    return this.addRule(withinPastDaysRule, errorMessage, { days });
  }

  /** Date must be within X days in the future */
  public withinFutureDays(days: number, errorMessage?: string) {
    return this.addRule(withinFutureDaysRule, errorMessage, { days });
  }

  // ==================== Period Validation ====================

  /** Date must be in specific month (1-12) */
  public month(month: Month, errorMessage?: string) {
    return this.addRule(monthRule, errorMessage, { month });
  }

  /** Date must be in specific year */
  public year(year: number, errorMessage?: string) {
    return this.addRule(yearRule, errorMessage, { year });
  }

  /**
   * Date must be between start and end years
   * Smart detection: number or field name
   *
   * @category Validation Rule
   */
  public betweenYears(startYear: number | string, endYear: number | string, errorMessage?: string) {
    return this.addRule(betweenYearsRule, errorMessage, {
      startYear,
      endYear,
      scope: "global",
    });
  }

  /**
   * Date must be between start and end months (1-12)
   * Smart detection: number or field name
   *
   * @category Validation Rule
   */
  public betweenMonths(
    startMonth: Month | string,
    endMonth: Month | string,
    errorMessage?: string,
  ) {
    return this.addRule(betweenMonthsRule, errorMessage, {
      startMonth,
      endMonth,
      scope: "global",
    });
  }

  /**
   * Date must be between start and end days (1-31)
   * Smart detection: number or field name
   *
   * @category Validation Rule
   */
  public betweenDays(startDay: number | string, endDay: number | string, errorMessage?: string) {
    return this.addRule(betweenDaysRule, errorMessage, {
      startDay,
      endDay,
      scope: "global",
    });
  }

  /**
   * Date must be between sibling field years
   * @category Validation Rule
   */
  public betweenYearsSibling(startYearField: string, endYearField: string, errorMessage?: string) {
    return this.addRule(betweenYearsRule, errorMessage, {
      startYear: startYearField,
      endYear: endYearField,
      scope: "sibling",
    });
  }

  /**
   * Date must be between sibling field months
   * @category Validation Rule
   */
  public betweenMonthsSibling(
    startMonthField: string,
    endMonthField: string,
    errorMessage?: string,
  ) {
    return this.addRule(betweenMonthsRule, errorMessage, {
      startMonth: startMonthField,
      endMonth: endMonthField,
      scope: "sibling",
    });
  }

  /**
   * Date must be between sibling field days
   * @category Validation Rule
   */
  public betweenDaysSibling(startDayField: string, endDayField: string, errorMessage?: string) {
    return this.addRule(betweenDaysRule, errorMessage, {
      startDay: startDayField,
      endDay: endDayField,
      scope: "sibling",
    });
  }

  /**
   * Year must be >= given year or field
   * Smart detection: number or field name
   *
   * @example
   * ```ts
   * // Value comparison
   * v.date().minYear(2024)
   *
   * // Field comparison
   * v.date().minYear('startYear')
   * ```
   *
   * @category Validation Rule
   */
  public minYear(yearOrField: number | string, errorMessage?: string): this {
    return this.addRule(minYearRule, errorMessage, {
      yearOrField,
      scope: "global",
    });
  }

  /**
   * Year must be <= given year or field
   * Smart detection: number or field name
   *
   * @category Validation Rule
   */
  public maxYear(yearOrField: number | string, errorMessage?: string): this {
    return this.addRule(maxYearRule, errorMessage, {
      yearOrField,
      scope: "global",
    });
  }

  /**
   * Month must be >= given month or field (1-12)
   * Smart detection: number or field name
   *
   * @category Validation Rule
   */
  public minMonth(monthOrField: number | string, errorMessage?: string): this {
    return this.addRule(minMonthRule, errorMessage, {
      monthOrField,
      scope: "global",
    });
  }

  /**
   * Month must be <= given month or field (1-12)
   * Smart detection: number or field name
   *
   * @category Validation Rule
   */
  public maxMonth(monthOrField: Month | string, errorMessage?: string): this {
    return this.addRule(maxMonthRule, errorMessage, {
      monthOrField,
      scope: "global",
    });
  }

  /**
   * Day must be >= given day or field (1-31)
   * Smart detection: number or field name
   *
   * @category Validation Rule
   */
  public minDay(dayOrField: number | string, errorMessage?: string): this {
    return this.addRule(minDayRule, errorMessage, {
      dayOrField,
      scope: "global",
    });
  }

  /**
   * Day must be <= given day or field (1-31)
   * Smart detection: number or field name
   *
   * @category Validation Rule
   */
  public maxDay(dayOrField: number | string, errorMessage?: string): this {
    return this.addRule(maxDayRule, errorMessage, {
      dayOrField,
      scope: "global",
    });
  }

  /**
   * Year must be >= sibling field year
   * @category Validation Rule
   */
  public minYearSibling(field: string, errorMessage?: string): this {
    return this.addRule(minYearRule, errorMessage, {
      yearOrField: field,
      scope: "sibling",
    });
  }

  /**
   * Year must be <= sibling field year
   * @category Validation Rule
   */
  public maxYearSibling(field: string, errorMessage?: string): this {
    return this.addRule(maxYearRule, errorMessage, {
      yearOrField: field,
      scope: "sibling",
    });
  }

  /**
   * Month must be >= sibling field month
   * @category Validation Rule
   */
  public minMonthSibling(field: string, errorMessage?: string): this {
    return this.addRule(minMonthRule, errorMessage, {
      monthOrField: field,
      scope: "sibling",
    });
  }

  /**
   * Month must be <= sibling field month
   * @category Validation Rule
   */
  public maxMonthSibling(field: string, errorMessage?: string): this {
    return this.addRule(maxMonthRule, errorMessage, {
      monthOrField: field,
      scope: "sibling",
    });
  }

  /**
   * Day must be >= sibling field day
   * @category Validation Rule
   */
  public minDaySibling(field: string, errorMessage?: string): this {
    return this.addRule(minDayRule, errorMessage, {
      dayOrField: field,
      scope: "sibling",
    });
  }

  /**
   * Day must be <= sibling field day
   * @category Validation Rule
   */
  public maxDaySibling(field: string, errorMessage?: string): this {
    return this.addRule(maxDayRule, errorMessage, {
      dayOrField: field,
      scope: "sibling",
    });
  }

  /** Date must be in specific quarter (1-4) */
  public quarter(quarter: 1 | 2 | 3 | 4, errorMessage?: string) {
    return this.addRule(quarterRule, errorMessage, { quarter });
  }

  // ==================== Special Validation ====================

  /** Valid birthday (not in future, reasonable age) */
  public birthday(minAge?: number, maxAge?: number, errorMessage?: string) {
    return this.addRule(birthdayRule, errorMessage, { minAge, maxAge });
  }

  /** Date must be in a leap year */
  public leapYear(errorMessage?: string) {
    return this.addRule(leapYearRule, errorMessage);
  }

  /**
   * Set default value as current time of exeuction
   */
  public defaultNow() {
    return this.default(() => new Date());
  }

  /**
   * @inheritdoc
   *
   * Maps DateValidator to JSON Schema format keywords.
   * Default is `date-time`. If `.toDateOnly()` or `.toTimeOnly()` are used,
   * falls back to `date` or `time` formats respectively.
   *
   * @example
   * ```ts
   * v.date().toJsonSchema("draft-2020-12")
   * // → { type: "string", format: "date-time" }
   *
   * v.date().toDateOnly().toJsonSchema("draft-2020-12")
   * // → { type: "string", format: "date" }
   * ```
   */
  public override toJsonSchema(target: JsonSchemaTarget = "draft-2020-12"): JsonSchemaResult {
    const schema: JsonSchemaResult = { type: "string", format: "date-time" };

    // Check if an explicit format rule was applied via v.date().format()
    const dateOpts = getRuleOptions(this.rules, "date");
    if (dateOpts?.format === "YYYY-MM-DD") {
      schema.format = "date";
    } else if (dateOpts?.format === "HH:mm:ss") {
      schema.format = "time";
    }

    // As a fallback, check if transformers (like toDateOnly) stringify to known patterns
    if (schema.format === "date-time") {
      const hasToDateOnly = this.dataTransformers.some((t: any) => t.toString().includes("YYYY-MM-DD"));
      if (hasToDateOnly) schema.format = "date";
      
      const hasToTimeOnly = this.dataTransformers.some((t: any) => t.toString().includes("HH:mm:ss"));
      if (hasToTimeOnly) schema.format = "time";
    }

    if (this.isNullable) applyNullable(schema, target);

    return schema;
  }
}
