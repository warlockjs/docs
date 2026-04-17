import type { Operation, PipelineStage } from "./types";

/**
 * Helper class for constructing MongoDB aggregation pipeline operations.
 *
 * This class encapsulates the logic for creating operation objects that will be
 * converted to MongoDB aggregation stages by the query parser. It provides a
 * clean abstraction over the low-level operation structure, making the query
 * builder code more maintainable and testable.
 *
 * Each operation consists of:
 * - **stage**: The MongoDB aggregation stage name (e.g., "$match", "$project")
 * - **type**: An internal identifier for the operation type
 * - **data**: The data associated with the operation
 * - **mergeable**: Whether this operation can be merged with adjacent similar operations
 *
 * @internal This class is for internal use within the MongoDB driver
 *
 * @example
 * ```typescript
 * const operations: Operation[] = [];
 * const helper = new MongoQueryOperations(operations);
 *
 * // Add a match operation
 * helper.addMatchOperation("whereIn", { field: "status", values: ["active", "pending"] });
 *
 * // Add a project operation
 * helper.addProjectOperation("select", { fields: ["name", "email"] });
 *
 * // Operations array is now populated
 * console.log(operations);
 * // [
 * //   { stage: "$match", mergeable: true, type: "whereIn", data: {...} },
 * //   { stage: "$project", mergeable: true, type: "select", data: {...} }
 * // ]
 * ```
 */
export class MongoQueryOperations {
  /**
   * Creates a new operations helper.
   *
   * The helper maintains a reference to the operations array and populates it
   * as methods are called. This allows the query builder to maintain a single
   * ordered list of operations that will be converted to a MongoDB aggregation
   * pipeline.
   *
   * @param operations - Reference to the operations array to populate
   *
   * @example
   * ```typescript
   * const operations: Operation[] = [];
   * const helper = new MongoQueryOperations(operations);
   * ```
   */
  public constructor(private operations: Operation[]) {}

  public setOperations(operations: Operation[]): void {
    this.operations = operations;
  }

  /**
   * Adds a $match stage operation to the pipeline.
   *
   * Match operations filter documents in the aggregation pipeline, similar to
   * the WHERE clause in SQL. Multiple match operations can be merged together
   * by the parser for optimization.
   *
   * @param type - The operation type identifier (e.g., "where", "whereIn", "whereLike")
   * @param data - The operation data data containing filter criteria
   * @param mergeable - Whether this operation can be merged with adjacent match operations (default: true)
   *
   * @example
   * ```typescript
   * // Simple where operation
   * helper.addMatchOperation("where", { field: "age", operator: ">", value: 18 });
   *
   * // WhereIn operation
   * helper.addMatchOperation("whereIn", { field: "status", values: ["active", "pending"] });
   *
   * // Non-mergeable match (e.g., after a group stage)
   * helper.addMatchOperation("having", { field: "count", operator: ">", value: 5 }, false);
   * ```
   */
  public addMatchOperation(type: string, data: Record<string, unknown>, mergeable = true): void {
    this.operations.push({
      stage: "$match",
      mergeable,
      type,
      data,
    });
  }

  /**
   * Adds a $project stage operation to the pipeline.
   *
   * Project operations control which fields are included or excluded in the
   * output documents, similar to the SELECT clause in SQL. They can also be
   * used to compute new fields or reshape documents.
   *
   * @param type - The operation type identifier (e.g., "select", "deselect", "selectRaw")
   * @param data - The operation data data containing projection specifications
   * @param mergeable - Whether this operation can be merged with adjacent project operations (default: true)
   *
   * @example
   * ```typescript
   * // Select specific fields
   * helper.addProjectOperation("select", { fields: ["name", "email", "age"] });
   *
   * // Deselect fields
   * helper.addProjectOperation("deselect", { fields: ["password", "secret"] });
   *
   * // Computed field
   * helper.addProjectOperation("selectRaw", {
   *   expression: { fullName: { $concat: ["$firstName", " ", "$lastName"] } }
   * });
   * ```
   */
  public addProjectOperation(
    type: string,
    data: Record<string, unknown>,
    mergeable = true,
  ): void {
    this.operations.push({
      stage: "$project",
      mergeable,
      type,
      data,
    });
  }

