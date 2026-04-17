import { describe, expect, it } from "vitest";
import { validate } from "../../../src/factory/validate";
import { v } from "../../../src/factory/validators";
import { ObjectValidator } from "../../../src/validators/object-validator";

describe("ObjectValidator", () => {
  it("should validate object type", async () => {
    const validator = new ObjectValidator({}).allowUnknown();
    const result = await validate(validator, { a: 1 });
    expect(result.isValid).toBe(true);
  });

  it("should fail for non-object type", async () => {
    const validator = new ObjectValidator({});
    const result = await validate(validator, "test");
    expect(result.isValid).toBe(false);
  });

  it("should validate nested shape", async () => {
    const validator = new ObjectValidator({
      name: v.string().required(),
      age: v.number().min(18),
    });

    const valid = await validate(validator, { name: "Alice", age: 20 });
    expect(valid.isValid).toBe(true);

    const invalid = await validate(validator, { name: "Bob", age: 10 });
    expect(invalid.isValid).toBe(false);

    const missing = await validate(validator, { age: 20 });
    expect(missing.isValid).toBe(false); // name required
  });

  // Test nested object
  it("should validate deep nested object", async () => {
    const validator = new ObjectValidator({
      user: v.object({
        address: v.object({
          city: v.string().required(),
        }),
      }),
    });

    const valid = await validate(validator, { user: { address: { city: "Cairo" } } });
    expect(valid.isValid).toBe(true);

    const invalid = await validate(validator, { user: { address: {} } });
    expect(invalid.isValid).toBe(false);
  });
});
