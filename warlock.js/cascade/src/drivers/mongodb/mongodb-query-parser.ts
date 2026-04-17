import { colors } from "@mongez/copper";
import type { Collection } from "mongodb";
import type { GroupByInput, RawExpression, WhereOperator } from "../../contracts";
import {
  isAggregateExpression,
  type AggregateExpression,
} from "../../expressions/aggregate-expressions";
import type { MongoQueryBuilder } from "./mongodb-query-builder";
import type { Operation, PipelineStage } from "./types";

/**
 * Options for configuring the MongoDB query parser.
 */
export type MongoQueryParserOptions = {
  /** The MongoDB collection being queried */
  collection: Collection;
  /** The ordered list of operations to parse */
  operations: Operation[];
  /** Factory method for creating sub-builders (used for callbacks) */
  createSubBuilder: () => MongoQueryBuilder;
};

/**
 * Parses query builder operations into MongoDB aggregation pipeline.
 *
 * This parser is responsible for converting the abstract operations collected
 * by the query builder into a concrete MongoDB aggregation pipeline. It handles
 * intelligent grouping of mergeable operations (like multiple where clauses)
 * into single pipeline stages for optimal performance.
 */
export class MongoQueryParser {
  /**
   * The MongoDB collection being queried.
   */
  private readonly collection: Collection;

  /**
   * The ordered list of operations to parse.
   */
  private readonly operations: Operation[];

  /**
   * Factory for creating sub-builders (used when resolving callbacks).
   */
  private readonly createSubBuilder: () => MongoQueryBuilder;

  /**
   * Track group field names for automatic _id renaming.
   * Maps pipeline index to field names.
   */
  private readonly groupFieldNames = new Map<number, string | string[]>();

  /**
   * Create a new MongoDB query parser.
   *
   * @param options - Configuration options for the parser
   */
  public constructor(options: MongoQueryParserOptions) {
    this.collection = options.collection;
    this.operations = options.operations;
    this.createSubBuilder = options.createSubBuilder;
  }

  /**
   * Parse the operations into a MongoDB aggregation pipeline.
   *
   * This method intelligently groups mergeable operations (e.g., multiple where
   * clauses) into single pipeline stages while maintaining the correct execution
   * order for non-mergeable operations.
   *
   * @returns The MongoDB aggregation pipeline
   *
   * @example
   * ```typescript
   * const parser = new MongoQueryParser({ collection, operations });
   * const pipeline = parser.parse();
   * // [
   * //   { $match: { status: 'active', age: { $gt: 18 } } },
   * //   { $sort: { createdAt: -1 } },
   * //   { $limit: 10 }
   * // ]
   * ```
   */
  public parse(): any[] {
    const pipeline: any[] = [];
    let currentStage: PipelineStage | null = null;
    let currentBuffer: Operation[] = [];

    for (const op of this.operations) {
      if (op.mergeable && op.stage === currentStage) {
        // Same mergeable stage, add to buffer
        currentBuffer.push(op);
      } else {
        // Different stage or non-mergeable, flush buffer
        if (currentBuffer.length > 0) {
          const builtStage = this.buildStage(currentStage!, currentBuffer);
          if (builtStage) {
            const stageIndex = pipeline.length;
            pipeline.push(builtStage);
            // Track field names for group stages with aggregates
            this.trackGroupFieldNames(currentStage!, currentBuffer, stageIndex);
          }
          currentBuffer = [];
        }

        if (op.mergeable) {
          // Start new buffer
          currentStage = op.stage;
          currentBuffer.push(op);
        } else {
          // Non-mergeable, add directly
          const builtStage = this.buildStage(op.stage, [op]);
          if (builtStage) {
            const stageIndex = pipeline.length;
            pipeline.push(builtStage);
            // Track field names for group stages with aggregates
            this.trackGroupFieldNames(op.stage, [op], stageIndex);
          }
          currentStage = null;
        }
      }
    }

    // Flush remaining buffer
    if (currentBuffer.length > 0) {
      const builtStage = this.buildStage(currentStage!, currentBuffer);
      if (builtStage) {
        const stageIndex = pipeline.length;
        pipeline.push(builtStage);
        // Track field names for group stages with aggregates
        this.trackGroupFieldNames(currentStage!, currentBuffer, stageIndex);
      }
    }

    // Post-process: Rename _id to actual field names after $group stages with aggregates
    return this.postProcessGroupStages(pipeline);
  }

  /**
   * Track field names for group stages that need _id renaming.
   */
  private trackGroupFieldNames(
    stage: PipelineStage,
    operations: Operation[],
    stageIndex: number,
  ): void {
    if (stage === "$group") {
      const op = operations[0];
      if (op.type === "groupByWithAggregates" && op.data.fields) {
        const fieldNames = this.extractGroupFieldNames(op.data.fields);
        if (fieldNames) {
          this.groupFieldNames.set(stageIndex, fieldNames);
        }
      }
    }
  }

