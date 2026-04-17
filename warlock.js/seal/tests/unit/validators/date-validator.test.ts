import { describe, expect, it } from "vitest";
import { validate } from "../../../src/factory/validate";
import { DateValidator } from "../../../src/validators/date-validator";

describe("DateValidator", () => {
  it("should validate date type", async () => {
    const validator = new DateValidator();
    const result = await validate(validator, new Date());
    expect(result.isValid).toBe(true);
  });

  it("should validate valid date string", async () => {
    const validator = new DateValidator();
    const result = await validate(validator, "2023-01-01");
    expect(result.isValid).toBe(true);
  });

  it("should fail for invalid date", async () => {
    const validator = new DateValidator();
    const result = await validate(validator, "invalid-date");
    expect(result.isValid).toBe(false);
  });

  it("should validate min date", async () => {
    const minDate = new Date("2023-01-01");
    const validator = new DateValidator().min(minDate);

    const valid = await validate(validator, "2023-01-02");
    expect(valid.isValid).toBe(true);

    const invalid = await validate(validator, "2022-12-31");
    expect(invalid.isValid).toBe(false);
  });

  it("should transform to ISO string", async () => {
    const validator = new DateValidator().toISOString();
    const date = new Date("2023-01-01T12:00:00.000Z");
    const result = await validate(validator, date);
    expect(result.data).toBe(date.toISOString());
  });
});
