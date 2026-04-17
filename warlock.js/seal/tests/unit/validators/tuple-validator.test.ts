import { describe, expect, it } from "vitest";
import { validate } from "../../../src/factory/validate";
import { v } from "../../../src/factory/validators";
import { TupleValidator } from "../../../src/validators/tuple-validator";

describe("TupleValidator", () => {
  it("should validate tuple with strict types and expected length", async () => {
    const validator = new TupleValidator([v.string(), v.number()]);

    expect((await validate(validator, ["text", 123])).isValid).toBe(true);

    // Invalid length
    expect((await validate(validator, ["text"])).isValid).toBe(false);
    expect((await validate(validator, ["text", 123, true])).isValid).toBe(false);

    // Invalid types at position
    expect((await validate(validator, [123, 123])).isValid).toBe(false); // First must be string
  });
});
