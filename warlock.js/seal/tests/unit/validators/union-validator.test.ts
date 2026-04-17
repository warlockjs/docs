import { describe, expect, it } from "vitest";
import { validate } from "../../../src/factory/validate";
import { v } from "../../../src/factory/validators";
import { UnionValidator } from "../../../src/validators/union-validator";

describe("UnionValidator", () => {
  it("should validate one of strict types", async () => {
    const validator = new UnionValidator().union([v.string(), v.number()]);

    expect((await validate(validator, "text")).isValid).toBe(true);
    expect((await validate(validator, 123)).isValid).toBe(true);

    expect((await validate(validator, true)).isValid).toBe(false);
  });

  it("should validate with constraints", async () => {
    const validator = new UnionValidator().union([v.string().email(), v.number().min(10)]);

    expect((await validate(validator, "test@example.com")).isValid).toBe(true);
    expect((await validate(validator, 15)).isValid).toBe(true);

    expect((await validate(validator, "invalid-email")).isValid).toBe(false);
    expect((await validate(validator, 5)).isValid).toBe(false);
  });
});