  /**
   * Adds a $sort stage operation to the pipeline.
   *
   * Sort operations order the documents in the pipeline, similar to the ORDER BY
   * clause in SQL. Multiple sort operations can be merged to create compound
   * sorting.
   *
   * @param type - The operation type identifier (e.g., "orderBy", "orderByRandom")
   * @param data - The operation data data containing sort specifications
   * @param mergeable - Whether this operation can be merged with adjacent sort operations (default: true)
   *
   * @example
   * ```typescript
   * // Order by a single field
   * helper.addSortOperation("orderBy", { field: "createdAt", direction: "desc" });
   *
   * // Random ordering (not mergeable)
   * helper.addSortOperation("orderByRandom", {limit: 1000}, false);
   *
   * // Order by raw expression
   * helper.addSortOperation("orderByRaw", {
   *   expression: { score: -1, name: 1 }
   * });
   * ```
   */
  public addSortOperation(type: string, data: Record<string, unknown>, mergeable = true): void {
    this.operations.push({
      stage: "$sort",
      mergeable,
      type,
      data,
    });
  }

  /**
   * Adds a $group stage operation to the pipeline.
   *
   * Group operations aggregate documents by specified fields and compute
   * aggregate values, similar to the GROUP BY clause in SQL. Group operations
   * are typically not mergeable as they represent distinct aggregation boundaries.
   *
   * @param type - The operation type identifier (e.g., "groupBy", "distinct")
   * @param data - The operation data data containing grouping specifications
   * @param mergeable - Whether this operation can be merged with adjacent group operations (default: false)
   *
   * @example
   * ```typescript
   * // Group by a single field
   * helper.addGroupOperation("groupBy", { fields: "category" });
   *
   * // Group by multiple fields
   * helper.addGroupOperation("groupBy", {
   *   fields: { category: "$category", status: "$status" }
   * });
   *
   * // Distinct operation (special case of grouping)
   * helper.addGroupOperation("distinct", { fields: ["email"] });
   * ```
   */
  public addGroupOperation(
    type: string,
    data: Record<string, unknown>,
    mergeable = false,
  ): void {
    this.operations.push({
      stage: "$group",
      mergeable,
      type,
      data,
    });
  }

  /**
   * Adds a $lookup stage operation to the pipeline.
   *
   * Lookup operations perform left outer joins with other collections, similar
   * to JOIN in SQL. Lookup operations are never mergeable as each represents a
   * distinct join operation.
   *
   * @param type - The operation type identifier (typically "join")
   * @param data - The operation data data containing join specifications
   *
   * @example
   * ```typescript
   * // Simple lookup
   * helper.addLookupOperation("join", {
   *   table: "orders",
   *   localField: "id",
   *   foreignField: "userId",
   *   alias: "userOrders"
   * });
   *
   * // Lookup with pipeline
   * helper.addLookupOperation("join", {
   *   table: "products",
   *   pipeline: [
   *     { $match: { inStock: true } },
   *     { $sort: { price: 1 } }
   *   ],
   *   alias: "availableProducts"
   * });
   * ```
   */
  public addLookupOperation(type: string, data: Record<string, unknown>): void {
    this.operations.push({
      stage: "$lookup",
      mergeable: false,
      type,
      data,
    });
  }

  /**
   * Adds a generic stage operation to the pipeline.
   *
   * This method provides flexibility to add any MongoDB aggregation stage,
   * including less common stages like $facet, $bucket, $setWindowFields, etc.
   * Use this for operations that don't fit into the standard categories.
   *
   * @param stage - The MongoDB aggregation stage name (e.g., "$limit", "$skip", "$unwind")
   * @param type - The operation type identifier
   * @param data - The operation data data
   * @param mergeable - Whether this operation can be merged with adjacent operations (default: false)
   *
   * @example
   * ```typescript
   * // Add a limit operation
   * helper.addOperation("$limit", "limit", { value: 10 });
   *
   * // Add a skip operation
   * helper.addOperation("$skip", "skip", { value: 20 });
   *
   * // Add an unwind operation
   * helper.addOperation("$unwind", "unwind", { path: "$tags" });
   *
   * // Add a window function
   * helper.addOperation("$setWindowFields", "selectWindow", {
   *   spec: {
   *     partitionBy: "$category",
   *     sortBy: { price: 1 },
   *     output: { rank: { $rank: {} } }
   *   }
   * });
   * ```
   */
  public addOperation(
    stage: PipelineStage,
    type: string,
    data: Record<string, unknown>,
    mergeable = false,
  ): void {
    this.operations.push({
      stage,
      mergeable,
      type,
      data,
    });
  }
}
