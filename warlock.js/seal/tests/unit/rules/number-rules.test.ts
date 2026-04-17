import { describe, expect, it } from "vitest";
import { validate } from "../../../src/factory/validate";
import { v } from "../../../src/factory/validators";
import {
  betweenNumbersRule,
  evenRule,
  greaterThanRule,
  lessThanRule,
  maxRule,
  minRule,
  moduloRule,
  negativeRule,
  oddRule,
  positiveRule,
} from "../../../src/rules/number/number-rules";

describe("Number Rules", () => {
  describe("Min/Max", () => {
    it("min", async () => {
      const validator = v.number().min(10);

      expect((await validate(validator, 10)).isValid).toBe(true);
      expect((await validate(validator, 15)).isValid).toBe(true);
      expect((await validate(validator, 100)).isValid).toBe(true);
      expect((await validate(validator, 9)).isValid).toBe(false);
      expect((await validate(validator, 0)).isValid).toBe(false);
    });

    it("max", async () => {
      const validator = v.number().max(10);

      expect((await validate(validator, 10)).isValid).toBe(true);
      expect((await validate(validator, 5)).isValid).toBe(true);
      expect((await validate(validator, 0)).isValid).toBe(true);
      expect((await validate(validator, 11)).isValid).toBe(false);
      expect((await validate(validator, 100)).isValid).toBe(false);
    });
  });

  describe("Comparison", () => {
    it("greaterThan", async () => {
      const validator = v.any();
      const rule = validator.addRule(greaterThanRule);
      rule.context.options.value = 10;

      expect((await validate(validator, 11)).isValid).toBe(true);
      expect((await validate(validator, 100)).isValid).toBe(true);
      expect((await validate(validator, 10)).isValid).toBe(false);
      expect((await validate(validator, 9)).isValid).toBe(false);
    });

    it("lessThan", async () => {
      const validator = v.any();
      const rule = validator.addRule(lessThanRule);
      rule.context.options.value = 10;

      expect((await validate(validator, 9)).isValid).toBe(true);
      expect((await validate(validator, 0)).isValid).toBe(true);
      expect((await validate(validator, 10)).isValid).toBe(false);
      expect((await validate(validator, 11)).isValid).toBe(false);
    });

    it("between", async () => {
      const validator = v.any();
      const rule = validator.addRule(betweenNumbersRule);
      rule.context.options.min = 10;
      rule.context.options.max = 20;

      expect((await validate(validator, 10)).isValid).toBe(true);
      expect((await validate(validator, 15)).isValid).toBe(true);
      expect((await validate(validator, 20)).isValid).toBe(true);
      expect((await validate(validator, 9)).isValid).toBe(false);
      expect((await validate(validator, 21)).isValid).toBe(false);
    });
  });

  describe("Sign", () => {
    it("positive", async () => {
      const validator = v.any();
      validator.addRule(positiveRule);

      expect((await validate(validator, 1)).isValid).toBe(true);
      expect((await validate(validator, 100)).isValid).toBe(true);
      expect((await validate(validator, 0.1)).isValid).toBe(true);
      expect((await validate(validator, 0)).isValid).toBe(false);
      expect((await validate(validator, -1)).isValid).toBe(false);
    });

    it("negative", async () => {
      const validator = v.any();
      validator.addRule(negativeRule);

      expect((await validate(validator, -1)).isValid).toBe(true);
      expect((await validate(validator, -100)).isValid).toBe(true);
      expect((await validate(validator, -0.1)).isValid).toBe(true);
      expect((await validate(validator, 0)).isValid).toBe(false);
      expect((await validate(validator, 1)).isValid).toBe(false);
    });
  });

  describe("Parity & Divisibility", () => {
    it("even", async () => {
      const validator = v.any();
      validator.addRule(evenRule);

      expect((await validate(validator, 0)).isValid).toBe(true);
      expect((await validate(validator, 2)).isValid).toBe(true);
      expect((await validate(validator, 100)).isValid).toBe(true);
      expect((await validate(validator, -4)).isValid).toBe(true);
      expect((await validate(validator, 1)).isValid).toBe(false);
      expect((await validate(validator, 3)).isValid).toBe(false);
    });

    it("odd", async () => {
      const validator = v.any();
      validator.addRule(oddRule);

      expect((await validate(validator, 1)).isValid).toBe(true);
      expect((await validate(validator, 3)).isValid).toBe(true);
      expect((await validate(validator, 99)).isValid).toBe(true);
      expect((await validate(validator, -5)).isValid).toBe(true);
      expect((await validate(validator, 0)).isValid).toBe(false);
      expect((await validate(validator, 2)).isValid).toBe(false);
    });

    it("divisibleBy", async () => {
      const validator = v.any();
      const rule = validator.addRule(moduloRule);
      rule.context.options.value = 5;

      expect((await validate(validator, 0)).isValid).toBe(true);
      expect((await validate(validator, 5)).isValid).toBe(true);
      expect((await validate(validator, 10)).isValid).toBe(true);
      expect((await validate(validator, 25)).isValid).toBe(true);
      expect((await validate(validator, 3)).isValid).toBe(false);
      expect((await validate(validator, 7)).isValid).toBe(false);
    });

    it("multipleOf", async () => {
      const validator = v.any();
      const rule = validator.addRule(moduloRule);
      rule.context.options.value = 3;

      expect((await validate(validator, 0)).isValid).toBe(true);
      expect((await validate(validator, 3)).isValid).toBe(true);
      expect((await validate(validator, 6)).isValid).toBe(true);
      expect((await validate(validator, 9)).isValid).toBe(true);
      expect((await validate(validator, 5)).isValid).toBe(false);
      expect((await validate(validator, 7)).isValid).toBe(false);
    });
  });

  describe("Field Comparison", () => {
    it("min with field reference", async () => {
      const validator = v.object({
        minValue: v.number(),
        value: v.any(),
      });

      const rule = validator.schema.value.addRule(minRule);
      rule.context.options.min = "minValue";
      rule.context.options.scope = "sibling";

      expect((await validate(validator, { minValue: 10, value: 10 })).isValid).toBe(true);
      expect((await validate(validator, { minValue: 10, value: 15 })).isValid).toBe(true);
      expect((await validate(validator, { minValue: 10, value: 5 })).isValid).toBe(false);
    });

    it("max with field reference", async () => {
      const validator = v.object({
        maxValue: v.number(),
        value: v.any(),
      });

      const rule = validator.schema.value.addRule(maxRule);
      rule.context.options.max = "maxValue";
      rule.context.options.scope = "sibling";

      expect((await validate(validator, { maxValue: 10, value: 10 })).isValid).toBe(true);
      expect((await validate(validator, { maxValue: 10, value: 5 })).isValid).toBe(true);
      expect((await validate(validator, { maxValue: 10, value: 15 })).isValid).toBe(false);
    });
  });
});
