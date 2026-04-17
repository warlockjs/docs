import { describe, expect, it } from "vitest";
import { validate } from "../../../src/factory/validate";
import { v } from "../../../src/factory/validators";
import { alphaNumericRule, alphaRule, isNumericRule } from "../../../src/rules/string/alpha";
import { patternRule } from "../../../src/rules/string/pattern";
import {
  containsRule,
  endsWithRule,
  notContainsRule,
  startsWithRule,
} from "../../../src/rules/string/string-comparison";
import { urlRule } from "../../../src/rules/string/url";
import { withoutWhitespaceRule } from "../../../src/rules/string/without-whitespace";

describe("String Rules", () => {
  describe("Email & URL", () => {
    it("email", async () => {
      const validator = v.string().email();

      expect((await validate(validator, "test@example.com")).isValid).toBe(true);
      expect((await validate(validator, "user.name+tag@example.co.uk")).isValid).toBe(true);
      expect((await validate(validator, "invalid")).isValid).toBe(false);
      expect((await validate(validator, "@example.com")).isValid).toBe(false);
      expect((await validate(validator, "test@")).isValid).toBe(false);
    });

    it("url", async () => {
      const validator = v.any();
      validator.addRule(urlRule);

      expect((await validate(validator, "https://example.com")).isValid).toBe(true);
      expect((await validate(validator, "http://test.org/path?query=1")).isValid).toBe(true);
      expect((await validate(validator, "ftp://files.com")).isValid).toBe(true);
      expect((await validate(validator, "not-a-url")).isValid).toBe(false);
      expect((await validate(validator, "//invalid")).isValid).toBe(false);
    });
  });

  describe("Character Type Rules", () => {
    it("alpha", async () => {
      const validator = v.any();
      validator.addRule(alphaRule);

      expect((await validate(validator, "abc")).isValid).toBe(true);
      expect((await validate(validator, "ABC")).isValid).toBe(true);
      expect((await validate(validator, "AbCdEf")).isValid).toBe(true);
      expect((await validate(validator, "abc123")).isValid).toBe(false);
      expect((await validate(validator, "abc ")).isValid).toBe(false);
      expect((await validate(validator, "123")).isValid).toBe(false);
    });

    it("alphaNumeric", async () => {
      const validator = v.any();
      validator.addRule(alphaNumericRule);

      expect((await validate(validator, "abc123")).isValid).toBe(true);
      expect((await validate(validator, "ABC123")).isValid).toBe(true);
      expect((await validate(validator, "test")).isValid).toBe(true);
      expect((await validate(validator, "123")).isValid).toBe(true);
      expect((await validate(validator, "abc-123")).isValid).toBe(false);
      expect((await validate(validator, "test ")).isValid).toBe(false);
    });

    it("numeric", async () => {
      const validator = v.any();
      validator.addRule(isNumericRule);

      expect((await validate(validator, "123")).isValid).toBe(true);
      expect((await validate(validator, "0")).isValid).toBe(true);
      expect((await validate(validator, "999")).isValid).toBe(true);
      expect((await validate(validator, "12.3")).isValid).toBe(false);
      expect((await validate(validator, "abc")).isValid).toBe(false);
      expect((await validate(validator, "12a")).isValid).toBe(false);
    });
  });

  describe("Pattern & Whitespace", () => {
    it("pattern", async () => {
      const validator = v.any();
      const rule = validator.addRule(patternRule);
      rule.context.options.pattern = /^[A-Z]{3}-\d{3}$/;

      expect((await validate(validator, "ABC-123")).isValid).toBe(true);
      expect((await validate(validator, "XYZ-999")).isValid).toBe(true);
      expect((await validate(validator, "abc-123")).isValid).toBe(false);
      expect((await validate(validator, "AB-123")).isValid).toBe(false);
      expect((await validate(validator, "ABC-12")).isValid).toBe(false);
    });

    it("withoutWhitespace", async () => {
      const validator = v.any();
      validator.addRule(withoutWhitespaceRule);

      expect((await validate(validator, "nowhitespace")).isValid).toBe(true);
      expect((await validate(validator, "test123")).isValid).toBe(true);
      expect((await validate(validator, "has space")).isValid).toBe(false);
      expect((await validate(validator, "has\ttab")).isValid).toBe(false);
      expect((await validate(validator, "has\nnewline")).isValid).toBe(false);
    });
  });

  describe("String Comparison", () => {
    it("startsWith", async () => {
      const validator = v.any();
      const rule = validator.addRule(startsWithRule);
      rule.context.options.value = "test";

      expect((await validate(validator, "test123")).isValid).toBe(true);
      expect((await validate(validator, "testing")).isValid).toBe(true);
      expect((await validate(validator, "test")).isValid).toBe(true);
      expect((await validate(validator, "123test")).isValid).toBe(false);
      expect((await validate(validator, "tes")).isValid).toBe(false);
    });

    it("endsWith", async () => {
      const validator = v.any();
      const rule = validator.addRule(endsWithRule);
      rule.context.options.value = "end";

      expect((await validate(validator, "theend")).isValid).toBe(true);
      expect((await validate(validator, "end")).isValid).toBe(true);
      expect((await validate(validator, "backend")).isValid).toBe(true);
      expect((await validate(validator, "ending")).isValid).toBe(false);
      expect((await validate(validator, "endx")).isValid).toBe(false);
    });

    it("contains", async () => {
      const validator = v.any();
      const rule = validator.addRule(containsRule);
      rule.context.options.value = "test";

      expect((await validate(validator, "testing")).isValid).toBe(true);
      expect((await validate(validator, "test")).isValid).toBe(true);
      expect((await validate(validator, "atestb")).isValid).toBe(true);
      expect((await validate(validator, "tes")).isValid).toBe(false);
      expect((await validate(validator, "TEST")).isValid).toBe(false);
    });

    it("notContains", async () => {
      const validator = v.any();
      const rule = validator.addRule(notContainsRule);
      rule.context.options.value = "bad";

      expect((await validate(validator, "good")).isValid).toBe(true);
      expect((await validate(validator, "test")).isValid).toBe(true);
      expect((await validate(validator, "ba")).isValid).toBe(true);
      expect((await validate(validator, "bad")).isValid).toBe(false);
      expect((await validate(validator, "badword")).isValid).toBe(false);
      expect((await validate(validator, "notbad")).isValid).toBe(false);
    });
  });
});
