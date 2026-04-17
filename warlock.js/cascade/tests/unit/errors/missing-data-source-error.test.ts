import { describe, expect, it } from "vitest";
import { MissingDataSourceError } from "../../../src/errors/missing-data-source.error";

describe("MissingDataSourceError", () => {
  it("should extend Error", () => {
    const error = new MissingDataSourceError("Test error");
    expect(error).toBeInstanceOf(Error);
  });

  it("should set error message correctly", () => {
    const message = "Data source not found";
    const error = new MissingDataSourceError(message);

    expect(error.message).toBe(message);
  });

  it("should set dataSourceName property when provided", () => {
    const dataSourceName = "primary";
    const error = new MissingDataSourceError("Not found", dataSourceName);

    expect(error.dataSourceName).toBe(dataSourceName);
  });

  it("should have name property set to 'MissingDataSourceError'", () => {
    const error = new MissingDataSourceError("Test");

    expect(error.name).toBe("MissingDataSourceError");
  });

  it("should capture stack trace correctly", () => {
    const error = new MissingDataSourceError("Test");

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain("MissingDataSourceError");
  });

  it("should handle undefined dataSourceName", () => {
    const error = new MissingDataSourceError("No default data source");

    expect(error.dataSourceName).toBeUndefined();
  });
});
