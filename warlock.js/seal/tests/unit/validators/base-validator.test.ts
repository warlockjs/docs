import { describe, expect, it } from "vitest";
import { SchemaContext } from "../../../src/types";
import { BaseValidator } from "../../../src/validators/base-validator";

// Helper to create simple context
function createMockContext(value: any): SchemaContext {
  return {
    allValues: {},
    parent: {},
    value,
    key: "test",
    path: "test",
    translateRule: () => "",
    translateAttribute: () => "",
  };
}

describe("BaseValidator", () => {
  it("should initialize default properties", () => {
    const validator = new BaseValidator();
    expect(validator.rules).toEqual([]);
    expect(validator.mutators).toEqual([]);
    expect(validator["isNullable"]).toBe(false);
  });

  it("should set nullable", () => {
    const validator = new BaseValidator();
    validator.nullable();
    expect(validator["isNullable"]).toBe(true);
  });

  it("should set description", () => {
    const validator = new BaseValidator();
    validator.describe("test description");
    expect(validator["description"]).toBe("test description");
  });

  describe("Transformers", () => {
    it("should add transformer", () => {
      const validator = new BaseValidator();
      const transform = (v: any) => v;
      validator.addTransformer(transform);
      expect(validator["dataTransformers"]).toHaveLength(1);
    });

    it("should run transformation pipeline", async () => {
      const validator = new BaseValidator();
      validator.addTransformer((val) => val.toUpperCase());
      validator.addTransformer((val) => val + "!");

      const result = await validator.startTransformationPipeline("test", createMockContext("test"));
      expect(result).toBe("TEST!");
    });

    it("outputAs should add a simple transformer", async () => {
      const validator = new BaseValidator();
      validator.outputAs((val) => Number(val));

      const result = await validator.startTransformationPipeline("123", createMockContext("123"));
      expect(result).toBe(123);
    });

    it("toJSON should add a JSON transformer", async () => {
      const validator = new BaseValidator();
      validator.toJSON();

      const data = { a: 1 };
      const result = await validator.startTransformationPipeline(data, createMockContext(data));
      expect(result).toBe('{"a":1}');
    });
  });
});
