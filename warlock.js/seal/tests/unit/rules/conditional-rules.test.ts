import { describe, expect, it } from "vitest";
import { presentIfRule } from "../../../src/rules/conditional/present-if-rules";

import { validate } from "../../../src/factory/validate";
import { v } from "../../../src/factory/validators";

describe("Conditional Rules", () => {
  describe("Required Variants", () => {
    it("requiredIf", async () => {
      const validator = v.object({
        role: v.string(),
        accessLevel: v.number().requiredIf("role", "admin"),
      });

      expect((await validate(validator, { role: "user" })).isValid).toBe(true);
      expect((await validate(validator, { role: "admin", accessLevel: 5 })).isValid).toBe(true);
      expect((await validate(validator, { role: "admin" })).isValid).toBe(false);
    });
  });

  describe("Required Variants (Advanced)", () => {
    it("requiredUnless", async () => {
      const validator = v.object({
        isGuest: v.boolean(),
        username: v.string().requiredUnless("isGuest", true),
      });

      expect((await validate(validator, { isGuest: true })).isValid).toBe(true);
      expect((await validate(validator, { isGuest: false, username: "a" })).isValid).toBe(true);
      expect((await validate(validator, { isGuest: false })).isValid).toBe(false);
    });

    it("requiredWith", async () => {
      const validator = v.object({
        type: v.string().optional(),
        subType: v.string().requiredWith("type"),
      });

      expect((await validate(validator, {})).isValid).toBe(true);
      expect((await validate(validator, { type: "A", subType: "B" })).isValid).toBe(true);
      expect((await validate(validator, { type: "A" })).isValid).toBe(false);
    });

    it("requiredWithAll", async () => {
      const validator = v.object({
        a: v.string().optional(),
        b: v.string().optional(),
        c: v.string().requiredWithAll(["a", "b"]),
      });

      expect((await validate(validator, { a: "A" })).isValid).toBe(true);
      expect((await validate(validator, { a: "A", b: "B", c: "C" })).isValid).toBe(true);
      expect((await validate(validator, { a: "A", b: "B" })).isValid).toBe(false);
    });

    it("requiredWithAny", async () => {
      const validator = v.object({
        a: v.string().optional(),
        b: v.string().optional(),
        c: v.string().requiredWithAny(["a", "b"]),
      });

      expect((await validate(validator, {})).isValid).toBe(true);
      expect((await validate(validator, { a: "A", c: "C" })).isValid).toBe(true);
      expect((await validate(validator, { b: "B", c: "C" })).isValid).toBe(true);
      expect((await validate(validator, { a: "A" })).isValid).toBe(false);
    });

    it("requiredWithout", async () => {
      const validator = v.object({
        email: v.string().optional(),
        phone: v.string().requiredWithout("email"),
      });

      expect((await validate(validator, { email: "e" })).isValid).toBe(true);
      expect((await validate(validator, { phone: "p" })).isValid).toBe(true);
      expect((await validate(validator, {})).isValid).toBe(false);
    });

    it("requiredWithoutAll", async () => {
      const validator = v.object({
        a: v.string().optional(),
        b: v.string().optional(),
        c: v.string().requiredWithoutAll(["a", "b"]),
      });

      expect((await validate(validator, { a: "A" })).isValid).toBe(true);
      expect((await validate(validator, { b: "B" })).isValid).toBe(true);
      expect((await validate(validator, { c: "C" })).isValid).toBe(true); // if all missing, required
      expect((await validate(validator, {})).isValid).toBe(false);
    });

    it("requiredWithoutAny", async () => {
      const validator = v.object({
        a: v.string().optional(),
        b: v.string().optional(),
        c: v.string().requiredWithoutAny(["a", "b"]),
      });

      expect((await validate(validator, { a: "A", b: "B" })).isValid).toBe(true);
      expect((await validate(validator, { a: "A", c: "C" })).isValid).toBe(true); // b missing
      expect((await validate(validator, { a: "A" })).isValid).toBe(false);
    });
  });

  describe("Forbidden Variants", () => {
    it("forbiddenIf", async () => {
      const validator = v.object({
        authType: v.string(),
        password: v.string().forbiddenIf("authType", "oauth"),
      });

      expect((await validate(validator, { authType: "local", password: "123" })).isValid).toBe(
        true,
      );
      expect((await validate(validator, { authType: "oauth" })).isValid).toBe(true);
      expect((await validate(validator, { authType: "oauth", password: "123" })).isValid).toBe(
        false,
      );
    });

    it("forbiddenIfNot", async () => {
      const validator = v.object({
        type: v.string(),
        details: v.string().forbiddenIfNot("type", "complex"),
      });

      expect((await validate(validator, { type: "complex", details: "abc" })).isValid).toBe(true);
      expect((await validate(validator, { type: "simple" })).isValid).toBe(true);
      expect((await validate(validator, { type: "simple", details: "abc" })).isValid).toBe(false);
    });

    it("forbiddenIfEmpty", async () => {
      const validator = v.object({
        parent: v.string().optional(),
        child: v.string().forbiddenIfEmpty("parent"),
      });

      expect((await validate(validator, { parent: "P", child: "C" })).isValid).toBe(true);
      expect((await validate(validator, {})).isValid).toBe(true);
      expect((await validate(validator, { child: "C" })).isValid).toBe(false);
    });
  });

  describe("Present Variants", () => {
    it("presentIf", async () => {
      // 'metadata' field must be present (even if null) if 'advanced' is true
      const metadataValidator = v.any();
      const rule = metadataValidator.addRule(presentIfRule);
      rule.context.options.field = "advanced";
      rule.context.options.value = true;

      const validator = v.object({
        advanced: v.boolean(),
        metadata: metadataValidator,
      });

      expect((await validate(validator, { advanced: false })).isValid).toBe(true);
      expect((await validate(validator, { advanced: true, metadata: "yes" })).isValid).toBe(true); // key exists
      expect((await validate(validator, { advanced: true })).isValid).toBe(false); // key missing
    });
  });

  describe("Present Variants (Advanced)", () => {
    it("presentUnless", async () => {
      const validator = v.object({
        isDraft: v.boolean(),
        publishDate: v.string().presentUnless("isDraft", true),
      });

      expect((await validate(validator, { isDraft: true })).isValid).toBe(true);
      expect((await validate(validator, { isDraft: false, publishDate: "now" })).isValid).toBe(
        true,
      );
      expect((await validate(validator, { isDraft: false })).isValid).toBe(false);
    });

    it("presentWith", async () => {
      const validator = v.object({
        img: v.string().optional(),
        caption: v.string().presentWith("img"),
      });

      expect((await validate(validator, {})).isValid).toBe(true);
      expect((await validate(validator, { img: "x", caption: "y" })).isValid).toBe(true);
      expect((await validate(validator, { img: "x" })).isValid).toBe(false);
    });

    it("presentWithAll", async () => {
      const validator = v.object({
        a: v.string().optional(),
        b: v.string().optional(),
        c: v.string().presentWithAll(["a", "b"]),
      });

      expect((await validate(validator, { a: "A" })).isValid).toBe(true);
      expect((await validate(validator, { a: "A", b: "B", c: "C" })).isValid).toBe(true);
      expect((await validate(validator, { a: "A", b: "B" })).isValid).toBe(false);
    });

    it("presentWithAny", async () => {
      const validator = v.object({
        a: v.string().optional(),
        b: v.string().optional(),
        c: v.string().presentWithAny(["a", "b"]),
      });

      expect((await validate(validator, {})).isValid).toBe(true);
      expect((await validate(validator, { a: "A", c: "C" })).isValid).toBe(true);
      expect((await validate(validator, { a: "A" })).isValid).toBe(false);
    });

    it("presentWithout", async () => {
      const validator = v.object({
        a: v.string().optional(),
        b: v.string().presentWithout("a"),
      });

      expect((await validate(validator, { a: "yes" })).isValid).toBe(true);
      expect((await validate(validator, { b: "yes" })).isValid).toBe(true);
      expect((await validate(validator, {})).isValid).toBe(false);
    });

    it("presentWithoutAll", async () => {
      const validator = v.object({
        a: v.string().optional(),
        b: v.string().optional(),
        c: v.string().presentWithoutAll(["a", "b"]),
      });

      expect((await validate(validator, { a: "A" })).isValid).toBe(true);
      expect((await validate(validator, { c: "C" })).isValid).toBe(true);
      expect((await validate(validator, {})).isValid).toBe(false);
    });

    it("presentWithoutAny", async () => {
      const validator = v.object({
        a: v.string().optional(),
        b: v.string().optional(),
        c: v.string().presentWithoutAny(["a", "b"]),
      });

      expect((await validate(validator, { a: "A", b: "B" })).isValid).toBe(true);
      expect((await validate(validator, { a: "A", c: "C" })).isValid).toBe(true); // b missing
      expect((await validate(validator, { a: "A" })).isValid).toBe(false);
    });
  });
});
