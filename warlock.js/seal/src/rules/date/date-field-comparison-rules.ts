import { get } from "@mongez/reinforcements";
import { invalidRule, VALID_RULE } from "../../helpers";
import { isDateValue } from "../../helpers/date-helpers";
import type { SchemaRule } from "../../types";

/**
 * Before field rule - date must be < given date or field
 * Smart detection: date value or field name
 * Supports both global and sibling scope
 */
export const beforeFieldRule: SchemaRule<{
  dateOrField: Date | string | number;
  scope?: "global" | "sibling";
}> = {
  name: "beforeField",
  description: "The date must be before the given date or field",
  defaultErrorMessage: "The :input must be before :dateOrField",
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

    if (inputDate < compareDate) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};

/**
 * After field rule - date must be > given date or field
 * Smart detection: date value or field name
 * Supports both global and sibling scope
 */
export const afterFieldRule: SchemaRule<{
  dateOrField: Date | string | number;
  scope?: "global" | "sibling";
}> = {
  name: "afterField",
  description: "The date must be after the given date or field",
  defaultErrorMessage: "The :input must be after :dateOrField",
  async validate(value: Date, context) {
    const { dateOrField, scope = "global" } = this.context.options;
    let compareDate: Date;

    if (isDateValue(dateOrField)) {
      // Value comparison
      compareDate = new Date(dateOrField);
      this.context.translationParams.dateOrField = compareDate.toISOString();
    } else {
      // Field comparison
      const source = scope === "sibling" ? context.parent : context.allValues;
      const fieldValue = get(source, dateOrField as string);

      if (fieldValue === undefined) {
        return VALID_RULE;
      }

      compareDate = new Date(fieldValue);
      this.context.translatableParams.dateOrField = fieldValue;
    }

    const inputDate = new Date(value);

    if (inputDate > compareDate) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * Same as field rule - date must be the same as another field's date
 * Supports both global and sibling scope
 */
export const sameAsFieldDateRule: SchemaRule<{
  field: string;
  scope?: "global" | "sibling";
}> = {
  name: "sameAsFieldDate",
  description: "The date must be the same as another field's date",
  defaultErrorMessage: "The :input must be the same as :field",
  async validate(value: Date, context) {
    const { field, scope = "global" } = this.context.options;
    const source = scope === "sibling" ? context.parent : context.allValues;
    const fieldValue = get(source, field);

    // Both fields must exist to be considered "the same"
    if (fieldValue === undefined || value === undefined) {
      this.context.translatableParams.field = fieldValue;
      return invalidRule(this, context);
    }

    const inputDate = new Date(value);
    inputDate.setHours(0, 0, 0, 0);
    const compareDate = new Date(fieldValue);
    compareDate.setHours(0, 0, 0, 0);

    if (inputDate.getTime() === compareDate.getTime()) {
      return VALID_RULE;
    }

    this.context.translatableParams.field = fieldValue;
    return invalidRule(this, context);
  },
};
