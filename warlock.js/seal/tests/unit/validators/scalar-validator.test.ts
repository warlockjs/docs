import { describe, expect, it } from "vitest";
import { validate } from "../../../src/factory/validate";
import { ScalarValidator } from "../../../src/validators/scalar-validator";

describe("ScalarValidator", () => {
  it("should validate scalar types", async () => {
    const validator = new ScalarValidator();
    expect((await validate(validator, "string")).isValid).toBe(true);
    expect((await validate(validator, 123)).isValid).toBe(true);
    expect((await validate(validator, true)).isValid).toBe(true);

    expect((await validate(validator, {})).isValid).toBe(false);
    expect((await validate(validator, [])).isValid).toBe(false);
  });

  it("should validate enum values", async () => {
    enum Colors {
      Red = "red",
      Blue = "blue",
    }
    const validator = new ScalarValidator().enum(Colors);

    expect((await validate(validator, "red")).isValid).toBe(true);
    expect((await validate(validator, "green")).isValid).toBe(false);
  });

  it("should validate oneOf/in values", async () => {
    const validator = new ScalarValidator().oneOf([1, "a", true]);

    expect((await validate(validator, 1)).isValid).toBe(true);
    expect((await validate(validator, "a")).isValid).toBe(true);
    expect((await validate(validator, true)).isValid).toBe(true);
    expect((await validate(validator, "b")).isValid).toBe(false);
  });
});