  /**
   * Post-process pipeline to rename _id fields after $group stages.
   *
   * This automatically renames MongoDB's `_id` field to the actual field name(s)
   * used for grouping, making the results more intuitive.
   *
   * @param pipeline - The aggregation pipeline
   * @returns The processed pipeline
   */
  private postProcessGroupStages(pipeline: any[]): any[] {
    const processed: any[] = [];

    for (let i = 0; i < pipeline.length; i++) {
      const stage = pipeline[i];

      // Check if this is a $group stage that needs _id renaming
      if (stage.$group && this.groupFieldNames.has(i)) {
        const fieldNames = this.groupFieldNames.get(i)!;

        // Add the $group stage
        processed.push(stage);

        // Add a $project stage to rename _id
        const projection: Record<string, unknown> = {};

        if (typeof fieldNames === "string") {
          // Single field: rename _id to field name
          projection[fieldNames] = "$_id";
        } else if (Array.isArray(fieldNames) && fieldNames.length > 0) {
          // Multiple fields: _id is an object, spread it
          for (const fieldName of fieldNames) {
            projection[fieldName] = `$_id.${fieldName}`;
          }
        }

        // Include all aggregate fields
        const aggregateFields = Object.keys(stage.$group).filter((key) => key !== "_id");
        for (const field of aggregateFields) {
          projection[field] = 1;
        }

        if (Object.keys(projection).length > 0) {
          // now unselect the _id field
          projection._id = 0;
          processed.push({ $project: projection });
        }
      } else {
        // Regular stage, add as-is
        processed.push(stage);
      }
    }

    return processed;
  }

  /**
   * Convert the parsed pipeline to a pretty-printed string for debugging.
   *
   * This method formats the MongoDB aggregation pipeline in a human-readable
   * way, making it easier to understand and debug complex queries.
   *
   * @returns A formatted string representation of the pipeline
   *
   * @example
   * ```typescript
   * const parser = new MongoQueryParser({ collection, operations });
   * console.log(parser.toPrettyString());
   * // Output:
   * // MongoDB Aggregation Pipeline:
   * // ════════════════════════════
   * // Stage 1: $match
   * //   status: "active"
   * //   age: { $gt: 18 }
   * //
   * // Stage 2: $sort
   * //   createdAt: -1
   * ```
   */
  public toPrettyString(): string {
    const pipeline = this.parse();

    if (pipeline.length === 0) {
      return "MongoDB Aggregation Pipeline: (empty)";
    }

    let output = "MongoDB Aggregation Pipeline:\n";
    output += "═".repeat(50) + "\n";

    pipeline.forEach((stage, index) => {
      const stageName = Object.keys(stage)[0];
      const stageData = stage[stageName];

      if (index > 0) {
        output += "\n";
      }

      output += `Stage ${index + 1}: ${colors.redBright(stageName)}\n`;
      output += this.formatStageData(stageData, 2);
    });

    return output;
  }

  /**
   * Format stage data with proper indentation.
   *
   * @param data - The stage data to format
   * @param indent - The indentation level
   * @returns Formatted string
   */
  private formatStageData(data: any, indent: number = 0): string {
    const spaces = " ".repeat(indent);

    if (typeof data !== "object" || data === null) {
      return `${spaces}${JSON.stringify(data)}\n`;
    }

    if (Array.isArray(data)) {
      if (data.length === 0) return `${spaces}[]`;

      let result = "";
      data.forEach((item, index) => {
        result += `${spaces}[${colors.magenta(index)}]:\n`;
        result += this.formatStageData(item, indent + 2);
      });
      return result;
    }

    let result = "";
    Object.entries(data).forEach(([key, value]) => {
      const isOperator = key.startsWith("$");
      const coloredKey = isOperator ? colors.magentaBright(key) : colors.blue(key);

      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        result += `${spaces}${coloredKey}:\n`;
        result += this.formatStageData(value, indent + 2);
      } else if (Array.isArray(value)) {
        result += `${spaces}${coloredKey}:\n`;
        result += this.formatStageData(value, indent + 2);
      } else {
        const formattedValue =
          typeof value === "number"
            ? colors.yellowBright(value)
            : typeof value === "boolean"
              ? colors.cyanBright(value.toString())
              : typeof value === "string"
                ? colors.greenBright(JSON.stringify(value))
                : colors.greenBright(String(value));
        result += `${spaces}${coloredKey}: ${formattedValue}\n`;
      }
    });

