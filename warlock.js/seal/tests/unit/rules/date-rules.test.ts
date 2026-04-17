import { describe, expect, it } from "vitest";
import { validate } from "../../../src/factory/validate";
import { v } from "../../../src/factory/validators";
import {
  forbiddenIfEmptyRule,
  forbiddenIfNotEmptyRule,
} from "../../../src/rules/conditional/forbidden-if-rules";
import {
  presentIfEmptyRule,
  presentIfNotEmptyRule,
  presentIfRule,
} from "../../../src/rules/conditional/present-if-rules";
import {
  requiredIfEmptyRule,
  requiredIfNotEmptyRule,
  requiredIfRule,
} from "../../../src/rules/conditional/required-if-rules";
import {
  afterTodayRule,
  betweenDatesRule,
  futureRule,
  pastRule,
  todayRule,
} from "../../../src/rules/date/date-comparison-rules";
import {
  businessDayRule,
  weekdayRule,
  weekdaysRule,
  weekendRule,
} from "../../../src/rules/date/date-day-rules";
import {
  afterFieldRule,
  beforeFieldRule,
  sameAsFieldDateRule,
} from "../../../src/rules/date/date-field-comparison-rules";
import {
  withinDaysRule,
  withinFutureDaysRule,
  withinPastDaysRule,
} from "../../../src/rules/date/date-relative-rules";

