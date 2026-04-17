import { describe, expect, it } from "vitest";
import { validate } from "../../../src/factory/validate";
import { StringValidator } from "../../../src/validators/string-validator";

describe("StringValidator", () => {
  it("should validate string type", async () => {
    const validator = new StringValidator();
    const result = await validate(validator, "test");
    expect(result.isValid).toBe(true);
  });

  it("should fail for non-string type", async () => {
    // By default StringValidator adds stringRule
    const validator = new StringValidator();
    const result = await validate(validator, 123);
    expect(result.isValid).toBe(false);
  });

  it("should apply email rule", async () => {
    const validator = new StringValidator().email();
    const valid = await validate(validator, "test@example.com");
    expect(valid.isValid).toBe(true);

    const invalid = await validate(validator, "invalid-email");
    expect(invalid.isValid).toBe(false);
  });

  it("should apply length rule", async () => {
    const validator = new StringValidator().length(5);
    const valid = await validate(validator, "12345");
    expect(valid.isValid).toBe(true);

    const invalid = await validate(validator, "123");
    expect(invalid.isValid).toBe(false);
  });

  describe("Mutators", () => {
    it("should apply trim mutator", async () => {
      const validator = new StringValidator().trim();
      const result = await validate(validator, "  test  ");
      expect(result.data).toBe("test");
    });

    it("should apply uppercase mutator", async () => {
      const validator = new StringValidator().uppercase();
      const result = await validate(validator, "test");
      expect(result.data).toBe("TEST");
    });
  });
});
