import { describe, expect, it } from "vitest";
import {
  lowercaseMutator,
  trimMutator,
  uppercaseMutator,
} from "../../../src/mutators/string-mutators";

// Mock context for mutators
function createMockMutatorContext(options: any = {}): any {
  return {
    options,
    ctx: {} as any,
  };
}

describe("String Mutators", () => {
  it("lowercaseMutator should convert to lowercase", async () => {
    const result = await lowercaseMutator("TEST", createMockMutatorContext());
    expect(result).toBe("test");
  });

  it("uppercaseMutator should convert to uppercase", async () => {
    const result = await uppercaseMutator("test", createMockMutatorContext());
    expect(result).toBe("TEST");
  });

  it("trimMutator should trim whitespace", async () => {
    const result = await trimMutator("  test  ", createMockMutatorContext());
    expect(result).toBe("test");
  });
});
