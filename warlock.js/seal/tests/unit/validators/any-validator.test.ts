import { describe, expect, it } from "vitest";
import { validate } from "../../../src/factory/validate";
import { AnyValidator } from "../../../src/validators/any-validator";

describe("AnyValidator", () => {
  it("should validate any value", async () => {
    const validator = new AnyValidator();

    expect((await validate(validator, "string")).isValid).toBe(true);
    expect((await validate(validator, 123)).isValid).toBe(true);
    expect((await validate(validator, { a: 1 })).isValid).toBe(true);
    expect((await validate(validator, null)).isValid).toBe(true); // Default might be optional
    expect((await validate(validator, undefined)).isValid).toBe(true); // Optional by default
  });
});
