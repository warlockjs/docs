import { describe, expect, it } from "vitest";
import { validate } from "../../../src/factory/validate";
import { v } from "../../../src/factory/validators";
import { maxFileSizeRule, minFileSizeRule } from "../../../src/rules/file/file-size";

describe("File Rules", () => {
  it("should validate max file size", async () => {
    const validator = v.any();
    const rule = validator.addRule(maxFileSizeRule);
    rule.context.options.maxSize = 1000;

    // Valid file (size provided as property)
    expect((await validate(validator, { size: 500 })).isValid).toBe(true);

    // Invalid file
    expect((await validate(validator, { size: 1500 })).isValid).toBe(false);
  });

  it("should validate min file size", async () => {
    const validator = v.any();
    const rule = validator.addRule(minFileSizeRule);
    rule.context.options.minSize = 1000;

    expect((await validate(validator, { size: 1500 })).isValid).toBe(true);
    expect((await validate(validator, { size: 500 })).isValid).toBe(false);
  });
});
