import { describe, expect, it } from "vitest";
import { validate } from "../../../src/factory/validate";
import { FloatValidator } from "../../../src/validators/float-validator";
import { IntValidator } from "../../../src/validators/int-validator";
import { NumericValidator } from "../../../src/validators/numeric-validator";

describe("IntValidator", () => {
  it("should validate integer", async () => {
    const validator = new IntValidator();
    expect((await validate(validator, 10)).isValid).toBe(true);
    expect((await validate(validator, 0)).isValid).toBe(true);
    expect((await validate(validator, -5)).isValid).toBe(true);
  });

  it("should fail for float", async () => {
    const validator = new IntValidator();
    expect((await validate(validator, 10.5)).isValid).toBe(false);
  });
});

describe("FloatValidator", () => {
  it("should validate float", async () => {
    const validator = new FloatValidator();
    expect((await validate(validator, 10.5)).isValid).toBe(true);

    // FloatValidator enforces strict double/float check (must have decimal or be float type)
    expect((await validate(validator, 10)).isValid).toBe(false);
  });
});

describe("NumericValidator", () => {
  it("should validate numeric strings and numbers", async () => {
    const validator = new NumericValidator();

    expect((await validate(validator, 123)).isValid).toBe(true);
    expect((await validate(validator, "123")).isValid).toBe(true);
    expect((await validate(validator, "12.5")).isValid).toBe(true);
    expect((await validate(validator, "-50")).isValid).toBe(true);
  });

  it("should fail for non-numeric strings", async () => {
    const validator = new NumericValidator();
    expect((await validate(validator, "abc")).isValid).toBe(false);
  });

  it("should cast to number in output", async () => {
    const validator = new NumericValidator();
    const result = await validate(validator, "123");
    expect(result.data).toBe(123);
  });
});
