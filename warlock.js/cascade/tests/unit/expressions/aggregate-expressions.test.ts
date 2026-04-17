import { describe, expect, it } from "vitest";
import { $agg, isAggregateExpression } from "../../../src/expressions/aggregate-expressions";

describe("Aggregate Expressions", () => {
  describe("$agg.count()", () => {
    it("should create count expression", () => {
      const expr = $agg.count();

      expect(expr).toEqual({
        __agg: "count",
        __field: null,
      });
    });
  });

  describe("$agg.sum()", () => {
    it("should create sum expression with field", () => {
      const expr = $agg.sum("price");

      expect(expr).toEqual({
        __agg: "sum",
        __field: "price",
      });
    });
  });

  describe("$agg.avg()", () => {
    it("should create avg expression with field", () => {
      const expr = $agg.avg("rating");

      expect(expr).toEqual({
        __agg: "avg",
        __field: "rating",
      });
    });
  });

  describe("$agg.min()", () => {
    it("should create min expression with field", () => {
      const expr = $agg.min("price");

      expect(expr).toEqual({
        __agg: "min",
        __field: "price",
      });
    });
  });

  describe("$agg.max()", () => {
    it("should create max expression with field", () => {
      const expr = $agg.max("price");

      expect(expr).toEqual({
        __agg: "max",
        __field: "price",
      });
    });
  });

  describe("$agg.first()", () => {
    it("should create first expression with field", () => {
      const expr = $agg.first("name");

      expect(expr).toEqual({
        __agg: "first",
        __field: "name",
      });
    });
  });

  describe("$agg.last()", () => {
    it("should create last expression with field", () => {
      const expr = $agg.last("name");

      expect(expr).toEqual({
        __agg: "last",
        __field: "name",
      });
    });
  });

  describe("$agg.distinct()", () => {
    it("should create distinct expression with field", () => {
      const expr = $agg.distinct("category");

      expect(expr).toEqual({
        __agg: "distinct",
        __field: "category",
      });
    });
  });

  describe("$agg.floor()", () => {
    it("should create floor expression with field", () => {
      const expr = $agg.floor("price");

      expect(expr).toEqual({
        __agg: "floor",
        __field: "price",
      });
    });
  });

  describe("isAggregateExpression()", () => {
    it("should correctly identify aggregate expressions", () => {
      const expr = $agg.sum("field");
      expect(isAggregateExpression(expr)).toBe(true);
    });

    it("should reject non-expressions (object without __agg)", () => {
      const notExpr = { field: "value" };
      expect(isAggregateExpression(notExpr)).toBe(false);
    });

    it("should reject non-expressions (null)", () => {
      expect(isAggregateExpression(null)).toBe(false);
    });

    it("should reject non-expressions (undefined)", () => {
      expect(isAggregateExpression(undefined)).toBe(false);
    });

    it("should reject non-expressions (string)", () => {
      expect(isAggregateExpression("count")).toBe(false);
    });

    it("should reject non-expressions (number)", () => {
      expect(isAggregateExpression(123)).toBe(false);
    });
  });

  describe("expressions are driver-agnostic", () => {
    it("should only contain structure, not driver-specific syntax", () => {
      const expr = $agg.sum("amount");

      // Should not contain MongoDB-specific syntax
      expect(JSON.stringify(expr)).not.toContain("$sum");
      // Should not contain SQL-specific syntax
      expect(JSON.stringify(expr)).not.toContain("SUM(");

      // Should only contain abstract representation
      expect(expr.__agg).toBe("sum");
      expect(expr.__field).toBe("amount");
    });
  });
});
