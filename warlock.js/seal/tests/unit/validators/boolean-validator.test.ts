import { describe, expect, it } from "vitest";
import { validate } from "../../../src/factory/validate";
import { BooleanValidator } from "../../../src/validators/boolean-validator";

describe("BooleanValidator", () => {
  it("should validate boolean type", async () => {
    const validator = new BooleanValidator();
    const result = await validate(validator, true);
    expect(result.isValid).toBe(true);
  });

  it("should validate strict boolean", async () => {
    const validator = new BooleanValidator(); // strict by default due to matchesType

    expect((await validate(validator, true)).isValid).toBe(true);
    expect((await validate(validator, false)).isValid).toBe(true);

    // "true" string is NOT a boolean type, so it fails type check before rules
    expect((await validate(validator, "true")).isValid).toBe(false);
  });

  it("should validate accepted values passed as boolean", async () => {
    // accepted rule checks for true/1/"yes"/etc.
    // But BooleanValidator type check restricts it to boolean.
    // So only `true` should pass as "accepted".
    const validator = new BooleanValidator().accepted();

    expect((await validate(validator, true)).isValid).toBe(true);
    expect((await validate(validator, false)).isValid).toBe(false);
  });
});
