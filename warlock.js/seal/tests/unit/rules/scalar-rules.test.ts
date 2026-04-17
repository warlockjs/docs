import { describe, expect, it } from "vitest";
import { validate } from "../../../src/factory/validate";
import { v } from "../../../src/factory/validators";
import {
  declinedIfPresentRule,
  declinedIfRequiredRule,
  declinedIfRule,
  declinedRule,
  declinedUnlessRule,
  declinedWithoutRule,
} from "../../../src/rules/scalar/declined-rule";

describe("Scalar Rules - Declined", () => {
  describe("Basic Declined", () => {
    it("declined", async () => {
      const validator = v.any();
      validator.addRule(declinedRule);

      // Valid declined values
      expect((await validate(validator, false)).isValid).toBe(true);
      expect((await validate(validator, 0)).isValid).toBe(true);
      expect((await validate(validator, "0")).isValid).toBe(true);
      expect((await validate(validator, "false")).isValid).toBe(true);
      expect((await validate(validator, "no")).isValid).toBe(true);
      expect((await validate(validator, "n")).isValid).toBe(true);
      expect((await validate(validator, "off")).isValid).toBe(true);
      expect((await validate(validator, "No")).isValid).toBe(true);
      expect((await validate(validator, "N")).isValid).toBe(true);
      expect((await validate(validator, "Off")).isValid).toBe(true);

      // Invalid (not declined)
      expect((await validate(validator, true)).isValid).toBe(false);
      expect((await validate(validator, 1)).isValid).toBe(false);
      expect((await validate(validator, "yes")).isValid).toBe(false);
      expect((await validate(validator, "on")).isValid).toBe(false);
    });
  });

  describe("Conditional Declined", () => {
    it("declinedIf", async () => {
      const validator = v.object({
        type: v.string(),
        consent: v.any(),
      });

      const rule = validator.schema.consent.addRule(declinedIfRule);
      rule.context.options.field = "type";
      rule.context.options.value = "reject";
      rule.context.options.scope = "sibling";

      expect((await validate(validator, { type: "reject", consent: "no" })).isValid).toBe(true);
      expect((await validate(validator, { type: "reject", consent: false })).isValid).toBe(true);
      expect((await validate(validator, { type: "accept", consent: "yes" })).isValid).toBe(false);
    });

    it("declinedUnless", async () => {
      const validator = v.object({
        mode: v.string(),
        tracking: v.any(),
      });

      const rule = validator.schema.tracking.addRule(declinedUnlessRule);
      rule.context.options.field = "mode";
      rule.context.options.value = "enabled";
      rule.context.options.scope = "sibling";

      expect((await validate(validator, { mode: "disabled", tracking: "no" })).isValid).toBe(true);
      expect((await validate(validator, { mode: "disabled", tracking: false })).isValid).toBe(true);
      expect((await validate(validator, { mode: "enabled", tracking: "yes" })).isValid).toBe(false);
    });

    it("declinedIfRequired", async () => {
      const validator = v.object({
        email: v.string().optional(),
        newsletter: v.any(),
      });

      const rule = validator.schema.newsletter.addRule(declinedIfRequiredRule);
      rule.context.options.field = "email";
      rule.context.options.scope = "sibling";

      expect(
        (await validate(validator, { email: "test@example.com", newsletter: "no" })).isValid,
      ).toBe(true);
      expect(
        (await validate(validator, { email: "test@example.com", newsletter: false })).isValid,
      ).toBe(true);
      expect((await validate(validator, { newsletter: "yes" })).isValid).toBe(false);
    });

    it("declinedIfPresent", async () => {
      const validator = v.object({
        optOut: v.string().optional(),
        consent: v.any(),
      });

      const rule = validator.schema.consent.addRule(declinedIfPresentRule);
      rule.context.options.field = "optOut";
      rule.context.options.scope = "sibling";

      expect((await validate(validator, { optOut: "yes", consent: "no" })).isValid).toBe(true);
      expect((await validate(validator, { optOut: "yes", consent: false })).isValid).toBe(true);
      expect((await validate(validator, { consent: "yes" })).isValid).toBe(false);
    });

    it("declinedWithout", async () => {
      const validator = v.object({
        premium: v.string().optional(),
        ads: v.any(),
      });

      const rule = validator.schema.ads.addRule(declinedWithoutRule);
      rule.context.options.field = "premium";
      rule.context.options.scope = "sibling";

      expect((await validate(validator, { ads: "no" })).isValid).toBe(true);
      expect((await validate(validator, { ads: false })).isValid).toBe(true);
      expect((await validate(validator, { premium: "yes", ads: "yes" })).isValid).toBe(false);
    });
  });
});