describe("Date Rules", () => {
  describe("Comparison Rules", () => {
    it("betweenDates", async () => {
      const start = new Date("2023-01-01");
      const end = new Date("2023-01-31");
      const validator = v.any();
      const rule = validator.addRule(betweenDatesRule);
      rule.context.options.startDate = start;
      rule.context.options.endDate = end;

      expect((await validate(validator, "2023-01-15")).isValid).toBe(true);
      expect((await validate(validator, "2023-01-01")).isValid).toBe(true);
      expect((await validate(validator, "2023-01-31")).isValid).toBe(true);
      expect((await validate(validator, "2023-02-01")).isValid).toBe(false);
      expect((await validate(validator, "2022-12-31")).isValid).toBe(false);
    });

    it("today", async () => {
      const validator = v.any();
      validator.addRule(todayRule);

      const today = new Date();
      expect((await validate(validator, today)).isValid).toBe(true);

      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      expect((await validate(validator, tomorrow)).isValid).toBe(false);

      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      expect((await validate(validator, yesterday)).isValid).toBe(false);
    });

    it("past", async () => {
      const validator = v.any();
      validator.addRule(pastRule);

      const past = new Date();
      past.setDate(past.getDate() - 1);
      expect((await validate(validator, past)).isValid).toBe(true);

      const future = new Date();
      future.setMinutes(future.getMinutes() + 10);
      expect((await validate(validator, future)).isValid).toBe(false);
    });

    it("future", async () => {
      const validator = v.any();
      validator.addRule(futureRule);

      const future = new Date();
      future.setMinutes(future.getMinutes() + 10);
      expect((await validate(validator, future)).isValid).toBe(true);

      const past = new Date();
      past.setDate(past.getDate() - 1);
      expect((await validate(validator, past)).isValid).toBe(false);
    });

    it("afterToday", async () => {
      const validator = v.any();
      validator.addRule(afterTodayRule);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect((await validate(validator, tomorrow)).isValid).toBe(true);

      const today = new Date();
      expect((await validate(validator, today)).isValid).toBe(false);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect((await validate(validator, yesterday)).isValid).toBe(false);
    });
  });

  describe("Relative Rules", () => {
    it("withinDays", async () => {
      const validator = v.any();
      const rule = validator.addRule(withinDaysRule);
      rule.context.options.days = 5;

      const now = new Date();
      const validDate = new Date();
      validDate.setDate(now.getDate() + 3);
      expect((await validate(validator, validDate)).isValid).toBe(true);

      const validPastDate = new Date();
      validPastDate.setDate(now.getDate() - 3);
      expect((await validate(validator, validPastDate)).isValid).toBe(true);

      const invalidDate = new Date();
      invalidDate.setDate(now.getDate() + 10);
      expect((await validate(validator, invalidDate)).isValid).toBe(false);
    });

    it("withinPastDays", async () => {
      const validator = v.any();
      const rule = validator.addRule(withinPastDaysRule);
      rule.context.options.days = 5;

      const now = new Date();
      const validDate = new Date();
      validDate.setDate(now.getDate() - 3);
      expect((await validate(validator, validDate)).isValid).toBe(true);

      const futureDate = new Date();
      futureDate.setDate(now.getDate() + 1);
      expect((await validate(validator, futureDate)).isValid).toBe(false);

      const invalidPastDate = new Date();
      invalidPastDate.setDate(now.getDate() - 10);
      expect((await validate(validator, invalidPastDate)).isValid).toBe(false);
    });

    it("withinFutureDays", async () => {
      const validator = v.any();
      const rule = validator.addRule(withinFutureDaysRule);
      rule.context.options.days = 5;

      const now = new Date();
      const validDate = new Date();
      validDate.setDate(now.getDate() + 3);
      expect((await validate(validator, validDate)).isValid).toBe(true);

      const pastDate = new Date();
      pastDate.setDate(now.getDate() - 1);
      expect((await validate(validator, pastDate)).isValid).toBe(false);

      const invalidFutureDate = new Date();
      invalidFutureDate.setDate(now.getDate() + 10);
      expect((await validate(validator, invalidFutureDate)).isValid).toBe(false);
    });
  });

  describe("Day Rules", () => {
    it("weekend", async () => {
      const validator = v.any();
      validator.addRule(weekendRule);

      // Sat Jan 07 2023
      expect((await validate(validator, "2023-01-07")).isValid).toBe(true);
      // Sun Jan 08 2023
      expect((await validate(validator, "2023-01-08")).isValid).toBe(true);
      // Mon Jan 09 2023
      expect((await validate(validator, "2023-01-09")).isValid).toBe(false);
    });

    it("weekday / businessDay", async () => {
      const validator = v.any();
      validator.addRule(weekdayRule);
      const bizValidator = v.any();
      bizValidator.addRule(businessDayRule);

      // Sat Jan 07 2023
      expect((await validate(validator, "2023-01-07")).isValid).toBe(false);
      expect((await validate(bizValidator, "2023-01-07")).isValid).toBe(false);
      // Mon Jan 09 2023
      expect((await validate(validator, "2023-01-09")).isValid).toBe(true);
      expect((await validate(bizValidator, "2023-01-09")).isValid).toBe(true);
    });

    it("weekdays", async () => {
      const validator = v.any();
      const rule = validator.addRule(weekdaysRule);
      rule.context.options.days = ["sunday", "monday"]; // Sunday, Monday

      // Sun Jan 08 2023
      expect((await validate(validator, "2023-01-08")).isValid).toBe(true);
      // Mon Jan 09 2023
      expect((await validate(validator, "2023-01-09")).isValid).toBe(true);
      // Tue Jan 10 2023
      expect((await validate(validator, "2023-01-10")).isValid).toBe(false);
    });
  });

  describe("Field Comparison Rules", () => {
    it("beforeField", async () => {
      const validator = v.object({
        start: v.any(), // should be a date
        end: v.any(),
      });

      const rule = validator.schema.start.addRule(beforeFieldRule);
      rule.context.options.dateOrField = "end";
      rule.context.options.scope = "sibling";

      expect((await validate(validator, { start: "2023-01-01", end: "2023-01-02" })).isValid).toBe(
        true,
      );
      expect((await validate(validator, { start: "2023-01-02", end: "2023-01-01" })).isValid).toBe(
        false,
      );
    });

    it("afterField", async () => {
      const validator = v.object({
        start: v.any(),
        end: v.any(),
      });

      const rule = validator.schema.end.addRule(afterFieldRule);
      rule.context.options.dateOrField = "start";
      rule.context.options.scope = "sibling";

      expect((await validate(validator, { start: "2023-01-01", end: "2023-01-02" })).isValid).toBe(
        true,
      );
      expect((await validate(validator, { start: "2023-01-02", end: "2023-01-01" })).isValid).toBe(
        false,
      );
    });

    it("sameAsFieldDate", async () => {
      const validator = v.object({
        d1: v.any(),
        d2: v.any(),
      });
      const rule = validator.schema.d2.addRule(sameAsFieldDateRule);
      rule.context.options.field = "d1";
      rule.context.options.scope = "sibling";

      expect((await validate(validator, { d1: "2023-01-01", d2: "2023-01-01" })).isValid).toBe(
        true,
      );
      expect((await validate(validator, { d1: "2023-01-01", d2: "2023-01-02" })).isValid).toBe(
        false,
      );
    });
  });

  describe("Conditional If Variants", () => {
    it("presentIf", async () => {
      const validator = v.object({
        type: v.string(),
        metadata: v.string().optional(),
      });

      const rule = validator.schema.metadata.addRule(presentIfRule);
      rule.context.options.field = "type";
      rule.context.options.value = "advanced";
      rule.context.options.scope = "sibling";

      expect((await validate(validator, { type: "advanced", metadata: "data" })).isValid).toBe(
        true,
      );
      expect((await validate(validator, { type: "basic" })).isValid).toBe(true);
      expect((await validate(validator, { type: "advanced" })).isValid).toBe(false);
    });

    it("presentIfEmpty", async () => {
      const validator = v.object({
        primary: v.string().optional(),
        fallback: v.string().optional(),
      });

      const rule = validator.schema.fallback.addRule(presentIfEmptyRule);
      rule.context.options.field = "primary";
      rule.context.options.scope = "sibling";

      expect((await validate(validator, { fallback: "backup" })).isValid).toBe(true);
      expect((await validate(validator, { primary: "main" })).isValid).toBe(true);
      expect((await validate(validator, { primary: "" })).isValid).toBe(false);
    });

    it("presentIfNotEmpty", async () => {
      const validator = v.object({
        email: v.string().optional(),
        emailConfirm: v.string().optional(),
      });

      const rule = validator.schema.emailConfirm.addRule(presentIfNotEmptyRule);
      rule.context.options.field = "email";
      rule.context.options.scope = "sibling";

      expect(
        (await validate(validator, { email: "test@example.com", emailConfirm: "test@example.com" }))
          .isValid,
      ).toBe(true);
      expect((await validate(validator, {})).isValid).toBe(true);
      expect((await validate(validator, { email: "test@example.com" })).isValid).toBe(false);
    });

    it("requiredIf", async () => {
      const validator = v.object({
        shipping: v.string(),
        address: v.string().optional(),
      });

      const rule = validator.schema.address.addRule(requiredIfRule);
      rule.context.options.field = "shipping";
      rule.context.options.value = "delivery";
      rule.context.options.scope = "sibling";

      expect(
        (await validate(validator, { shipping: "delivery", address: "123 Main St" })).isValid,
      ).toBe(true);
      expect((await validate(validator, { shipping: "pickup" })).isValid).toBe(true);
      expect((await validate(validator, { shipping: "delivery", address: "" })).isValid).toBe(
        false,
      );
    });

    it("requiredIfEmpty", async () => {
      const validator = v.object({
        username: v.string().optional(),
        email: v.string().optional(),
      });

      const rule = validator.schema.email.addRule(requiredIfEmptyRule);
      rule.context.options.field = "username";
      rule.context.options.scope = "sibling";

      expect((await validate(validator, { email: "test@example.com" })).isValid).toBe(true);
      expect((await validate(validator, { username: "john" })).isValid).toBe(true);
      expect((await validate(validator, { username: "" })).isValid).toBe(false);
    });

    it("requiredIfNotEmpty", async () => {
      const validator = v.object({
        phone: v.string().optional(),
        phoneCountry: v.string().optional(),
      });

      const rule = validator.schema.phoneCountry.addRule(requiredIfNotEmptyRule);
      rule.context.options.field = "phone";
      rule.context.options.scope = "sibling";

      expect((await validate(validator, { phone: "1234567890", phoneCountry: "US" })).isValid).toBe(
        true,
      );
      expect((await validate(validator, {})).isValid).toBe(true);
      expect((await validate(validator, { phone: "1234567890" })).isValid).toBe(false);
    });

    it("forbiddenIfEmpty", async () => {
      const validator = v.object({
        primary: v.string().optional(),
        secondary: v.string().optional(),
      });

      const rule = validator.schema.secondary.addRule(forbiddenIfEmptyRule);
      rule.context.options.field = "primary";
      rule.context.options.scope = "sibling";

      expect((await validate(validator, { primary: "main" })).isValid).toBe(true);
      expect((await validate(validator, { primary: "main", secondary: "backup" })).isValid).toBe(
        true,
      );
      expect((await validate(validator, { secondary: "backup" })).isValid).toBe(false);
    });

    it("forbiddenIfNotEmpty", async () => {
      const validator = v.object({
        autoGenerate: v.string().optional(),
        manualValue: v.string().optional(),
      });

      const rule = validator.schema.manualValue.addRule(forbiddenIfNotEmptyRule);
      rule.context.options.field = "autoGenerate";
      rule.context.options.scope = "sibling";

      expect((await validate(validator, {})).isValid).toBe(true);
      expect((await validate(validator, { manualValue: "custom" })).isValid).toBe(true);
      expect(
        (await validate(validator, { autoGenerate: "auto", manualValue: "custom" })).isValid,
      ).toBe(false);
    });
  });
});
