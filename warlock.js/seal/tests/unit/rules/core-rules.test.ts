import { describe, expect, it } from "vitest";
import { validate } from "../../../src/factory/validate";
import { v } from "../../../src/factory/validators";
import { forbiddenRule } from "../../../src/rules/core/forbidden";
import { whenRule } from "../../../src/rules/core/when";

describe("Core Rules", () => {
  describe("Required & Present", () => {
    it("required", async () => {
      const validator = v.string().required();
      expect((await validate(validator, "test")).isValid).toBe(true);
      expect((await validate(validator, "")).isValid).toBe(false);
      expect((await validate(validator, null)).isValid).toBe(false);
      expect((await validate(validator, {})).isValid).toBe(false);
      expect((await validate(validator, [])).isValid).toBe(false);
      expect((await validate(validator, false)).isValid).toBe(false);
      expect((await validate(validator, true)).isValid).toBe(false);
      expect((await validate(validator, undefined)).isValid).toBe(false);
      expect((await validate(validator, 0)).isValid).toBe(false);
      class Test {}
      expect((await validate(validator, new Test())).isValid).toBe(false);
    });

    it("present", async () => {
      const validator = v.string().present();
      expect((await validate(validator, "val")).isValid).toBe(true);
      expect((await validate(validator, undefined)).isValid).toBe(false);
    });
  });

  describe("Forbidden", () => {
    it("should fail if value is present", async () => {
      const validator = v.string();
      validator.addRule(forbiddenRule);

      expect((await validate(validator, undefined)).isValid).toBe(true);
      expect((await validate(validator, "value")).isValid).toBe(false);
    });
  });

  describe("Equality", () => {
    it("equal", async () => {
      const validator = v.string().equal("test");
      expect((await validate(validator, "test")).isValid).toBe(true);
      expect((await validate(validator, "other")).isValid).toBe(false);
    });

    it("sameAs (equalsField)", async () => {
      const validator = v.object({
        password: v.string(),
        confirm: v.string().sameAs("password"),
      });

      expect((await validate(validator, { password: "abc", confirm: "abc" })).isValid).toBe(true);
      expect((await validate(validator, { password: "abc", confirm: "def" })).isValid).toBe(false);
    });

    it("differentFrom (notEqualsField)", async () => {
      const validator = v.object({
        oldPassword: v.string(),
        newPassword: v.string().differentFrom("oldPassword"),
      });

      expect((await validate(validator, { oldPassword: "abc", newPassword: "def" })).isValid).toBe(
        true,
      );
      expect((await validate(validator, { oldPassword: "abc", newPassword: "abc" })).isValid).toBe(
        false,
      );
    });
  });

  describe("When Rule", () => {
    it("should apply conditional validation", async () => {
      const valueValidator = v.any();
      const rule = valueValidator.addRule(whenRule);

      rule.context.options = {
        field: "type",
        is: {
          number: v.number(),
          string: v.string(),
        },
        otherwise: v.boolean(),
      };

      const validator = v.object({
        type: v.string(),
        value: valueValidator,
      });

      // If type is number, value must be number
      expect((await validate(validator, { type: "number", value: 123 })).isValid).toBe(true);
      expect((await validate(validator, { type: "number", value: "abc" })).isValid).toBe(false);

      // If type is string, value must be string
      expect((await validate(validator, { type: "string", value: "abc" })).isValid).toBe(true);

      // Otherwise boolean
      expect((await validate(validator, { type: "other", value: true })).isValid).toBe(true);
      expect((await validate(validator, { type: "other", value: 123 })).isValid).toBe(false);
    });
  });
});
