import { describe, expect, it } from "vitest";
import { validate } from "../../../src/factory/validate";
import { v } from "../../../src/factory/validators";

describe("Date Period Rules", () => {
  it("should validate month", async () => {
    // 2023-01-15 is month 1
    const validator = v.date().month(1);
    expect((await validate(validator, "2023-01-15")).isValid).toBe(true);
    expect((await validate(validator, "2023-02-15")).isValid).toBe(false);
  });

  it("should validate year", async () => {
    const validator = v.date().year(2023);
    expect((await validate(validator, "2023-01-15")).isValid).toBe(true);
    expect((await validate(validator, "2022-01-15")).isValid).toBe(false);
  });

  it("should validate between years", async () => {
    const validator = v.date().betweenYears(2020, 2025);
    expect((await validate(validator, "2023-01-15")).isValid).toBe(true);
    expect((await validate(validator, "2019-12-31")).isValid).toBe(false);
    expect((await validate(validator, "2026-01-01")).isValid).toBe(false);
  });

  it("should validate between months", async () => {
    const validator = v.date().betweenMonths(1, 3); // Jan - Mar
    expect((await validate(validator, "2023-02-15")).isValid).toBe(true);
    expect((await validate(validator, "2023-04-01")).isValid).toBe(false);
  });

  it("should validate between days", async () => {
    const validator = v.date().betweenDays(10, 20);
    expect((await validate(validator, "2023-01-15")).isValid).toBe(true);
    expect((await validate(validator, "2023-01-05")).isValid).toBe(false);
  });

  it("should validate quarter", async () => {
    // Q1: Jan-Mar
    const validator = v.date().quarter(1);
    expect((await validate(validator, "2023-02-15")).isValid).toBe(true);
    expect((await validate(validator, "2023-04-15")).isValid).toBe(false);
  });
});
