import { describe, expect, it } from "vitest";
import { validate } from "../../../src/factory/validate";
import { v } from "../../../src/factory/validators";
import { ComputedValidator } from "../../../src/validators/computed-validator";
import { ManagedValidator } from "../../../src/validators/managed-validator";

describe("ComputedValidator", () => {
  it("should compute value from input data", async () => {
    const validator = new ComputedValidator((data) => {
      return data.val * 2;
    });

    const result = await validate(validator, { val: 5 });
    expect(result.isValid).toBe(true);
    expect(result.data).toBe(10);
  });

  it("should validate computed result", async () => {
    const validator = new ComputedValidator(
      (data) => data.val * 2,
      v.number().min(15), // Result must be >= 15
    );

    expect((await validate(validator, { val: 5 })).isValid).toBe(false); // 10 < 15
    expect((await validate(validator, { val: 8 })).isValid).toBe(true); // 16 >= 15
  });

  it("should handle async computation", async () => {
    const validator = new ComputedValidator(async (data) => {
      return Promise.resolve(data.val + 1);
    });

    const result = await validate(validator, { val: 1 });
    expect(result.data).toBe(2);
  });
});

describe("ManagedValidator", () => {
  it("should generate value independent of input data", async () => {
    const validator = new ManagedValidator(() => "generated");

    // Input data doesn't matter for the callback execution itself,
    // though validate() passes it through. ManagedValidator callback signature is (context).
    const result = await validate(validator, { any: "thing" });
    expect(result.data).toBe("generated");
  });

  it("should validate managed result", async () => {
    const validator = new ManagedValidator(() => 10, v.number().min(5));

    expect((await validate(validator, {})).isValid).toBe(true);
  });
});
