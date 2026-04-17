/**
 * Database-agnostic aggregation expressions.
 *
 * These helpers provide a unified API for building aggregate queries that work
 * across different database types (MongoDB, PostgreSQL, MySQL, etc.).
 *
 * Each driver implementation translates these abstract expressions to their
 * native format:
 * - MongoDB: { $sum: 1 }, { $sum: "$field" }, etc.
 * - SQL: COUNT(*), SUM(field), etc.
 *
 * @example
 * ```typescript
 * import { $agg } from '@warlock.js/cascade';
 *
 * // Works for both MongoDB and SQL
 * Lesson.query()
 *   .groupBy("type", {
 *     count: $agg.count(),
 *     total: $agg.sum("duration"),
 *     avg: $agg.avg("rating")
 *   })
 *   .get();
 * ```
 */

/**
 * Abstract aggregate expression format.
 *
 * This format is database-agnostic and will be translated by each driver
 * to their native syntax.
 */
export type AggregateExpression = {
  /** The aggregate function type */
  __agg: AggregateFunction;
  /** The field to aggregate (null for count) */
  __field: string | null;
};

/**
 * Supported aggregate functions.
 */
export type AggregateFunction =
  | "count"
  | "sum"
  | "avg"
  | "min"
  | "max"
  | "first"
  | "last"
  | "distinct"
  | "floor";

/**
 * Checks if a value is an abstract aggregate expression.
 */
export function isAggregateExpression(value: unknown): value is AggregateExpression {
  return (
    typeof value === "object" &&
    value !== null &&
    "__field" in value &&
    typeof (value as AggregateExpression).__agg === "string"
  );
}

/**
 * Database-agnostic aggregation expression helpers.
 *
 * These helpers create abstract expressions that each driver translates
 * to their native format.
 */
export const $agg = {
  /**
   * Count documents in each group.
   *
   * @returns Abstract count expression
   *
   * @example
   * ```typescript
   * query.groupBy("type", {
   *   count: $agg.count()
   * });
   * ```
   *
   * Translates to:
   * - MongoDB: `{ $sum: 1 }`
   * - SQL: `COUNT(*)`
   */
  count(): AggregateExpression {
    return { __agg: "count", __field: null };
  },

  /**
   * Sum a numeric field across documents in each group.
   *
   * @param field - The field name to sum
   * @returns Abstract sum expression
   *
   * @example
   * ```typescript
   * query.groupBy("type", {
   *   totalDuration: $agg.sum("duration")
   * });
   * ```
   *
   * Translates to:
   * - MongoDB: `{ $sum: "$duration" }`
   * - SQL: `SUM(duration)`
   */
  sum(field: string): AggregateExpression {
    return { __agg: "sum", __field: field };
  },

  /**
   * Calculate the average value of a field across documents in each group.
   *
   * @param field - The field name to average
   * @returns Abstract average expression
   *
   * @example
   * ```typescript
   * query.groupBy("type", {
   *   avgRating: $agg.avg("rating")
   * });
   * ```
   *
   * Translates to:
   * - MongoDB: `{ $avg: "$rating" }`
   * - SQL: `AVG(rating)`
   */
  avg(field: string): AggregateExpression {
    return { __agg: "avg", __field: field };
  },

  /**
   * Get the minimum value of a field across documents in each group.
   *
   * @param field - The field name
   * @returns Abstract min expression
   *
   * @example
   * ```typescript
   * query.groupBy("type", {
   *   minPrice: $agg.min("price")
   * });
   * ```
   *
   * Translates to:
   * - MongoDB: `{ $min: "$price" }`
   * - SQL: `MIN(price)`
   */
  min(field: string): AggregateExpression {
    return { __agg: "min", __field: field };
  },

  /**
   * Get the maximum value of a field across documents in each group.
   *
   * @param field - The field name
   * @returns Abstract max expression
   *
   * @example
   * ```typescript
   * query.groupBy("type", {
   *   maxPrice: $agg.max("price")
   * });
   * ```
   *
   * Translates to:
   * - MongoDB: `{ $max: "$price" }`
   * - SQL: `MAX(price)`
   */
  max(field: string): AggregateExpression {
    return { __agg: "max", __field: field };
  },

  /**
   * Get the distinct values of a field across documents in each group.
   *
   * @param field - The field name
   * @returns Abstract distinct expression
   *
   * @example
   * ```typescript
   * query.groupBy("type", {
   *   distinctColors: $agg.distinct("color")
   * });
   * ```
   *
   * Translates to:
   * - MongoDB: `{ $distinct: "$color" }`
   * - SQL: `DISTINCT(color)`
   */
  distinct(field: string): AggregateExpression {
    return { __agg: "distinct", __field: field };
  },

  /**
   * Get the floor value of a field across documents in each group.
   *
   * @param field - The field name
   * @returns Abstract floor expression
   *
   * @example
   * ```typescript
   * query.groupBy("type", {
   *   floorPrice: $agg.floor("price")
   * });
   * ```
   *
   * Translates to:
   * - MongoDB: `{ $floor: "$price" }`
   * - SQL: `FLOOR(price)`
   */
  floor(field: string): AggregateExpression {
    return { __agg: "floor", __field: field };
  },

  /**
   * Get the first value of a field in each group (order-dependent).
   *
   * @param field - The field name
   * @returns Abstract first expression
   *
   * @example
   * ```typescript
   * query.groupBy("type", {
   *   firstName: $agg.first("name")
   * });
   * ```
   *
   * Translates to:
   * - MongoDB: `{ $first: "$name" }`
   * - SQL: `FIRST_VALUE(name) OVER (...)`
   */
  first(field: string): AggregateExpression {
    return { __agg: "first", __field: field };
  },

  /**
   * Get the last value of a field in each group (order-dependent).
   *
   * @param field - The field name
   * @returns Abstract last expression
   *
   * @example
   * ```typescript
   * query.groupBy("type", {
   *   lastName: $agg.last("name")
   * });
   * ```
   *
   * Translates to:
   * - MongoDB: `{ $last: "$name" }`
   * - SQL: `LAST_VALUE(name) OVER (...)`
   */
  last(field: string): AggregateExpression {
    return { __agg: "last", __field: field };
  },
};
