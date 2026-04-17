import { describe, expect, it } from "vitest";
import {
  addDaysMutator,
  addHoursMutator,
  addMonthsMutator,
  addYearsMutator,
  toEndOfDayMutator,
  toEndOfMonthMutator,
  toEndOfYearMutator,
  toStartOfDayMutator,
  toStartOfMonthMutator,
  toStartOfYearMutator,
} from "../../../src/mutators/date-mutators";

describe("Date Mutators", () => {
  // Use local time construction to match getHours/toStartOfDay behavior which uses local time
  const baseDate = new Date(2023, 0, 15, 12, 0, 0);

  const runMutator = async (mutator: any, value: any, options: any = {}) => {
    const context: any = { options };
    return await mutator(value, context);
  };

  it("should add days", async () => {
    const result = await runMutator(addDaysMutator, baseDate, { days: 5 });
    expect(result.getDate()).toBe(20);
  });

  it("should add months", async () => {
    const result = await runMutator(addMonthsMutator, baseDate, { months: 1 });
    expect(result.getMonth()).toBe(1); // February (0-indexed is 1)
  });

  it("should add years", async () => {
    const result = await runMutator(addYearsMutator, baseDate, { years: 1 });
    expect(result.getFullYear()).toBe(2024);
  });

  it("should add hours", async () => {
    const result = await runMutator(addHoursMutator, baseDate, { hours: 2 });
    expect(result.getHours()).toBe(14); // UTC hours might differ locally, but relative change holds
  });

  it("should set to start of day", async () => {
    const result = await runMutator(toStartOfDayMutator, baseDate);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });

  it("should set to end of day", async () => {
    const result = await runMutator(toEndOfDayMutator, baseDate);
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
  });

  it("should set to start/end of month", async () => {
    const start = await runMutator(toStartOfMonthMutator, baseDate);
    expect(start.getDate()).toBe(1);

    const end = await runMutator(toEndOfMonthMutator, baseDate); // Jan 31
    expect(end.getDate()).toBe(31);
  });

  it("should set to start/end of year", async () => {
    const start = await runMutator(toStartOfYearMutator, baseDate);
    expect(start.getMonth()).toBe(0);
    expect(start.getDate()).toBe(1);

    const end = await runMutator(toEndOfYearMutator, baseDate);
    expect(end.getMonth()).toBe(11);
    expect(end.getDate()).toBe(31);
  });
});
