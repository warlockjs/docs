import { describe, expect, it } from "vitest";
import { validate } from "../../../src/factory/validate";
import { v } from "../../../src/factory/validators";
import {
  arrayRule,
  booleanRule,
  floatRule,
  intRule,
  numberRule,
  objectRule,
  scalarRule,
  stringRule,
} from "../../../src/rules/common/type-rules";

describe("Type Rules", () => {
  it("stringRule", async () => {
    const validator = v.any();
    validator.addRule(stringRule);

    expect((await validate(validator, "test")).isValid).toBe(true);
    expect((await validate(validator, 123)).isValid).toBe(false);
    expect((await validate(validator, true)).isValid).toBe(false);
    expect((await validate(validator, {})).isValid).toBe(false);
  });

  it("numberRule", async () => {
    const validator = v.any();
    validator.addRule(numberRule);

    expect((await validate(validator, 123)).isValid).toBe(true);
    expect((await validate(validator, 12.34)).isValid).toBe(true);
    expect((await validate(validator, "123")).isValid).toBe(false);
    expect((await validate(validator, NaN)).isValid).toBe(true);
  });

  it("booleanRule", async () => {
    const validator = v.any();
    validator.addRule(booleanRule);

    expect((await validate(validator, true)).isValid).toBe(true);
    expect((await validate(validator, false)).isValid).toBe(true);
    expect((await validate(validator, "true")).isValid).toBe(false);
    expect((await validate(validator, 0)).isValid).toBe(false);
  });

  it("intRule", async () => {
    const validator = v.any();
    validator.addRule(intRule);

    expect((await validate(validator, 123)).isValid).toBe(true);
    expect((await validate(validator, 0)).isValid).toBe(true);
    expect((await validate(validator, 12.34)).isValid).toBe(false);
    expect((await validate(validator, "123")).isValid).toBe(false);
  });

  it("floatRule", async () => {
    const validator = v.any();
    validator.addRule(floatRule);

    expect((await validate(validator, 12.34)).isValid).toBe(true);
    expect((await validate(validator, 123)).isValid).toBe(false);
    expect((await validate(validator, 0)).isValid).toBe(false);
    expect((await validate(validator, "12.34")).isValid).toBe(false);
  });

  it("scalarRule", async () => {
    const validator = v.any();
    validator.addRule(scalarRule);

    expect((await validate(validator, "test")).isValid).toBe(true);
    expect((await validate(validator, 123)).isValid).toBe(true);
    expect((await validate(validator, true)).isValid).toBe(true);
    expect((await validate(validator, {})).isValid).toBe(false);

    expect((await validate(validator, [1])).isValid).toBe(false);

    const reqValidator = v.any().required();
    reqValidator.addRule(scalarRule);
    expect((await validate(reqValidator, null)).isValid).toBe(false);
  });

  it("objectRule", async () => {
    const validator = v.any();
    validator.addRule(objectRule);

    expect((await validate(validator, {})).isValid).toBe(true);
    expect((await validate(validator, { a: 1 })).isValid).toBe(true);
    expect((await validate(validator, [1])).isValid).toBe(false);

    const reqValidator = v.any().required();
    reqValidator.addRule(objectRule);
    expect((await validate(reqValidator, null)).isValid).toBe(false);
    expect((await validate(validator, "test")).isValid).toBe(false);
  });

  it("arrayRule", async () => {
    const validator = v.any();
    validator.addRule(arrayRule);

    expect((await validate(validator, [])).isValid).toBe(true);
    expect((await validate(validator, [1, 2])).isValid).toBe(true);

    expect((await validate(validator, {})).isValid).toBe(false);
    expect((await validate(validator, "test")).isValid).toBe(false);
  });
});
