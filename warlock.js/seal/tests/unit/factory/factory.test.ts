import { describe, it, expect } from "vitest";
import { v } from "../../../src/factory/validators";
import { validate } from "../../../src/factory/validate";
import { BaseValidator } from "../../../src/validators/base-validator";

describe("Factory", () => {
  describe("v object", () => {
    it("should have methods for creating validators", () => {
      expect(v.string).toBeDefined();
      expect(v.number).toBeDefined();
      expect(v.boolean).toBeDefined();
      expect(v.array).toBeDefined();
      expect(v.object).toBeDefined();
      expect(v.date).toBeDefined();
    });

    it("v.string() should return a BaseValidator instance (StringValidator)", () => {
      const validator = v.string();
      expect(validator).toBeInstanceOf(BaseValidator);
    });

    it("v.number() should return a BaseValidator instance (NumberValidator)", () => {
      const validator = v.number();
      expect(validator).toBeInstanceOf(BaseValidator);
    });
  });

  describe("validate function", () => {
    it("should validate value against schema", async () => {
        const schema = v.string().required();
        // validate(schema, data) -- correct order?
        // validate.ts signature: validate(schema, data, options)
        const result = await validate(schema, "test");
        
        expect(result.isValid).toBe(true);
        expect(result.data).toBe("test");
    });

    it("should return invalid result when validation fails", async () => {
        const schema = v.string().required();
        const result = await validate(schema, "");
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
