import { describe, expect, it } from "vitest";
import { validate } from "../../../src/factory/validate";
import { v } from "../../../src/factory/validators";
import { sortedArrayRule, uniqueArrayRule } from "../../../src/rules/array/array-rules";

describe("Array Rules", () => {
  it("uniqueArray", async () => {
    const validator = v.any();
    validator.addRule(uniqueArrayRule);

    expect((await validate(validator, [1, 2, 3])).isValid).toBe(true);
    expect((await validate(validator, ["a", "b", "c"])).isValid).toBe(true);
    expect((await validate(validator, [])).isValid).toBe(true);
    expect((await validate(validator, [1])).isValid).toBe(true);

    expect((await validate(validator, [1, 2, 2])).isValid).toBe(false);
    expect((await validate(validator, ["a", "b", "a"])).isValid).toBe(false);
    expect((await validate(validator, [1, 1, 1])).isValid).toBe(false);
  });

  it("sortedArray - ascending", async () => {
    const validator = v.any();
    const rule = validator.addRule(sortedArrayRule);
    rule.context.options.direction = "asc";

    expect((await validate(validator, [1, 2, 3])).isValid).toBe(true);
    expect((await validate(validator, [1, 1, 2])).isValid).toBe(true);
    expect((await validate(validator, [])).isValid).toBe(true);
    expect((await validate(validator, [1])).isValid).toBe(true);
    expect((await validate(validator, ["a", "b", "c"])).isValid).toBe(true);

    expect((await validate(validator, [3, 2, 1])).isValid).toBe(false);
    expect((await validate(validator, [1, 3, 2])).isValid).toBe(false);
  });

  it("sortedArray - descending", async () => {
    const validator = v.any();
    const rule = validator.addRule(sortedArrayRule);
    rule.context.options.direction = "desc";

    expect((await validate(validator, [3, 2, 1])).isValid).toBe(true);
    expect((await validate(validator, [3, 3, 1])).isValid).toBe(true);
    expect((await validate(validator, [])).isValid).toBe(true);
    expect((await validate(validator, [5])).isValid).toBe(true);

    expect((await validate(validator, [1, 2, 3])).isValid).toBe(false);
    expect((await validate(validator, [3, 1, 2])).isValid).toBe(false);
  });
});
