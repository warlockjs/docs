import { describe, expect, it } from "vitest";
import { validate } from "../../../src/factory/validate";
import { v } from "../../../src/factory/validators";
import {
  betweenLengthRule,
  lengthRule,
  maxLengthRule,
  maxWordsRule,
  minLengthRule,
  minWordsRule,
  wordsRule,
} from "../../../src/rules/length/length-rules";

describe("Length Rules", () => {
  describe("Character Length", () => {
    it("minLength", async () => {
      const validator = v.any();
      const rule = validator.addRule(minLengthRule);
      rule.context.options.minLength = 5;

      expect((await validate(validator, "hello")).isValid).toBe(true);
      expect((await validate(validator, "hello world")).isValid).toBe(true);
      expect((await validate(validator, [1, 2, 3, 4, 5])).isValid).toBe(true);

      expect((await validate(validator, "hi")).isValid).toBe(false);
      expect((await validate(validator, "test")).isValid).toBe(false);
      expect((await validate(validator, [1, 2])).isValid).toBe(false);
    });

    it("maxLength", async () => {
      const validator = v.any();
      const rule = validator.addRule(maxLengthRule);
      rule.context.options.maxLength = 10;

      expect((await validate(validator, "hello")).isValid).toBe(true);
      expect((await validate(validator, "1234567890")).isValid).toBe(true);
      expect((await validate(validator, [1, 2, 3])).isValid).toBe(true);

      expect((await validate(validator, "hello world")).isValid).toBe(false);
      expect((await validate(validator, "12345678901")).isValid).toBe(false);
      expect((await validate(validator, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])).isValid).toBe(false);
    });

    it("betweenLength", async () => {
      const validator = v.any();
      const rule = validator.addRule(betweenLengthRule);
      rule.context.options.minLength = 5;
      rule.context.options.maxLength = 10;

      expect((await validate(validator, "hello")).isValid).toBe(true);
      expect((await validate(validator, "1234567890")).isValid).toBe(true);
      expect((await validate(validator, "testing")).isValid).toBe(true);

      expect((await validate(validator, "hi")).isValid).toBe(false);
      expect((await validate(validator, "hello world")).isValid).toBe(false);
    });

    it("length (exact)", async () => {
      const validator = v.any();
      const rule = validator.addRule(lengthRule);
      rule.context.options.length = 5;

      expect((await validate(validator, "hello")).isValid).toBe(true);
      expect((await validate(validator, "12345")).isValid).toBe(true);
      expect((await validate(validator, [1, 2, 3, 4, 5])).isValid).toBe(true);

      expect((await validate(validator, "hi")).isValid).toBe(false);
      expect((await validate(validator, "hello world")).isValid).toBe(false);
      expect((await validate(validator, [1, 2])).isValid).toBe(false);
    });
  });

  describe("Word Count", () => {
    it("minWords", async () => {
      const validator = v.any();
      const rule = validator.addRule(minWordsRule);
      rule.context.options.minWords = 3;

      expect((await validate(validator, "one two three")).isValid).toBe(true);
      expect((await validate(validator, "one two three four")).isValid).toBe(true);

      expect((await validate(validator, "one two")).isValid).toBe(false);
      expect((await validate(validator, "one")).isValid).toBe(false);
    });

    it("maxWords", async () => {
      const validator = v.any();
      const rule = validator.addRule(maxWordsRule);
      rule.context.options.maxWords = 3;

      expect((await validate(validator, "one two three")).isValid).toBe(true);
      expect((await validate(validator, "one two")).isValid).toBe(true);
      expect((await validate(validator, "one")).isValid).toBe(true);

      expect((await validate(validator, "one two three four")).isValid).toBe(false);
    });

    it("words (exact)", async () => {
      const validator = v.any();
      const rule = validator.addRule(wordsRule);
      rule.context.options.words = 3;

      expect((await validate(validator, "one two three")).isValid).toBe(true);

      expect((await validate(validator, "one two")).isValid).toBe(false);
      expect((await validate(validator, "one two three four")).isValid).toBe(false);
    });
  });
});