    return result.endsWith("\n") ? result : `${result}\n`;
  }

  /**
   * Build a single pipeline stage from a group of operations.
   *
   * @param stage - The pipeline stage type
   * @param operations - The operations to build the stage from
   * @returns The built pipeline stage or null if no stage should be added
   */
  private buildStage(stage: PipelineStage, operations: Operation[]): any {
    switch (stage) {
      case "$match":
        return this.buildMatchStage(operations);
      case "$project":
        return this.buildProjectStage(operations);
      case "$sort":
        return this.buildSortStage(operations);
      case "$group":
        return this.buildGroupStage(operations);
      case "$lookup":
        return this.buildLookupStage(operations);
      case "$limit":
        return { $limit: operations[0].data.value };
      case "$skip":
        return { $skip: operations[0].data.value };
      case "$setWindowFields":
        return {
          $setWindowFields: operations[0].data.spec,
        };
      default:
        return null;
    }
  }

  /**
   * Build a $match stage from where operations.
   *
   * Query building strategy:
   * - Top-level where() + orWhere() = Pure OR
   * - Use callbacks for AND + OR grouping
   *
   * @param operations - The where operations
   * @returns The $match stage or null
   */
  private buildMatchStage(operations: Operation[]): any {
    const andFilter: Record<string, any> = {};
    const orClauses: any[] = [];
    const pendingSimpleWhere: any[] = [];
    let topLevelOrMode = false;

    const pushOr = (clause: any): void => {
      if (!clause) {
        return;
      }

      if (this.isPureOrCondition(clause)) {
        orClauses.push(...clause.$or);
        return;
      }

      if (Array.isArray(clause)) {
        orClauses.push(...clause);
        return;
      }

      orClauses.push(clause);
    };

    const mergeAnd = (condition: any): void => {
      if (!condition) {
        return;
      }

      Object.entries(condition).forEach(([key, value]) => {
        if (key === "$or") {
          pushOr(value);
          return;
        }

        if (
          value &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          andFilter[key] &&
          typeof andFilter[key] === "object" &&
          !Array.isArray(andFilter[key])
        ) {
          andFilter[key] = { ...andFilter[key], ...value };
        } else {
          andFilter[key] = value;
        }
      });
    };

    const queueSimpleWhere = (condition: any): void => {
      if (!condition) {
        return;
      }
      if (topLevelOrMode) {
        pushOr(condition);
      } else {
        pendingSimpleWhere.push(condition);
      }
    };

    const enterTopLevelOrMode = (): void => {
      if (topLevelOrMode) {
        return;
      }
      topLevelOrMode = true;
      while (pendingSimpleWhere.length > 0) {
        const condition = pendingSimpleWhere.shift();
        if (condition) {
          pushOr(condition);
        }
      }
    };

    const flushPendingSimpleWhere = (): void => {
      if (pendingSimpleWhere.length === 0) {
        return;
      }
      if (topLevelOrMode) {
        pendingSimpleWhere.forEach(pushOr);
      } else {
        pendingSimpleWhere.forEach(mergeAnd);
      }
      pendingSimpleWhere.length = 0;
    };

    for (const op of operations) {
      if (op.type === "where:callback" || op.type === "orWhere:callback") {
        flushPendingSimpleWhere();
        const callbackCondition = this.buildCallbackCondition(op.data);
        if (!callbackCondition) {
          continue;
        }

        const treatAsOr =
          op.type === "orWhere:callback" ||
          (topLevelOrMode && !this.isPureOrCondition(callbackCondition)) ||
          this.isPureOrCondition(callbackCondition);

        if (treatAsOr) {
          if (op.type === "orWhere:callback") {
            enterTopLevelOrMode();
          }
          pushOr(callbackCondition);
        } else {
          mergeAnd(callbackCondition);
        }
        continue;
      }

      if (op.type === "where:object") {
        queueSimpleWhere(op.data);
        continue;
      }

      if (
        op.type === "where:not" ||
        op.type === "orWhere:not" ||
        op.type === "where:exists" ||
        op.type === "where:notExists"
      ) {
        const negated = op.type === "where:not" || op.type === "where:notExists";
        const nested = this.buildCallbackCondition(op.data.callback);
        if (nested) {
          const condition = negated ? { $nor: [nested] } : nested;
          if (op.type.startsWith("orWhere")) {
            enterTopLevelOrMode();
            pushOr(condition);
          } else {
            queueSimpleWhere(condition);
          }
        }
        continue;
      }

      if (op.type === "orWhere:object") {
        enterTopLevelOrMode();
        pushOr(op.data);
        continue;
      }

      const condition = this.buildWhereCondition(op);
      if (!condition) {
        continue;
      }

      if (op.type.startsWith("orWhere")) {
        enterTopLevelOrMode();
        pushOr(condition);
      } else {
        queueSimpleWhere(condition);
      }
    }

    flushPendingSimpleWhere();

    const hasAnd = Object.keys(andFilter).length > 0;
    const hasOr = orClauses.length > 0;

    if (!hasAnd && !hasOr) {
      return null;
    }

    const match: any = {};
    if (hasAnd) {
      Object.assign(match, andFilter);
    }
    if (hasOr) {
      match.$or = orClauses;
    }

    return { $match: match };
  }

  private isPureOrCondition(condition: any): condition is { $or: any[] } {
    return (
      condition &&
      typeof condition === "object" &&
      !Array.isArray(condition) &&
      Object.keys(condition).length === 1 &&
      Array.isArray((condition as any).$or)
    );
  }

  /**
   * Build a condition from a callback-based where clause.
   * Creates a sub-builder, executes the callback, and extracts the conditions.
   * If callback has orWhere, all conditions become OR.
   *
   * @param callback - The callback function
   * @returns The built condition or null
   */
  private buildCallbackCondition(callback: any): any {
    // Create a temporary sub-builder
    const subBuilder = this.createSubBuilder();

    // Execute the callback with the sub-builder
    callback(subBuilder);

    // Extract only match operations from the sub-builder
    const matchOps = subBuilder.operations.filter((op: Operation) => op.stage === "$match");

    if (matchOps.length === 0) {
      return null;
    }

    const andFilter: Record<string, any> = {};
    const orClauses: any[] = [];
    const hasInternalOr = matchOps.some((op) => op.type.startsWith("orWhere"));

    const pushOr = (clause: any): void => {
      if (!clause) {
        return;
      }
      if (this.isPureOrCondition(clause)) {
        orClauses.push(...clause.$or);
        return;
      }
      orClauses.push(clause);
    };

    if (hasInternalOr) {
      for (const op of matchOps) {
        if (op.type === "where:callback" || op.type === "orWhere:callback") {
          const nestedCondition = this.buildCallbackCondition(op.data);
          if (nestedCondition) {
            pushOr(nestedCondition);
          }
          continue;
        }

        if (op.type === "where:object" || op.type === "orWhere:object") {
          pushOr(op.data);
          continue;
        }

        const condition = this.buildWhereCondition(op);
        if (condition) {
          pushOr(condition);
        }
      }

      return orClauses.length > 0 ? { $or: orClauses } : null;
    }

    for (const op of matchOps) {
      if (op.type === "where:callback") {
        const nestedCondition = this.buildCallbackCondition(op.data);
        if (nestedCondition) {
          Object.assign(andFilter, nestedCondition);
        }
      } else if (op.type === "where:object") {
        Object.assign(andFilter, op.data);
      } else {
        const condition = this.buildWhereCondition(op);
        if (condition) {
          Object.assign(andFilter, condition);
        }
      }
    }

    return Object.keys(andFilter).length > 0 ? andFilter : null;
  }

  /**
   * Build a MongoDB filter condition from a where operation.
   *
   * @param op - The operation to build
   * @returns The MongoDB filter condition
   */
  private buildWhereCondition(op: Operation): any {
    const { field, operator, value } = op.data;

    switch (op.type) {
      case "where":
      case "orWhere":
        return this.buildOperatorCondition(field, operator, value);

      case "whereIn":
        return { [field]: { $in: value || op.data.values } };

      case "whereNotIn":
        return { [field]: { $nin: value || op.data.values } };

      case "whereNull":
        return { [field]: null };

      case "whereNotNull":
        return { [field]: { $ne: null } };

      case "whereBetween":
        return {
          [field]: {
            $gte: op.data.range[0],
            $lte: op.data.range[1],
          },
        };

      case "whereNotBetween":
        return {
          [field]: {
            $not: {
              $gte: op.data.range[0],
              $lte: op.data.range[1],
            },
          },
        };

      case "whereLike": {
        const pattern =
          typeof op.data.pattern === "string" ? op.data.pattern : op.data.pattern.source;
        return { [field]: { $regex: pattern, $options: "i" } };
      }

      case "whereNotLike": {
        const notPattern =
          typeof op.data.pattern === "string" ? op.data.pattern : op.data.pattern.source;
        return { [field]: { $not: { $regex: notPattern, $options: "i" } } };
      }

      case "whereStartsWith":
        return { [field]: { $regex: `^${op.data.value}`, $options: "i" } };

      case "whereNotStartsWith":
        return {
          [field]: { $not: { $regex: `^${op.data.value}`, $options: "i" } },
        };

      case "whereEndsWith":
        return { [field]: { $regex: `${op.data.value}$`, $options: "i" } };

      case "whereNotEndsWith":
        return {
          [field]: { $not: { $regex: `${op.data.value}$`, $options: "i" } },
        };

      case "whereExists":
        return { [field]: { $exists: true } };

      case "whereNotExists":
        return { [field]: { $exists: false } };

      case "whereSize":
        if (op.data.operator === "=") {
          return { [field]: { $size: op.data.size } };
        } else {
          const mongoOp = this.getMongoOperator(op.data.operator);
          return {
            $expr: {
              [mongoOp]: [{ $size: `$${field}` }, op.data.size],
            },
          };
        }

      case "textSearch":
        return {
          $text: { $search: op.data.query },
          ...(op.data.filters || {}),
        };

      case "whereRaw":
      case "orWhereRaw":
        return this.resolveRawExpression(
          op.data.expression as RawExpression,
          op.data.bindings,
        );

      case "whereColumn":
      case "orWhereColumn":
        return this.buildColumnComparison(op.data.first, op.data.operator, op.data.second);

      case "whereBetweenColumns":
        return this.buildBetweenColumnsCondition(
          op.data.field,
          op.data.lowerColumn,
          op.data.upperColumn,
        );

      case "whereDate":
      case "whereDateEquals":
        return this.buildDateEqualityCondition(op.data.field, op.data.value);

      case "whereDateBefore":
        return this.buildDateBeforeCondition(op.data.field, op.data.value);

      case "whereDateAfter":
        return this.buildDateAfterCondition(op.data.field, op.data.value);

      case "whereTime":
        return this.buildTimeCondition(op.data.field, op.data.value);

      case "whereDay":
        return this.buildDatePartCondition(op.data.field, "$dayOfMonth", op.data.value);

      case "whereMonth":
        return this.buildDatePartCondition(op.data.field, "$month", op.data.value);

      case "whereYear":
        return this.buildDatePartCondition(op.data.field, "$year", op.data.value);

      case "whereJsonContains":
        return this.buildJsonContainsCondition(op.data.path, op.data.value);

      case "whereJsonDoesntContain":
        return this.buildJsonDoesntContainCondition(op.data.path, op.data.value);

      case "whereJsonContainsKey":
        return this.buildJsonContainsKeyCondition(op.data.path);

      case "whereJsonLength":
        return this.buildJsonLengthCondition(
          op.data.path,
          op.data.operator,
          op.data.value,
        );

      case "whereJsonIsArray":
        return this.buildJsonTypeCondition(op.data.path, "array");

      case "whereJsonIsObject":
        return this.buildJsonTypeCondition(op.data.path, "object");

      case "whereArrayLength":
        return this.buildArrayLengthCondition(
          op.data.field,
          op.data.operator,
          op.data.value,
        );

      case "whereFullText":
      case "orWhereFullText":
        return { $text: { $search: op.data.query } };

      case "whereSearch":
        return {
          [op.data.field]: {
            $regex: op.data.query,
            $options: "i",
          },
        };

      case "where:not":
      case "orWhere:not": {
        const nestedNot = this.buildCallbackCondition(op.data.callback);
        return nestedNot ? { $nor: [nestedNot] } : null;
      }

      case "where:exists":
        return this.buildCallbackCondition(op.data.callback);

      case "where:notExists": {
        const nestedExists = this.buildCallbackCondition(op.data.callback);
        return nestedExists ? { $nor: [nestedExists] } : null;
      }

      case "whereArrayContains":
        if (op.data.key) {
          return {
            [field]: {
              $elemMatch: { [op.data.key]: op.data.value },
            },
          };
        } else {
          return { [field]: op.data.value };
        }

      default:
        return null;
    }
  }

  /**
   * Build a condition based on the operator.
   *
   * @param field - The field name
   * @param operator - The comparison operator
   * @param value - The value to compare
   * @returns The MongoDB filter condition
   */
  private buildOperatorCondition(field: string, operator: string, value: unknown): any {
    switch (operator) {
      case "=":
        return { [field]: value };
      case "!=":
        return { [field]: { $ne: value } };
      case ">":
        return { [field]: { $gt: value } };
      case ">=":
        return { [field]: { $gte: value } };
      case "<":
        return { [field]: { $lt: value } };
      case "<=":
        return { [field]: { $lte: value } };
      default:
        return { [field]: value };
    }
  }

  /**
   * Get MongoDB operator from comparison operator.
   *
   * @param operator - The comparison operator
   * @returns The MongoDB operator
   */
  private getMongoOperator(operator: string): string {
    const map: Record<string, string> = {
      "=": "$eq",
      "!=": "$ne",
      ">": "$gt",
      ">=": "$gte",
      "<": "$lt",
      "<=": "$lte",
    };
    return map[operator] || "$eq";
  }

  private resolveRawExpression(expression: RawExpression, bindings?: unknown[]): any {
    if (typeof expression === "string") {
      const bound = this.bindRawString(expression, bindings);
      return { $where: bound };
    }

    if (typeof expression === "object" && expression !== null) {
      return expression;
    }

    return null;
  }

  private bindRawString(expression: string, bindings?: unknown[]): string {
    if (!bindings || bindings.length === 0) {
      return expression;
    }

    let index = 0;
    return expression.replace(/\?/g, () => {
      const value = bindings[index++];
      return value === undefined ? "?" : JSON.stringify(value);
    });
  }

  private buildColumnComparison(first: string, operator: WhereOperator, second: string): any {
    const mongoOperator = this.getMongoOperator(operator);
    return {
      $expr: {
        [mongoOperator]: [this.wrapColumn(first), this.wrapColumn(second)],
      },
    };
  }

  private buildBetweenColumnsCondition(field: string, lower: string, upper: string): any {
    return {
      $expr: {
        $and: [
          { $gte: [this.wrapColumn(field), this.wrapColumn(lower)] },
          { $lte: [this.wrapColumn(field), this.wrapColumn(upper)] },
        ],
      },
    };
  }

  private wrapColumn(column: string): string {
    return column.startsWith("$") ? column : `$${column}`;
  }

  private buildDateEqualityCondition(field: string, value: Date | string): any {
    const target = this.normalizeDateInput(value);
    const start = this.startOfDay(target);
    const end = this.endOfDay(target);
    return { [field]: { $gte: start, $lte: end } };
  }

  private buildDateBeforeCondition(field: string, value: Date | string): any {
    const target = this.startOfDay(this.normalizeDateInput(value));
    return { [field]: { $lt: target } };
  }

  private buildDateAfterCondition(field: string, value: Date | string): any {
    const target = this.endOfDay(this.normalizeDateInput(value));
    return { [field]: { $gt: target } };
  }

  private buildTimeCondition(field: string, value: string): any {
    return {
      $expr: {
        $eq: [
          {
            $dateToString: {
              format: "%H:%M",
              date: `$${field}`,
            },
          },
          value,
        ],
      },
    };
  }

  private buildDatePartCondition(
    field: string,
    operator: "$dayOfMonth" | "$month" | "$year",
    value: number,
  ): any {
    return {
      $expr: {
        $eq: [
          {
            [operator]: `$${field}`,
          },
          value,
        ],
      },
    };
  }

  private buildJsonContainsCondition(path: string, value: unknown): any {
    const fieldPath = this.normalizePath(path);
    if (Array.isArray(value)) {
      return { [fieldPath]: { $all: value } };
    }
    return { [fieldPath]: value };
  }

  private buildJsonDoesntContainCondition(path: string, value: unknown): any {
    const fieldPath = this.normalizePath(path);
    const values = Array.isArray(value) ? value : [value];
    return { [fieldPath]: { $nin: values } };
  }

  private buildJsonContainsKeyCondition(path: string): any {
    return {
      [this.normalizePath(path)]: { $exists: true },
    };
  }

  private buildJsonLengthCondition(path: string, operator: WhereOperator, value: number): any {
    const mongoOperator = this.getMongoOperator(operator);
    return {
      $expr: {
        [mongoOperator]: [{ $size: { $ifNull: [`$${this.normalizePath(path)}`, []] } }, value],
      },
    };
  }

  private buildJsonTypeCondition(path: string, type: string): any {
    return {
      $expr: {
        $eq: [{ $type: `$${this.normalizePath(path)}` }, type],
      },
    };
  }

  private buildArrayLengthCondition(field: string, operator: WhereOperator, value: number): any {
    const mongoOperator = this.getMongoOperator(operator);
    return {
      $expr: {
        [mongoOperator]: [{ $size: { $ifNull: [`$${field}`, []] } }, value],
      },
    };
  }

  private normalizeDateInput(value: Date | string): Date {
    if (value instanceof Date) {
      return value;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Invalid date value: ${value}`);
    }
    return parsed;
  }

  private startOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private endOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(23, 59, 59, 999);
    return copy;
  }

  private normalizePath(path: string): string {
    return path.replace(/->/g, ".");
  }

  private applyProjectionFields(
    projection: Record<string, unknown>,
    fields: string[],
    value: 0 | 1,
  ): void {
    for (const field of fields) {
      projection[field] = value;
    }
  }

  /**
   * Apply projection object with aliases and inclusion/exclusion.
   * @param projection - The projection object to modify
   * @param projectionObj - The projection specification
   */
  private applyProjectionObject(
    projection: Record<string, unknown>,
    projectionObj: Record<string, unknown>,
  ): void {
    for (const [field, value] of Object.entries(projectionObj)) {
      // Handle boolean values (true = 1, false = 0)
      if (typeof value === "boolean") {
        projection[field] = value ? 1 : 0;
        continue;
      }

      // Handle numeric values (0 or 1)
      if (typeof value === "number") {
        projection[field] = value;
        continue;
      }

      // Handle string values (aliases)
      if (typeof value === "string") {
        // Alias: project the field with a new name
        projection[value] = `$${field}`;
        continue;
      }

      // Handle complex expressions (objects)
      if (typeof value === "object" && value !== null) {
        projection[field] = value;
        continue;
      }

      // Default: include the field
      projection[field] = 1;
    }
  }

  private applyRawProjection(
    projection: Record<string, unknown>,
    expression: RawExpression,
    bindings?: unknown[],
  ): void {
    const resolved = this.resolveProjectionExpression(expression, bindings);
    if (!resolved) {
      return;
    }

    if (typeof resolved === "object" && resolved !== null && !Array.isArray(resolved)) {
      Object.assign(projection, resolved as Record<string, unknown>);
    }
  }

  private resolveProjectionExpression(
    expression: RawExpression | unknown,
    bindings?: unknown[],
  ): any {
    if (typeof expression === "string") {
      const source =
        bindings && expression.includes("?")
          ? this.bindRawString(expression, bindings)
          : expression;
      if (source.startsWith(":")) {
        return source.slice(1);
      }
      return this.normalizeFieldReference(source);
    }

    if (typeof expression === "object" && expression !== null && !(expression instanceof Date)) {
      return expression;
    }

    if (typeof expression === "number" || typeof expression === "boolean") {
      return expression;
    }

    return expression;
  }

  private normalizeFieldReference(value: string | RawExpression): any {
    if (typeof value === "string") {
      if (value.startsWith(":")) {
        return value.slice(1);
      }
      // If already a field reference, return as-is
      if (value.startsWith("$")) {
        return value;
      }
      // Check if it's a string literal (contains spaces or special chars)
      // Field paths are typically: alphanumeric, underscore, dot only
      if (!/^[a-zA-Z0-9_.]+$/.test(value)) {
        return value; // Return as literal
      }
      // Otherwise, treat as field reference
      return `$${value}`;
    }
    return value;
  }

  private buildAggregateProjection(field: string, aggregate: string): any {
    if (aggregate === "count") {
      return this.buildArraySizeExpression(field);
    }

    const map: Record<string, string> = {
      sum: "$sum",
      avg: "$avg",
      min: "$min",
      max: "$max",
      first: "$first",
      last: "$last",
    };

    const operator = map[aggregate];
    if (!operator) {
      return null;
    }

    return {
      [operator]: this.normalizeFieldReference(field),
    };
  }

  private buildExistsProjection(field: string): any {
    return {
      $ne: [{ $type: `$${field}` }, "missing"],
    };
  }

  private buildArraySizeExpression(field: string): any {
    return {
      $size: { $ifNull: [`$${field}`, []] },
    };
  }

  private buildCaseExpression(
    cases: Array<{ when: RawExpression; then: RawExpression | unknown }>,
    otherwise: RawExpression | unknown,
  ): any {
    return {
      $switch: {
        branches: cases.map((item) => ({
          case: this.resolveProjectionExpression(item.when),
          then: this.resolveLiteralOrExpression(item.then),
        })),
        default: this.resolveLiteralOrExpression(otherwise),
      },
    };
  }

  private buildCondExpression(
    condition: RawExpression,
    thenValue: RawExpression | unknown,
    elseValue: RawExpression | unknown,
  ): any {
    return {
      $cond: [
        this.resolveProjectionExpression(condition),
        this.resolveLiteralOrExpression(thenValue),
        this.resolveLiteralOrExpression(elseValue),
      ],
    };
  }

  /**
   * Resolve a value as a literal (if it's a plain string) or as an expression.
   * Used for `then`/`default` values in CASE/WHEN expressions.
   */
  private resolveLiteralOrExpression(value: RawExpression | unknown): any {
    // If it's a string that starts with $, treat as field reference
    if (typeof value === "string" && value.startsWith("$")) {
      return value;
    }
    // If it's a plain string (not starting with $), treat as literal
    if (typeof value === "string") {
      return value;
    }
    // For objects (expressions), numbers, booleans, etc., use normal resolution
    return this.resolveProjectionExpression(value);
  }

  private inferJsonAlias(path: string): string {
    const normalized = this.normalizePath(path);
    const segments = normalized.split(".");
    return segments[segments.length - 1];
  }

  private buildConcatExpression(values: Array<string | RawExpression>): any {
    return {
      $concat: values.map((value) => this.normalizeFieldReference(value)),
    };
  }

  private buildCoalesceExpression(values: Array<string | RawExpression>): any {
    if (values.length === 0) {
      return null;
    }

    let expression = this.normalizeFieldReference(values[values.length - 1]);

    for (let index = values.length - 2; index >= 0; index--) {
      expression = {
        $ifNull: [this.normalizeFieldReference(values[index]), expression],
      };
    }

    return expression;
  }

  /**
   * Build a $project stage from select operations.
   *
   * @param operations - The select operations
   * @returns The $project stage or null
   */
  private buildProjectStage(operations: Operation[]): any {
    if (operations.length === 0) {
      return null;
    }

    const projection: Record<string, unknown> = {};
    const driverCallbacks: Array<(projection: Record<string, unknown>) => void> = [];

    for (const op of operations) {
      switch (op.type) {
        case "select":
          // Handle new projection format with aliases
          if (op.data.projection) {
            this.applyProjectionObject(projection, op.data.projection);
          } else if (op.data.fields) {
            this.applyProjectionFields(projection, op.data.fields, 1);
          }
          break;

        case "deselect":
          this.applyProjectionFields(projection, op.data.fields, 0);
          break;

        case "addSelect":
          this.applyProjectionFields(projection, op.data.fields, 1);
          break;

        case "selectRaw":
          this.applyRawProjection(projection, op.data.expression, op.data.bindings);
          break;

        case "selectSub":
        case "addSelectSub": {
          const expr = this.resolveProjectionExpression(op.data.expression, op.data.bindings);
          if (expr !== undefined) {
            projection[op.data.alias] = expr;
          }
          break;
        }

        case "selectAggregate":
          projection[op.data.alias] = this.buildAggregateProjection(
            op.data.field,
            op.data.aggregate,
          );
          break;

        case "selectExists":
          projection[op.data.alias] = this.buildExistsProjection(op.data.field);
          break;

        case "selectCount":
          projection[op.data.alias] = this.buildArraySizeExpression(op.data.field);
          break;

        case "selectCase":
          projection[op.data.alias] = this.buildCaseExpression(
            op.data.cases,
            op.data.otherwise,
          );
          break;

        case "selectWhen":
          projection[op.data.alias] = this.buildCondExpression(
            op.data.condition,
            op.data.thenValue,
            op.data.elseValue,
          );
          break;

        case "selectDriverProjection":
          driverCallbacks.push(op.data.callback);
          break;

        case "selectJson": {
          const alias = op.data.alias ?? this.inferJsonAlias(op.data.path);
          projection[alias] = this.normalizeFieldReference(
            `$${this.normalizePath(op.data.path)}`,
          );
          break;
        }

        case "selectJsonRaw": {
          projection[op.data.alias] = this.resolveProjectionExpression(op.data.expression);
          break;
        }

        case "deselectJson":
          projection[this.normalizePath(op.data.path)] = 0;
          break;

        case "selectConcat":
          projection[op.data.alias] = this.buildConcatExpression(op.data.fields);
          break;

        case "selectCoalesce":
          projection[op.data.alias] = this.buildCoalesceExpression(op.data.fields);
          break;

        default:
          break;
      }
    }

    for (const callback of driverCallbacks) {
      callback(projection);
    }

    return Object.keys(projection).length > 0 ? { $project: projection } : null;
  }

  /**
   * Build a $sort stage from order operations.
   *
   * @param operations - The order operations
   * @returns The $sort stage or null
   */
  private buildSortStage(operations: Operation[]): any {
    const sort: any = {};

    for (const op of operations) {
      switch (op.type) {
        case "orderBy":
          sort[op.data.field] = op.data.direction === "asc" ? 1 : -1;
          break;

        case "orderByRandom":
          return { $sample: { size: op.data.limit } };

        case "orderByRaw":
          // TODO: Handle raw expressions
          break;
      }
    }

    return Object.keys(sort).length > 0 ? { $sort: sort } : null;
  }

  /**
   * Build a $group stage from group operations.
   *
   * @param operations - The group operations
   * @returns The $group stage or null
   */
  private buildGroupStage(operations: Operation[]): any {
    const op = operations[0];

    switch (op.type) {
      case "groupBy": {
        const stage = this.buildGroupByStage(op.data.fields);
        if (stage) {
          return stage;
        }
        break;
      }
      case "groupByWithAggregates": {
        const stage = this.buildGroupByWithAggregatesStage(
          op.data.fields,
          op.data.aggregates,
        );
        if (stage) {
          return stage;
        }
        break;
      }
      case "groupByRaw": {
        const expression = op.data.expression;
        if (expression && typeof expression === "object") {
          return { $group: expression };
        }
        // If expression is not an object, it might be a string or other type
        // In that case, we should still return it as a $group stage
        if (expression) {
          return { $group: { _id: expression } };
        }
        break;
      }
      case "distinct": {
        const stage = this.buildGroupByStage(op.data.fields);
        if (stage) {
          return stage;
        }
        break;
      }
      default:
        break;
    }

    return null;
  }

  private buildGroupByStage(fields: GroupByInput): any {
    const groupId = this.buildGroupId(fields);
    if (!groupId) {
      return null;
    }

    return { $group: { _id: groupId } };
  }

  /**
   * Build a $group stage with aggregates from group operations.
   *
   * @param fields - Fields to group by
   * @param aggregates - Aggregate operations (abstract or raw)
   * @returns The $group stage or null
   */
  private buildGroupByWithAggregatesStage(
    fields: GroupByInput,
    aggregates: Record<string, RawExpression>,
  ): any {
    const groupId = this.buildGroupId(fields);
    if (!groupId) {
      return null;
    }

    const groupStage: Record<string, unknown> = {
      _id: groupId,
    };

    // Translate each aggregate expression
    for (const [alias, expression] of Object.entries(aggregates)) {
      if (isAggregateExpression(expression)) {
        // Translate abstract expression to MongoDB format
        groupStage[alias] = this.translateAggregateExpression(expression);
      } else {
        // Use raw expression as-is (already in MongoDB format)
        groupStage[alias] = expression;
      }
    }

    return { $group: groupStage };
  }

  /**
   * Extract field names from GroupByInput for renaming _id.
   *
   * @param fields - The grouping fields
   * @returns Field name(s) to use for renaming _id
   */
  private extractGroupFieldNames(fields: GroupByInput): string | string[] | null {
    if (typeof fields === "string") {
      return fields;
    }

    if (Array.isArray(fields)) {
      const allStrings = fields.every((field) => typeof field === "string");
      if (allStrings) {
        return fields as string[];
      }
      // For complex arrays, return null (don't rename)
      return null;
    }

    if (typeof fields === "object" && fields !== null) {
      // For object syntax, use the keys as field names
      return Object.keys(fields);
    }

    return null;
  }

  /**
   * Translate an abstract aggregate expression to MongoDB format.
   *
   * @param expr - Abstract aggregate expression
   * @returns MongoDB aggregation expression
   */
  private translateAggregateExpression(expr: AggregateExpression): Record<string, unknown> {
    switch (expr.__agg) {
      case "count":
        return { $sum: 1 };

      case "sum":
        if (!expr.__field) {
          throw new Error("Sum aggregate requires a field name");
        }
        return { $sum: `$${expr.__field}` };

      case "avg":
        if (!expr.__field) {
          throw new Error("Average aggregate requires a field name");
        }
        return { $avg: `$${expr.__field}` };

      case "min":
        if (!expr.__field) {
          throw new Error("Min aggregate requires a field name");
        }
        return { $min: `$${expr.__field}` };

      case "max":
        if (!expr.__field) {
          throw new Error("Max aggregate requires a field name");
        }
        return { $max: `$${expr.__field}` };

      case "first":
        if (!expr.__field) {
          throw new Error("First aggregate requires a field name");
        }
        return { $first: `$${expr.__field}` };

      case "last":
        if (!expr.__field) {
          throw new Error("Last aggregate requires a field name");
        }
        return { $last: `$${expr.__field}` };

      case "distinct":
        if (!expr.__field) {
          throw new Error("Distinct aggregate requires a field name");
        }
        return { $distinct: `$${expr.__field}` };

      case "floor":
        if (!expr.__field) {
          throw new Error("Floor aggregate requires a field name");
        }

        return { $floor: `$${expr.__field}` };

      default:
        throw new Error(`Unknown aggregate function: ${expr.__agg}`);
    }
  }

  private buildGroupId(fields: GroupByInput): any {
    if (!fields) {
      return null;
    }

    if (typeof fields === "string") {
      return `$${fields}`;
    }

    if (Array.isArray(fields)) {
      if (fields.length === 0) {
        return null;
      }

      const allStrings = fields.every((field) => typeof field === "string");
      if (allStrings) {
        const result: Record<string, string> = {};
        for (const field of fields as string[]) {
          result[field] = `$${field}`;
        }
        return result;
      }

      // Array of objects - merge them to build complex _id structures
      return (fields as Record<string, unknown>[]).reduce((acc, item) => ({ ...acc, ...item }), {});
    }

    if (typeof fields === "object") {
      const normalized: Record<string, unknown> = {};
      Object.entries(fields).forEach(([key, value]) => {
        if (typeof value === "string" && !value.startsWith("$")) {
          normalized[key] = `$${value}`;
        } else {
          normalized[key] = value;
        }
      });
      return normalized;
    }

    return null;
  }

  /**
   * Build a $lookup stage from join operations.
   *
   * @param operations - The join operations
   * @returns The $lookup stage or null
   */
  private buildLookupStage(operations: Operation[]): any {
    const op = operations[0];
    const options = op.data;

    return {
      $lookup: {
        from: options.table,
        localField: options.localField,
        foreignField: options.foreignField,
        as: options.alias || options.table,
      },
    };
  }
}
