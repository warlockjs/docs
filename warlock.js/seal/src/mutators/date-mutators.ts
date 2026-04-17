import dayjs from "dayjs";
import type { Mutator } from "../types";

/**
 * Convert value to Date object
 * Returns Invalid Date if value cannot be converted
 */
export const dateMutator: Mutator = async (value) => {
  // Handle null/undefined
  if (!value) {
    return;
  }

  // Already a Date object
  if (value instanceof Date) {
    return value;
  }

  // Try to convert to Date
  const date = new Date(value);

  // Return the date (valid or Invalid Date)
  // dateRule will validate and fail if invalid
  return date;
};

/** Convert date to ISO string format */
export const toISOStringMutator: Mutator = async (value) => {
  const date = new Date(value);
  return date.toISOString();
};

/** Convert date to Unix timestamp (milliseconds) */
export const toTimestampMutator: Mutator = async (value) => {
  const date = new Date(value);
  return date.getTime();
};

/** Convert date to start of day (00:00:00) */
export const toStartOfDayMutator: Mutator = async (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

/** Convert date to end of day (23:59:59.999) */
export const toEndOfDayMutator: Mutator = async (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

/** Add or subtract days from date */
export const addDaysMutator: Mutator = async (value, context) => {
  const date = new Date(value);
  const days = context?.options.days ?? 0;
  date.setDate(date.getDate() + days);
  return date;
};

/** Add or subtract months from date */
export const addMonthsMutator: Mutator = async (value, context) => {
  const date = new Date(value);
  const months = context?.options.months ?? 0;
  date.setMonth(date.getMonth() + months);
  return date;
};

/** Add or subtract years from date */
export const addYearsMutator: Mutator = async (value, context) => {
  const date = new Date(value);
  const years = context?.options.years ?? 0;
  date.setFullYear(date.getFullYear() + years);
  return date;
};

/** Add or subtract hours from date */
export const addHoursMutator: Mutator = async (value, context) => {
  const date = new Date(value);
  const hours = context?.options.hours ?? 0;
  date.setHours(date.getHours() + hours);
  return date;
};

/** Convert date to UTC */
export const toUTCMutator: Mutator = async (value) => {
  const date = new Date(value);
  return new Date(date.toUTCString());
};

/** Convert date to specific format using dayjs */
export const toFormatMutator: Mutator = async (value, context) => {
  const format = context?.options.format ?? "YYYY-MM-DD";
  return dayjs(value).format(format);
};

/** Convert to date only (remove time) */
export const toDateOnlyMutator: Mutator = async (value) => {
  const date = new Date(value);
  return date.toISOString().split("T")[0];
};

/** Convert to time only (HH:MM:SS) */
export const toTimeOnlyMutator: Mutator = async (value) => {
  const date = new Date(value);
  return date.toTimeString().split(" ")[0];
};

/** Set to start of month */
export const toStartOfMonthMutator: Mutator = async (value) => {
  const date = new Date(value);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
};

/** Set to end of month */
export const toEndOfMonthMutator: Mutator = async (value) => {
  const date = new Date(value);
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  date.setHours(23, 59, 59, 999);
  return date;
};

/** Set to start of year */
export const toStartOfYearMutator: Mutator = async (value) => {
  const date = new Date(value);
  date.setMonth(0);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
};

/** Set to end of year */
export const toEndOfYearMutator: Mutator = async (value) => {
  const date = new Date(value);
  date.setMonth(11);
  date.setDate(31);
  date.setHours(23, 59, 59, 999);
  return date;
};
