import { describe, expect, it } from "vitest";
import { validate } from "../../../src/factory/validate";
import { v } from "../../../src/factory/validators";
import { RecordValidator } from "../../../src/validators/record-validator";

describe("RecordValidator", () => {
  it("should validate record with consistent value types", async () => {
    const validator = new RecordValidator(v.string());

    expect((await validate(validator, { a: "val1", b: "val2" })).isValid).toBe(true);
    expect((await validate(validator, {})).isValid).toBe(true); // Empty record is valid object

    expect((await validate(validator, { a: 123 })).isValid).toBe(false); // Value must be string
  });

  it("should validate record keys and integrity", async () => {
    // RecordValidator mainly validates object values.
    // Keys are strings.
    const validator = new RecordValidator(v.number().min(10));

    expect((await validate(validator, { x: 15, y: 20 })).isValid).toBe(true);
    expect((await validate(validator, { x: 5 })).isValid).toBe(false);
  });
});
