import { describe, expect, it } from "vitest";
import { validate } from "../../../src/factory/validate";
import { v } from "../../../src/factory/validators";

describe("ArrayValidator", () => {
  it("should validate array type", async () => {
    // ArrayValidator requires an inner validator.
    // Using v.array(v.any()) to validate generic array.
    const validator = v.array(v.any());
    const result = await validate(validator, [1, 2, 3]);
    expect(result.isValid).toBe(true);
  });

  it("should fail for non-array type", async () => {
    const validator = v.array(v.any());
    const result = await validate(validator, "test");
    expect(result.isValid).toBe(false);
  });

  it("should validate items type", async () => {
    // v.array(v.number()) implies all items must be numbers
    const validator = v.array(v.number());

    const valid = await validate(validator, [1, 2, 3]);
    expect(valid.isValid).toBe(true);

    const invalid = await validate(validator, [1, "2", 3]);
    expect(invalid.isValid).toBe(false);
  });

  it("should validate array length", async () => {
    const validator = v.array(v.any()).minLength(2).maxLength(4);

    expect((await validate(validator, [1])).isValid).toBe(false);
    expect((await validate(validator, [1, 2])).isValid).toBe(true);
    expect((await validate(validator, [1, 2, 3, 4])).isValid).toBe(true);
    expect((await validate(validator, [1, 2, 3, 4, 5])).isValid).toBe(false);
  });
});
