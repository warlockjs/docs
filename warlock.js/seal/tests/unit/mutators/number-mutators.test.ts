import { describe, expect, it } from "vitest";
import {
  booleanMutator,
  numberMutator,
  roundNumberMutator,
} from "../../../src/mutators/number-mutators";

// Mock context for mutators
function createMockMutatorContext(options: any = {}): any {
  return {
    options,
    ctx: {} as any,
  };
}

describe("Number Mutators", () => {
  it("numberMutator should convert string to number", async () => {
    const result = await numberMutator("123", createMockMutatorContext());
    expect(result).toBe(123);
  });

  it("roundNumberMutator should round to default decimals", async () => {
    const result = await roundNumberMutator(10.126, createMockMutatorContext());
    expect(result).toBe(10.12);
  });

  it("roundNumberMutator should round to specified decimals", async () => {
    const result = await roundNumberMutator(10.5561, createMockMutatorContext({ decimals: 3 }));
    expect(result).toBe(10.556);
  });

  it("booleanMutator should convert string 'true' to boolean true", async () => {
    const result = await booleanMutator("true", createMockMutatorContext());
    expect(result).toBe(true);
  });
});
