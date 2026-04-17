import { invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

/**
 * Birthday rule - valid birthday (not in future, reasonable age)
 */
export const birthdayRule: SchemaRule<{ minAge?: number; maxAge?: number }> = {
  name: "birthday",
  defaultErrorMessage: "The :input must be a valid birthday",
  async validate(birthDate: Date, context) {
    const today = new Date();

    // Must not be in the future
    if (birthDate > today) {
      return invalidRule(this, context);
    }

    // Calculate age
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Check minimum age (default: 0)
    const minAge = this.context.options.minAge ?? 0;
    if (age < minAge) {
      return invalidRule(this, context);
    }

    // Check maximum age (default: 150)
    const maxAge = this.context.options.maxAge ?? 150;
    if (age > maxAge) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

/**
 * Between age rule - age must be between min and max years
 */
export const betweenAgeRule: SchemaRule<{ minAge: number; maxAge: number }> = {
  name: "betweenAge",
  defaultErrorMessage: "Age must be between :minAge and :maxAge years",
  async validate(value: Date, context) {
    const birthDate = new Date(value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    const { minAge, maxAge } = this.context.options;

    if (age >= minAge && age <= maxAge) {
      return VALID_RULE;
    }

    this.context.translationParams.minAge = minAge;
    this.context.translationParams.maxAge = maxAge;

    return invalidRule(this, context);
  },
};

/**
 * Leap year rule - date must be in a leap year
 */
export const leapYearRule: SchemaRule = {
  name: "leapYear",
  defaultErrorMessage: "The :input must be in a leap year",
  async validate(value: Date, context) {
    const inputDate = new Date(value);
    const year = inputDate.getFullYear();

    // Leap year logic: divisible by 4, except century years unless divisible by 400
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

    if (isLeapYear) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};
