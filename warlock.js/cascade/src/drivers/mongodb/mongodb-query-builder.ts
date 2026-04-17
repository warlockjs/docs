/* eslint-disable no-case-declarations */
import { GenericObject, get } from "@mongez/reinforcements";
import type { AggregateOptions, ClientSession, Collection } from "mongodb";
import { databaseTransactionContext } from "../../context/database-transaction-context";
import type {
  CursorPaginationOptions,
  CursorPaginationResult,
  DriverQuery,
  GroupByInput,
  HavingInput,
  JoinOptions,
  OrderDirection,
  PaginationOptions,
  PaginationResult,
  QueryBuilderContract,
  RawExpression,
  WhereCallback,
  WhereObject,
  WhereOperator,
} from "../../contracts";
import { type DataSource } from "../../data-source/data-source";
import { dataSourceRegistry } from "../../data-source/data-source-registry";
import { QueryBuilder } from "../../query-builder/query-builder";
import { type MongoDbDriver } from "./mongodb-driver";
import { MongoQueryOperations } from "./mongodb-query-operations";
import { MongoQueryParser } from "./mongodb-query-parser";
import type { Operation } from "./types";

/**
 * MongoDB-specific query builder implementation using aggregation pipeline.
 */
export class MongoQueryBuilder<T = unknown>
  extends QueryBuilder<T>
  implements QueryBuilderContract<T>
{
  /**
   * Ordered list of operations to be converted to MongoDB aggregation pipeline.
   * Public to allow parser access. Uses MongoDB's own Operation type.
   *
   * NOTE: This shadows the base `operations: Op[]` field intentionally — the Mongo
   * Operation type carries an extra `stage` discriminator used by the pipeline assembler.
   */
  public override operations: Operation[] = [];

  /**
   * Data source instance
   */
  public readonly dataSource: DataSource;

  /**
   * Lazy-loaded operations helper for constructing pipeline operations.
   */
  protected _operationsHelper?: MongoQueryOperations;

  public hydrateCallback?: (data: any, index: number) => any;

  private fetchingCallback?: (query: this) => void | Promise<void>;
  private hydratingCallback?: (records: any[], context: any) => void | Promise<void>;
  private fetchedCallback?: (records: any[], context: any) => void | Promise<void>;

  // scopesApplied, pendingGlobalScopes, availableLocalScopes, disabledGlobalScopes
  // are inherited from QueryBuilder base class.

  /**
   * Create a new query builder for the given collection.
   * @param collection - The MongoDB collection to query
   */
  public constructor(
    public readonly table: string,
    dataSource?: DataSource,
  ) {
    super();
    this.dataSource = dataSource || dataSourceRegistry.get()!;
    // TODO: Trigger the fetching event
  }

  /**
   * Gets the operations helper instance, creating it if needed.
   * @returns The operations helper instance
   */
  protected get operationsHelper(): MongoQueryOperations {
    if (!this._operationsHelper) {
      this._operationsHelper = new MongoQueryOperations(this.operations);
    }
    return this._operationsHelper;
  }

  /**
   * Get collection instance
   */
  public get collection(): Collection {
    const driver = this.dataSource.driver as MongoDbDriver;

    return driver.database!.collection(this.table);
  }

  /**
   * Add hydrate callback function
   */
  public hydrate(callback: (data: any, index: number) => any): this {
    this.hydrateCallback = callback;
    return this;
  }

  /**
   * Register a callback to be invoked before query execution
   * @returns Unsubscribe function to remove the callback
   */
  public onFetching(callback: (query: this) => void | Promise<void>): () => void {
    this.fetchingCallback = callback;
    return () => {
      this.fetchingCallback = undefined;
    };
  }

  /**
   * Register a callback to be invoked after records are fetched but before hydration
   * @returns Unsubscribe function to remove the callback
   */
  public onHydrating(callback: (records: any[], context: any) => void | Promise<void>): () => void {
    this.hydratingCallback = callback;
    return () => {
      this.hydratingCallback = undefined;
    };
  }

  /**
   * Register a callback to be invoked after records are fetched and hydrated
   * @returns Unsubscribe function to remove the callback
   */
  public onFetched(callback: (records: any[], context: any) => void | Promise<void>): () => void {
    this.fetchedCallback = callback;
    return () => {
      this.fetchedCallback = undefined;
    };
  }

  /**
   * Disable one or more global scopes for this query
   */
  public withoutGlobalScope(...scopeNames: string[]): this {
    scopeNames.forEach((name) => this.disabledGlobalScopes.add(name));
    return this;
  }

  /**
   * Disable all global scopes for this query
   */
  public withoutGlobalScopes(): this {
    if (this.pendingGlobalScopes) {
      this.pendingGlobalScopes.forEach((_, name) => {
        this.disabledGlobalScopes.add(name);
      });
    }
    return this;
  }

  /**
   * Apply a local scope to this query
   */
  public scope(scopeName: string, ...args: any[]): this {
    if (!this.availableLocalScopes) {
      throw new Error(`No local scopes available`);
    }

    const scopeCallback = this.availableLocalScopes.get(scopeName);
    if (!scopeCallback) {
      throw new Error(`Local scope "${scopeName}" not found`);
    }

    // Apply scope immediately (not deferred)
    scopeCallback(this, ...args);
    return this;
  }

  /**
   * Apply pending global scopes before query execution
   */
  private applyPendingScopes(): void {
    if (!this.pendingGlobalScopes || this.scopesApplied) {
      return;
    }

    const beforeOps: any[] = [];
    const afterOps: any[] = [];

    for (const [name, { callback, timing }] of this.pendingGlobalScopes) {
      // Skip disabled scopes
      if (this.disabledGlobalScopes.has(name)) {
        continue;
      }

      // Create temporary query builder to capture operations
      const tempBuilder = new MongoQueryBuilder(this.table, this.dataSource);
      callback(tempBuilder);

      // Collect operations based on timing
      if (timing === "before") {
        beforeOps.push(...tempBuilder.operations);
      } else {
        afterOps.push(...tempBuilder.operations);
      }
    }

    // Apply: before scopes + user operations + after scopes
    this.operations = [...beforeOps, ...this.operations, ...afterOps];
    this.scopesApplied = true;
  }

  // ============================================================================
  // WHERE CLAUSES - BASIC
  // ============================================================================

  /**
   * Adds a WHERE clause to filter documents. Supports equality, operators, objects, or callbacks.
   * @param field - Field name, or conditions object, or callback
   * @param operator - Comparison operator
   * @param value - Value to compare
   */
  public where(field: string, value: unknown): this;
  public where(field: string, operator: WhereOperator, value: unknown): this;
  public where(conditions: WhereObject): this;
  public where(callback: WhereCallback<T>): this;
  public where(...args: any[]): this {
    this.addWhereClause("where", args);
    return this;
  }

  /**
   * Adds an OR WHERE clause. Works like where() but uses OR logic.
   * @param field - Field name, or conditions object, or callback
   * @param operator - Comparison operator
   * @param value - Value to compare
   */
  public orWhere(field: string, value: unknown): this;
  public orWhere(field: string, operator: WhereOperator, value: unknown): this;
  public orWhere(conditions: WhereObject): this;
  public orWhere(callback: WhereCallback<T>): this;
  public orWhere(...args: any[]): this {
    this.addWhereClause("orWhere", args);
    return this;
  }

  /**
   * Adds a raw WHERE clause using MongoDB's native query syntax.
   * @param expression - Raw MongoDB expression
   * @param bindings - Optional parameter bindings for string expressions
   */
  public whereRaw(expression: RawExpression, bindings?: unknown[]): this {
    return this.addRawWhere("whereRaw", expression, bindings);
  }

  /**
   * Adds a raw OR WHERE clause using MongoDB's native query syntax.
   * @param expression - Raw MongoDB expression
   * @param bindings - Optional parameter bindings
   */
  public orWhereRaw(expression: RawExpression, bindings?: unknown[]): this {
    return this.addRawWhere("orWhereRaw", expression, bindings);
  }

  // ============================================================================
  // WHERE CLAUSES - COLUMN COMPARISONS
  // ============================================================================

  /**
   * Adds a WHERE clause comparing two columns/fields directly.
   * @param first - The first field name
   * @param operator - The comparison operator
   * @param second - The second field name
   */
  public whereColumn(first: string, operator: WhereOperator, second: string): this {
    this.operationsHelper.addMatchOperation("whereColumn", {
      first,
      operator,
      second,
    });
    return this;
  }

  /**
   * Adds an OR WHERE clause comparing two columns/fields directly.
   * @param first - The first field name
   * @param operator - The comparison operator
   * @param second - The second field name
   */
  public orWhereColumn(first: string, operator: WhereOperator, second: string): this {
    this.operationsHelper.addMatchOperation("orWhereColumn", {
      first,
      operator,
      second,
    });
    return this;
  }

  /**
   * Adds multiple column comparison clauses at once.
   * @param comparisons - Array of tuples [leftField, operator, rightField]
   */
  public whereColumns(
    comparisons: Array<[left: string, operator: WhereOperator, right: string]>,
  ): this {
    for (const [left, operator, right] of comparisons) {
      this.whereColumn(left, operator, right);
    }
    return this;
  }

  /**
   * Filters documents where a field's value falls between two other fields.
   * @param field - The field to check
   * @param lowerColumn - The field defining the lower bound
   * @param upperColumn - The field defining the upper bound
   */
  public whereBetweenColumns(field: string, lowerColumn: string, upperColumn: string): this {
    this.operationsHelper.addMatchOperation("whereBetweenColumns", {
      field,
      lowerColumn,
      upperColumn,
    });
    return this;
  }

  // ============================================================================
  // WHERE CLAUSES - DATE OPERATIONS
  // ============================================================================

  /**
   * Filters documents where a date field matches the given date (ignoring time).
   * @param field - The date field name
   * @param value - The date to match
   */
  public whereDate(field: string, value: Date | string): this {
    this.operationsHelper.addMatchOperation("whereDate", { field, value });
    return this;
  }

  /**
   * Alias for `whereDate()`. Filters by exact date match (ignoring time).
   * @param field - The date field name
   * @param value - The date to match
   */
  public whereDateEquals(field: string, value: Date | string): this {
    this.operationsHelper.addMatchOperation("whereDateEquals", {
      field,
      value,
    });
    return this;
  }

  /**
   * Filters documents where a date field is before the given date.
   * @param field - The date field name
   * @param value - The cutoff date
   */
  public whereDateBefore(field: string, value: Date | string): this {
    this.operationsHelper.addMatchOperation("whereDateBefore", {
      field,
      value,
    });
    return this;
  }

  /**
   * Filters documents where a date field is after the given date.
   * @param field - The date field name
   * @param value - The cutoff date
   */
  public whereDateAfter(field: string, value: Date | string): this {
    this.operationsHelper.addMatchOperation("whereDateAfter", { field, value });
    return this;
  }

  /**
   * Filters documents where a time field matches the given time (HH:MM:SS format).
   * @param field - The time/datetime field name
   * @param value - The time string in HH:MM:SS format
   */
  public whereTime(field: string, value: string): this {
    this.operationsHelper.addMatchOperation("whereTime", { field, value });
    return this;
  }

  /**
   * Filters documents where the day of the month matches the given value (1-31).
   * @param field - The date field name
   * @param value - The day of the month
   */
  public whereDay(field: string, value: number): this {
    this.operationsHelper.addMatchOperation("whereDay", { field, value });
    return this;
  }

  /**
   * Filters documents where the month matches the given value (1-12).
   * @param field - The date field name
   * @param value - The month number
   */
  public whereMonth(field: string, value: number): this {
    this.operationsHelper.addMatchOperation("whereMonth", { field, value });
    return this;
  }

  /**
   * Filters documents where the year matches the given value.
   * @param field - The date field name
   * @param value - The year
   */
  public whereYear(field: string, value: number): this {
    this.operationsHelper.addMatchOperation("whereYear", { field, value });
    return this;
  }

  // ============================================================================
  // WHERE CLAUSES - JSON OPERATIONS
  // ============================================================================

  /**
   * Filters documents where a JSON field contains the specified value.
   * @param path - The JSON path to check
   * @param value - The value to search for
   */
  public whereJsonContains(path: string, value: unknown): this {
    this.operationsHelper.addMatchOperation("whereJsonContains", {
      path,
      value,
    });
    return this;
  }

  /**
   * Filters documents where a JSON field does NOT contain the specified value.
   * @param path - The JSON path to check
   * @param value - The value to exclude
   */
  public whereJsonDoesntContain(path: string, value: unknown): this {
    this.operationsHelper.addMatchOperation("whereJsonDoesntContain", {
      path,
      value,
    });
    return this;
  }

  /**
   * Filters documents where a JSON field contains a specific key.
   * @param path - The JSON path to check for key existence
   */
  public whereJsonContainsKey(path: string): this {
    this.operationsHelper.addMatchOperation("whereJsonContainsKey", { path });
    return this;
  }

  /**
   * Filters documents where a JSON array or string has a specific length.
   * @param path - The JSON path to check
   * @param operator - The comparison operator
   * @param value - The length value to compare against
   */
  public whereJsonLength(path: string, operator: WhereOperator, value: number): this {
    this.operationsHelper.addMatchOperation("whereJsonLength", {
      path,
      operator,
      value,
    });
    return this;
  }

  /**
   * Filters documents where a JSON field is an array.
   * @param path - The JSON path to check
   */
  public whereJsonIsArray(path: string): this {
    this.operationsHelper.addMatchOperation("whereJsonIsArray", { path });
    return this;
  }

  /**
   * Filters documents where a JSON field is an object.
   * @param path - The JSON path to check
   */
  public whereJsonIsObject(path: string): this {
    this.operationsHelper.addMatchOperation("whereJsonIsObject", { path });
    return this;
  }

  /**
   * Filters documents where an array field has a specific length.
   * @param field - The array field name
   * @param operator - The comparison operator
   * @param value - The length value to compare against
   */
  public whereArrayLength(field: string, operator: WhereOperator, value: number): this {
    this.operationsHelper.addMatchOperation("whereArrayLength", {
      field,
      operator,
      value,
    });
    return this;
  }

  // ============================================================================
  // WHERE CLAUSES - CONVENIENCE METHODS
  // ============================================================================

  /**
   * Filters documents by ID (convenience method for `where("id", value)`).
   * @param value - The ID value to match
   */
  public whereId(value: string | number): this {
    return this.where("id", value);
  }

  /**
   * Filters documents by multiple IDs (convenience method for `whereIn("id", values)`).
   * @param values - Array of ID values to match
   */
  public whereIds(values: Array<string | number>): this {
    return this.whereIn("id", values);
  }

  /**
   * Filters documents by UUID (convenience method for `where("uuid", value)`).
   * @param value - The UUID string to match
   */
  public whereUuid(value: string): this {
    return this.where("uuid", value);
  }

  /**
   * Filters documents by ULID (convenience method for `where("ulid", value)`).
   * @param value - The ULID string to match
   */
  public whereUlid(value: string): this {
    return this.where("ulid", value);
  }

  /**
   * Performs full-text search on one or more fields.
   * @param fields - Field name or array of field names to search
   * @param query - The search query string
   */
  public whereFullText(fields: string | string[], query: string): this {
    const filters = typeof fields === "string" ? { fields: [fields] } : { fields: fields ?? [] };
    this.operationsHelper.addMatchOperation("whereFullText", {
      fields: filters.fields,
      query,
    });
    return this;
  }

  /**
   * Performs full-text search with OR logic.
   * @param fields - Field name or array of field names to search
   * @param query - The search query string
   */
  public orWhereFullText(fields: string | string[], query: string): this {
    const filters = typeof fields === "string" ? { fields: [fields] } : { fields: fields ?? [] };
    this.operationsHelper.addMatchOperation("orWhereFullText", {
      fields: filters.fields,
      query,
    });
    return this;
  }

  /**
   * Alias for `whereFullText()` with a single field.
   * @param field - The field name to search
   * @param query - The search query string
   */
  public whereSearch(field: string, query: string): this {
    return this.whereFullText(field, query);
  }

  /**
   * Negates a set of conditions using a callback.
   * @param callback - Callback function defining conditions to negate
   */
  public whereNot(callback: WhereCallback<T>): this {
    this.operationsHelper.addMatchOperation("where:not", { callback });
    return this;
  }

  /**
   * Negates a set of conditions with OR logic.
   * @param callback - Callback function defining conditions to negate
   */
  public orWhereNot(callback: WhereCallback<T>): this {
    this.operationsHelper.addMatchOperation("orWhere:not", { callback });
    return this;
  }

  // ============================================================================
  // WHERE CLAUSES - COMPARISON OPERATORS
  // ============================================================================

  /**
   * Filters documents where a field's value matches any value in the given array.
   * @param field - The field name to check
   * @param values - Array of values to match against
   */
  public whereIn(field: string, values: unknown[]): this {
    this.operationsHelper.addMatchOperation("whereIn", { field, values });
    return this;
  }

  /**
   * Filters documents where a field's value does NOT match any value in the array.
   * @param field - The field name to check
   * @param values - Array of values to exclude
   */
  public whereNotIn(field: string, values: unknown[]): this {
    this.operationsHelper.addMatchOperation("whereNotIn", { field, values });
    return this;
  }

  /**
   * Filters documents where a field's value is null or undefined.
   * @param field - The field name to check
   */
  public whereNull(field: string): this {
    this.operationsHelper.addMatchOperation("whereNull", { field });
    return this;
  }

  /**
   * Filters documents where a field's value is NOT null or undefined.
   * @param field - The field name to check
   */
  public whereNotNull(field: string): this {
    this.operationsHelper.addMatchOperation("whereNotNull", { field });
    return this;
  }

  /**
   * Filters documents where a field's value falls within the given range (inclusive).
   * @param field - The field name to check
   * @param range - Tuple of [min, max] values
   */
  public whereBetween(field: string, range: [unknown, unknown]): this {
    this.operationsHelper.addMatchOperation("whereBetween", { field, range });
    return this;
  }

  /**
   * Filters documents where a field's value is NOT within the given range.
   * @param field - The field name to check
   * @param range - Tuple of [min, max] values to exclude
   */
  public whereNotBetween(field: string, range: [unknown, unknown]): this {
    this.operationsHelper.addMatchOperation("whereNotBetween", {
      field,
      range,
    });
    return this;
  }

  // ============================================================================
  // WHERE CLAUSES - PATTERN MATCHING
  // ============================================================================

  /**
   * Filters documents where a field matches the given pattern (case-insensitive).
   * @param field - The field name to search
   * @param pattern - The pattern to match
   */
  public whereLike(field: string, pattern: RegExp | string): this {
    this.operationsHelper.addMatchOperation("whereLike", { field, pattern });
    return this;
  }

  /**
   * Filters documents where a field does NOT match the given pattern.
   * @param field - The field name to search
   * @param pattern - The pattern to exclude
   */
  public whereNotLike(field: string, pattern: RegExp | string): this {
    this.operationsHelper.addMatchOperation("whereNotLike", { field, pattern });
    return this;
  }

  /**
   * Filters documents where a field's value starts with the given prefix.
   * @param field - The field name to check
   * @param value - The prefix to match
   */
  public whereStartsWith(field: string, value: string | number): this {
    this.operationsHelper.addMatchOperation("whereStartsWith", {
      field,
      value,
    });
    return this;
  }

  /**
   * Filters documents where a field's value does NOT start with the given prefix.
   * @param field - The field name to check
   * @param value - The prefix to exclude
   */
  public whereNotStartsWith(field: string, value: string | number): this {
    this.operationsHelper.addMatchOperation("whereNotStartsWith", {
      field,
      value,
    });
    return this;
  }

  /**
   * Filters documents where a field's value ends with the given suffix.
   * @param field - The field name to check
   * @param value - The suffix to match
   */
  public whereEndsWith(field: string, value: string | number): this {
    this.operationsHelper.addMatchOperation("whereEndsWith", { field, value });
    return this;
  }

  /**
   * Filters documents where a field's value does NOT end with the given suffix.
   * @param field - The field name to check
   * @param value - The suffix to exclude
   */
  public whereNotEndsWith(field: string, value: string | number): this {
    this.operationsHelper.addMatchOperation("whereNotEndsWith", {
      field,
      value,
    });
    return this;
  }

  /**
   * Filters documents where a date field falls within the given date range.
   * @param field - The date field name
   * @param range - Tuple of [startDate, endDate]
   */
  public whereDateBetween(field: string, range: [Date, Date]): this {
    this.operationsHelper.addMatchOperation("whereDateBetween", {
      field,
      range,
    });
    return this;
  }

  /**
   * Filters documents where a date field is NOT within the given date range.
   * @param field - The date field name
   * @param range - Tuple of [startDate, endDate] to exclude
   */
  public whereDateNotBetween(field: string, range: [Date, Date]): this {
    this.operationsHelper.addMatchOperation("whereDateNotBetween", {
      field,
      range,
    });
    return this;
  }

  // ============================================================================
  // WHERE CLAUSES - EXISTENCE CHECKS
  // ============================================================================

  /**
   * Filters documents where a field exists (has any value including null).
   * @param field - The field name to check for existence
   * @param callback - Optional callback for subquery existence
   */
  public whereExists(field: string): this;
  public whereExists(callback: WhereCallback<T>): this;
  public whereExists(param: string | WhereCallback<T>): this {
    if (typeof param === "function") {
      this.operationsHelper.addMatchOperation("where:exists", {
        callback: param,
      });
      return this;
    }

    this.operationsHelper.addMatchOperation("whereExists", { field: param });
    return this;
  }

  /**
   * Filters documents where a field does NOT exist in the document.
   * @param field - The field name to check for absence
   * @param callback - Optional callback for subquery non-existence
   */
  public whereNotExists(field: string): this;
  public whereNotExists(callback: WhereCallback<T>): this;
  public whereNotExists(param: string | WhereCallback<T>): this {
    if (typeof param === "function") {
      this.operationsHelper.addMatchOperation("where:notExists", {
        callback: param,
      });
      return this;
    }

    this.operationsHelper.addMatchOperation("whereNotExists", {
      field: param,
    });
    return this;
  }

  /**
   * Filters documents where an array field has a specific size.
   * @param field - The array field name
   * @param size - The exact size to match
   * @param operator - Optional comparison operator
   */
  public whereSize(field: string, size: number): this;
  public whereSize(field: string, operator: ">" | ">=" | "=" | "<" | "<=", size: number): this;
  public whereSize(field: string, ...args: any[]): this {
    if (args.length === 1) {
      this.operationsHelper.addMatchOperation("whereSize", {
        field,
        operator: "=",
        size: args[0],
      });
    } else {
      this.operationsHelper.addMatchOperation("whereSize", {
        field,
        operator: args[0],
        size: args[1],
      });
    }
    return this;
  }

  // ============================================================================
  // WHERE CLAUSES - FULL-TEXT SEARCH
  // ============================================================================

  /**
   * Performs a full-text search on the specified fields.
   * @param query - The search query string
   * @param filters - Optional additional filter conditions
   */
  public textSearch(query: string, filters?: WhereObject): this {
    this.operationsHelper.addMatchOperation("textSearch", { query, filters });
    return this;
  }

  // ============================================================================
  // WHERE CLAUSES - ARRAY OPERATIONS
  // ============================================================================

  /**
   * Filters documents where an array field contains the given value.
   * @param field - The array field name
   * @param value - The value to search for in the array
   * @param key - Optional key to check within array objects
   */
  public whereArrayContains(field: string, value: unknown, key?: string): this {
    this.operationsHelper.addMatchOperation("whereArrayContains", {
      field,
      value,
      key,
    });
    return this;
  }

  /**
   * Filters documents where an array field does NOT contain the given value.
   * @param field - The array field name
   * @param value - The value to exclude from the array
   * @param key - Optional key to check within array objects
   */
  public whereArrayNotContains(field: string, value: unknown, key?: string): this {
    this.operationsHelper.addMatchOperation("whereArrayNotContains", {
      field,
      value,
      key,
    });
    return this;
  }

  /**
   * Filters documents where an array field contains the value OR is empty.
   * @param field - The array field name
   * @param value - The value to search for
   * @param key - Optional key to check within array objects
   */
  public whereArrayHasOrEmpty(field: string, value: unknown, key?: string): this {
    this.operationsHelper.addMatchOperation("whereArrayHasOrEmpty", {
      field,
      value,
      key,
    });
    return this;
  }

  /**
   * Filters documents where an array field does NOT contain the value AND is not empty.
   * @param field - The array field name
   * @param value - The value to exclude
   * @param key - Optional key to check within array objects
   */
  public whereArrayNotHaveOrEmpty(field: string, value: unknown, key?: string): this {
    this.operationsHelper.addMatchOperation("whereArrayNotHaveOrEmpty", {
      field,
      value,
      key,
    });
    return this;
  }

  /**
   * Internal helper for processing where clause arguments.
   * @param prefix - The operation prefix
   * @param args - The arguments passed to where/orWhere
   */
  protected addWhereClause(prefix: "where" | "orWhere", args: any[]): void {
    if (args.length === 1) {
      if (typeof args[0] === "function") {
        // Callback-based where
        this.operationsHelper.addMatchOperation(`${prefix}:callback`, args[0]);
      } else {
        // Object-based where
        this.operationsHelper.addMatchOperation(`${prefix}:object`, args[0]);
      }
    } else if (args.length === 2) {
      // Simple equality: where(field, value)
      this.operationsHelper.addMatchOperation(prefix, {
        field: args[0],
        operator: "=",
        value: args[1],
      });
    } else if (args.length === 3) {
      // With operator: where(field, operator, value)
      this.operationsHelper.addMatchOperation(prefix, {
        field: args[0],
        operator: args[1],
        value: args[2],
      });
    }
  }

  /**
   * Internal helper for adding raw where clauses.
   * @param type - The operation type
   * @param expression - The raw expression in MongoDB query language
   * @param bindings - Optional bindings for the expression
   */
  protected addRawWhere(
    type: "whereRaw" | "orWhereRaw",
    expression: RawExpression,
    bindings?: unknown[],
  ): this {
    this.operationsHelper.addMatchOperation(type, { expression, bindings });
    return this;
  }

  /**
   * Normalizes select field arguments into a structured format.
   * @param args - The arguments to normalize
   * @returns Normalized selection object with fields and aliases
   */
  protected normalizeSelectFields(args: any[]): {
    fields?: string[];
    projection?: Record<string, unknown>;
  } {
    // Single argument cases
    if (args.length === 1) {
      const arg = args[0];

      // Object format: { field: 1, field2: 0, field3: "alias", field4: true }
      if (typeof arg === "object" && !Array.isArray(arg)) {
        return { projection: arg };
      }

      // Array format: ["field1", "field2"]
      if (Array.isArray(arg)) {
        return { fields: arg };
      }

      // Single string: "field"
      if (typeof arg === "string") {
        return { fields: [arg] };
      }
    }

    // Multiple string arguments: select("field1", "field2", "field3")
    return { fields: args.filter((arg) => typeof arg === "string") };
  }

  // ============================================================================
  // SELECT / PROJECTION
  // ============================================================================

  /**
   * Specifies which fields to include in the query results.
   * Supports arrays, multiple args, or object with aliases/inclusion/exclusion.
   * @param fields - Field names, array, or projection object
   */
  public select(fields: string[]): this;
  public select(fields: Record<string, 0 | 1 | boolean | string>): this;
  public select(...fields: string[]): this;
  public select(...args: any): this {
    const normalized = this.normalizeSelectFields(args);
    this.operationsHelper.addProjectOperation("select", normalized);
    return this;
  }

  /**
   * Selects a field with an alias.
   * @param field - The field to select
   * @param alias - The alias name for the field
   * @returns The query builder instance
   */
  public selectAs(field: string, alias: string): this {
    return this.select({ [field]: alias });
  }

  /**
   * Adds a computed field using a raw MongoDB expression.
   * @param expression - The raw MongoDB expression
   * @param bindings - Optional parameter bindings for string expressions
   */
  public selectRaw(expression: RawExpression, bindings?: unknown[]): this {
    this.operationsHelper.addProjectOperation("selectRaw", {
      expression,
      bindings,
    });
    return this;
  }

  /**
   * Adds multiple computed fields using raw MongoDB expressions.
   * @param definitions - Array of field definitions with alias, expression, and optional bindings
   */
  public selectRawMany(
    definitions: Array<{
      alias: string;
      expression: RawExpression;
      bindings?: unknown[];
    }>,
  ): this {
    for (const definition of definitions) {
      this.selectRaw({ [definition.alias]: definition.expression }, definition.bindings);
    }
    return this;
  }

  /**
   * Adds a subquery as a computed field.
   * @param expression - The subquery expression
   * @param alias - The alias for the computed field
   */
  public selectSub(expression: RawExpression, alias: string): this {
    this.operationsHelper.addProjectOperation("selectSub", {
      expression,
      alias,
    });
    return this;
  }

  /**
   * Adds an additional subquery field to existing selections.
   * @param expression - The subquery expression
   * @param alias - The alias for the computed field
   */
  public addSelectSub(expression: RawExpression, alias: string): this {
    this.operationsHelper.addProjectOperation("addSelectSub", {
      expression,
      alias,
    });
    return this;
  }

  /**
   * Adds an aggregate value as a computed field.
   * @param field - The field to aggregate
   * @param aggregate - The aggregate function to apply
   * @param alias - The alias for the computed field
   */
  public selectAggregate(
    field: string,
    aggregate: "sum" | "avg" | "min" | "max" | "count" | "first" | "last",
    alias: string,
  ): this {
    this.operationsHelper.addProjectOperation("selectAggregate", {
      field,
      aggregate,
      alias,
    });
    return this;
  }

  /**
   * Adds a boolean field indicating whether a related document exists.
   * @param field - The field to check for existence
   * @param alias - The alias for the boolean field
   */
  public selectExists(field: string, alias: string): this {
    this.operationsHelper.addProjectOperation("selectExists", {
      field,
      alias,
    });
    return this;
  }

  /**
   * Adds a count field for a related collection.
   * @param field - The field to count
   * @param alias - The alias for the count field
   */
  public selectCount(field: string, alias: string): this {
    this.operationsHelper.addProjectOperation("selectCount", { field, alias });
    return this;
  }

  /**
   * Adds a CASE-like conditional field using multiple conditions.
   * @param cases - Array of when/then pairs
   * @param otherwise - Default value if no conditions match
   * @param alias - The alias for the computed field
   */
  public selectCase(
    cases: Array<{ when: RawExpression; then: RawExpression | unknown }>,
    otherwise: RawExpression | unknown,
    alias: string,
  ): this {
    this.operationsHelper.addProjectOperation("selectCase", {
      cases,
      otherwise,
      alias,
    });
    return this;
  }

  /**
   * Adds a simple conditional field (if/else).
   * @param condition - The condition to evaluate
   * @param thenValue - Value if condition is true
   * @param elseValue - Value if condition is false
   * @param alias - The alias for the computed field
   */
  public selectWhen(
    condition: RawExpression,
    thenValue: RawExpression | unknown,
    elseValue: RawExpression | unknown,
    alias: string,
  ): this {
    this.operationsHelper.addProjectOperation("selectWhen", {
      condition,
      thenValue,
      elseValue,
      alias,
    });
    return this;
  }

  /**
   * Allows direct manipulation of the MongoDB projection object.
   * @param callback - Function that receives and modifies the projection object
   */
  public selectDriverProjection(callback: (projection: Record<string, unknown>) => void): this {
    this.operationsHelper.addProjectOperation("selectDriverProjection", {
      callback,
    });
    return this;
  }

  /**
   * Extracts a JSON field from a document.
   * @param path - The JSON path to extract
   * @param alias - Optional alias for the extracted field
   */
  public selectJson(path: string, alias?: string): this {
    this.operationsHelper.addProjectOperation("selectJson", { path, alias });
    return this;
  }

  /**
   * Extracts a JSON field using a raw MongoDB expression.
   * @param path - The JSON path
   * @param expression - The raw expression for extraction
   * @param alias - The alias for the extracted field
   */
  public selectJsonRaw(path: string, expression: RawExpression, alias: string): this {
    this.operationsHelper.addProjectOperation("selectJsonRaw", {
      path,
      expression,
      alias,
    });
    return this;
  }

  /**
   * Excludes a JSON path from the results.
   * @param path - The JSON path to exclude
   */
  public deselectJson(path: string): this {
    this.operationsHelper.addProjectOperation("deselectJson", { path });
    return this;
  }

  /**
   * Concatenates multiple fields into a single string field.
   * @param fields - Array of fields or expressions to concatenate
   * @param alias - The alias for the concatenated field
   */
  public selectConcat(fields: Array<string | RawExpression>, alias: string): this {
    this.operationsHelper.addProjectOperation("selectConcat", {
      fields,
      alias,
    });
    return this;
  }

  /**
   * Returns the first non-null value from a list of fields.
   * @param fields - Array of fields to check
   * @param alias - The alias for the coalesced field
   */
  public selectCoalesce(fields: Array<string | RawExpression>, alias: string): this {
    this.operationsHelper.addProjectOperation("selectCoalesce", {
      fields,
      alias,
    });
    return this;
  }

  /**
   * Adds window function operations to the query.
   * @param spec - The window function specification
   */
  public selectWindow(spec: RawExpression): this {
    this.operationsHelper.addOperation("$setWindowFields", "selectWindow", { spec }, false);
    return this;
  }

  /**
   * Excludes specific fields from the query results.
   * @param fields - Field names to exclude
   */
  public deselect(fields: string[]): this;
  public deselect(...fields: Array<string | string[]>): this;
  public deselect(...args: Array<string | string[]>): this {
    const fields = this.normalizeSelectFields(args);
    this.operationsHelper.addProjectOperation("deselect", { fields });
    return this;
  }

  /**
   * Returns only distinct values for the specified fields.
   * @param fields - Optional field names to use for distinctness
   */
  public distinctValues(fields?: string | string[]): this {
    this.operationsHelper.addGroupOperation("distinct", { fields }, false);
    return this;
  }

  /**
   * Adds additional fields to an existing selection.
   * @param fields - Additional field names to include
   */
  public addSelect(fields: string[]): this;
  public addSelect(...fields: Array<string | string[]>): this;
  public addSelect(...args: Array<string | string[]>): this {
    const fields = this.normalizeSelectFields(args);
    this.operationsHelper.addProjectOperation("addSelect", { fields });
    return this;
  }

  /**
   * Removes all field selection restrictions.
   */
  public clearSelect(): this {
    this.operations = this.operations.filter((op) => op.stage !== "$project");
    return this;
  }

  /**
   * Alias for `clearSelect()`. Removes all field restrictions.
   */
  public selectAll(): this {
    return this.clearSelect();
  }

  /**
   * Alias for `clearSelect()`. Resets to default field selection.
   */
  public selectDefault(): this {
    return this.clearSelect();
  }

  // ============================================================================
  // ORDERING
  // ============================================================================

  /**
   * Orders the query results by a specific field or multiple fields.
   *
   * @param field - The field name to sort by, or an object with multiple fields
   * @param direction - The sort direction (only used when field is a string)
   *
   * @example
   * ```typescript
   * // Single field
   * query.orderBy("createdAt", "desc");
   *
   * // Multiple fields
   * query.orderBy({ id: "asc", age: "desc", createdAt: "desc" });
   * ```
   */
  public orderBy(field: string, direction?: OrderDirection): this;
  public orderBy(fields: Record<string, OrderDirection>): this;
  public orderBy(
    fieldOrFields: string | Record<string, OrderDirection>,
    direction: OrderDirection = "asc",
  ): this {
    if (typeof fieldOrFields === "string") {
      // Single field
      this.operationsHelper.addSortOperation("orderBy", {
        field: fieldOrFields,
        direction,
      });
    } else {
      // Multiple fields - add each as a separate operation (they'll be merged)
      for (const [field, dir] of Object.entries(fieldOrFields)) {
        this.operationsHelper.addSortOperation("orderBy", {
          field,
          direction: dir,
        });
      }
    }
    return this;
  }

  /**
   * Orders the query results by a field in descending order.
   * @param field - The field name to sort by
   */
  public orderByDesc(field: string): this {
    return this.orderBy(field, "desc");
  }

  /**
   * Orders the query results using a raw MongoDB sort expression.
   * @param expression - The raw MongoDB sort expression
   * @param bindings - Optional parameter bindings
   */
  public orderByRaw(expression: RawExpression, bindings?: unknown[]): this {
    this.operationsHelper.addSortOperation("orderByRaw", {
      expression,
      bindings,
    });
    return this;
  }

  /**
   * Orders the query results randomly.
   */
  public orderByRandom(limit: number = 1000): this {
    this.operationsHelper.addSortOperation("orderByRandom", { limit }, false);
    return this;
  }

  /**
   * Orders results by a date field in descending order (newest first).
   * @param column - The date column to sort by
   */
  public latest(column: string = "createdAt"): Promise<T[]> {
    return this.orderBy(column, "desc").get();
  }

  /**
   * Orders results by a date field in ascending order (oldest first).
   * @param column - The date column to sort by
   */
  public oldest(column: string = "createdAt"): this {
    return this.orderBy(column, "asc");
  }

  // ============================================================================
  // LIMITING / PAGINATION
  // ============================================================================

  /**
   * Limits the number of documents returned by the query.
   * @param value - The maximum number of documents to return
   */
  public limit(value: number): this {
    this.operationsHelper.addOperation("$limit", "limit", { value }, false);
    return this;
  }

  /**
   * Skips a specified number of documents in the query results.
   * @param value - The number of documents to skip
   */
  public skip(value: number): this {
    this.operationsHelper.addOperation("$skip", "skip", { value }, false);
    return this;
  }

  /**
   * Alias for `skip()`. Skips a specified number of documents.
   * @param value - The number of documents to skip
   */
  public offset(value: number): this {
    return this.skip(value);
  }

  /**
   * Alias for `limit()`. Limits the number of documents returned.
   * @param value - The maximum number of documents to return
   */
  public take(value: number): this {
    return this.limit(value);
  }

  /**
   * Applies cursor-based filtering for pagination.
   * @param after - Cursor value for forward pagination
   * @param before - Cursor value for backward pagination
   */
  public cursor(after?: unknown, before?: unknown): this {
    this.operationsHelper.addMatchOperation("cursor", { after, before });
    return this;
  }

  // ============================================================================
  // GROUPING / AGGREGATION
  // ============================================================================

  /**
   * Groups documents by one or more fields.
   *
   * @param fields - Field(s) to group by
   * @param aggregates - Optional aggregate operations to perform
   *
   * @example
   * ```typescript
   * import { $agg } from '@warlock.js/cascade';
   *
   * // Simple grouping
   * query.groupBy("type");
   *
   * // Grouping with aggregates
   * query.groupBy("type", {
   *   count: $agg.count(),
   *   total: $agg.sum("duration")
   * });
   * ```
   */
  public groupBy(fields: GroupByInput): this;
  public groupBy(fields: GroupByInput, aggregates: Record<string, RawExpression>): this;
  public groupBy(fields: GroupByInput, aggregates?: Record<string, RawExpression>): this {
    if (aggregates) {
      this.operationsHelper.addGroupOperation(
        "groupByWithAggregates",
        { fields, aggregates },
        false,
      );
    } else {
      this.operationsHelper.addGroupOperation("groupBy", { fields }, false);
    }

    return this;
  }

  /**
   * Groups documents using a raw MongoDB expression.
   * @param expression - The raw grouping expression
   * @param bindings - Optional parameter bindings
   */
  public groupByRaw(expression: RawExpression, bindings?: unknown[]): this {
    this.operationsHelper.addGroupOperation("groupByRaw", { expression, bindings }, false);
    return this;
  }

  /**
   * Filters grouped results based on aggregate conditions.
   * @param field - The aggregate field to filter on
   * @param value - The value to compare against
   * @param operator - The comparison operator
   * @param condition - A condition object for complex filters
   */
  public having(field: string, value: unknown): this;
  public having(field: string, operator: WhereOperator, value: unknown): this;
  public having(condition: HavingInput): this;
  public having(...args: any[]): this {
    if (args.length === 1) {
      this.operationsHelper.addMatchOperation("having:condition", args[0], false);
    } else if (args.length === 2) {
      this.operationsHelper.addMatchOperation(
        "having",
        { field: args[0], operator: "=", value: args[1] },
        false,
      );
    } else {
      this.operationsHelper.addMatchOperation(
        "having",
        { field: args[0], operator: args[1], value: args[2] },
        false,
      );
    }
    return this;
  }

  /**
   * Filters grouped results using a raw MongoDB expression.
   * @param expression - The raw having expression
   * @param bindings - Optional parameter bindings
   */
  public havingRaw(expression: RawExpression, bindings?: unknown[]): this {
    this.operationsHelper.addMatchOperation("havingRaw", { expression, bindings }, false);
    return this;
  }

  // ============================================================================
  // JOINS
  // ============================================================================

  /**
   * Performs a join with another collection using MongoDB's $lookup.
   *
   * @param table - Target collection name
   * @param localField - Field from the input documents
   * @param foreignField - Field from the documents of the "from" collection
   */
  public join(table: string, localField: string, foreignField: string): this;
  /**
   * Performs a join with another collection using MongoDB's $lookup.
   *
   * @param options - Join configuration including table, fields, and optional pipeline
   */
  public join(options: JoinOptions): this;
  public join(
    tableOrOptions: string | JoinOptions,
    localField?: string,
    foreignField?: string,
  ): this {
    const options: JoinOptions =
      typeof tableOrOptions === "string"
        ? {
            table: tableOrOptions,
            localField: localField!,
            foreignField: foreignField!,
            type: "left", // MongoDB $lookup is inherently a left outer join
          }
        : tableOrOptions;

    this.operationsHelper.addLookupOperation("join", options);
    return this;
  }

  /**
   * Performs a left outer join with another collection.
   * In MongoDB, this is the standard $lookup behavior.
   *
   * @param table - Target collection name
   * @param localField - Field from the input documents
   * @param foreignField - Field from the documents of the "from" collection
   */
  public leftJoin(table: string, localField: string, foreignField: string): this;
  /**
   * Performs a left outer join with another collection.
   *
   * @param options - Join configuration
   */
  public leftJoin(options: JoinOptions): this;
  public leftJoin(
    tableOrOptions: string | JoinOptions,
    localField?: string,
    foreignField?: string,
  ): this {
    const options: JoinOptions =
      typeof tableOrOptions === "string"
        ? {
            table: tableOrOptions,
            localField: localField!,
            foreignField: foreignField!,
            type: "left",
          }
        : { ...tableOrOptions, type: "left" };

    this.operationsHelper.addLookupOperation("join", options);
    return this;
  }

  /**
   * Performs a right outer join with another collection.
   *
   * Note: MongoDB doesn't natively support right joins. This is implemented
   * as a regular left join with a warning. For true right join semantics,
   * consider reversing the collections in your query.
   *
   * @param table - Target collection name
   * @param localField - Field from the input documents
   * @param foreignField - Field from the documents of the "from" collection
   */
  public rightJoin(table: string, localField: string, foreignField: string): this;
  /**
   * Performs a right outer join with another collection.
   *
   * @param options - Join configuration
   */
  public rightJoin(options: JoinOptions): this;
  public rightJoin(
    tableOrOptions: string | JoinOptions,
    localField?: string,
    foreignField?: string,
  ): this {
    // MongoDB $lookup is always a left join from the perspective of the input collection
    // Right join semantics would require reversing the query direction
    const options: JoinOptions =
      typeof tableOrOptions === "string"
        ? {
            table: tableOrOptions,
            localField: localField!,
            foreignField: foreignField!,
            type: "right",
          }
        : { ...tableOrOptions, type: "right" };

    this.operationsHelper.addLookupOperation("join", options);
    return this;
  }

  /**
   * Performs an inner join with another collection.
   *
   * This adds a $lookup followed by a $match to filter out documents
   * where the joined array is empty.
   *
   * @param table - Target collection name
   * @param localField - Field from the input documents
   * @param foreignField - Field from the documents of the "from" collection
   */
  public innerJoin(table: string, localField: string, foreignField: string): this;
  /**
   * Performs an inner join with another collection.
   *
   * @param options - Join configuration
   */
  public innerJoin(options: JoinOptions): this;
  public innerJoin(
    tableOrOptions: string | JoinOptions,
    localField?: string,
    foreignField?: string,
  ): this {
    const options: JoinOptions =
      typeof tableOrOptions === "string"
        ? {
            table: tableOrOptions,
            localField: localField!,
            foreignField: foreignField!,
            type: "inner",
          }
        : { ...tableOrOptions, type: "inner" };

    this.operationsHelper.addLookupOperation("join", options);
    return this;
  }

  /**
   * Performs a full outer join with another collection.
   *
   * Note: MongoDB doesn't natively support full outer joins. This is implemented
   * as a regular left join. For true full outer join semantics, you would need
   * to use $unionWith and additional aggregation logic.
   *
   * @param table - Target collection name
   * @param localField - Field from the input documents
   * @param foreignField - Field from the documents of the "from" collection
   */
  public fullJoin(table: string, localField: string, foreignField: string): this;
  /**
   * Performs a full outer join with another collection.
   *
   * @param options - Join configuration
   */
  public fullJoin(options: JoinOptions): this;
  public fullJoin(
    tableOrOptions: string | JoinOptions,
    localField?: string,
    foreignField?: string,
  ): this {
    const options: JoinOptions =
      typeof tableOrOptions === "string"
        ? {
            table: tableOrOptions,
            localField: localField!,
            foreignField: foreignField!,
            type: "full",
          }
        : { ...tableOrOptions, type: "full" };

    this.operationsHelper.addLookupOperation("join", options);
    return this;
  }

  /**
   * Performs a cross join with another collection.
   *
   * This creates a cartesian product by using $lookup with empty matching criteria.
   *
   * @param table - Target collection name
   */
  public crossJoin(table: string): this {
    // Cross join: match every document in the foreign collection
    this.operationsHelper.addLookupOperation("join", {
      table,
      localField: "_crossJoinDummy",
      foreignField: "_crossJoinDummy",
      type: "cross",
      pipeline: [{ $match: {} }], // Match all documents
    });
    return this;
  }

  /**
   * Performs a raw join using a custom aggregation pipeline.
   *
   * This allows full control over the $lookup stage for complex join scenarios.
   *
   * @param expression - Raw expression (typically a $lookup stage or pipeline)
   * @param _bindings - Optional bindings (not used in MongoDB but kept for API consistency)
   */
  public joinRaw(expression: RawExpression, _bindings?: unknown[]): this {
    // For MongoDB, expression should be a $lookup stage object or a simple string
    // describing the join. We add it as a raw operation.
    this.operationsHelper.addMatchOperation("raw", { builder: () => expression }, false);
    return this;
  }

  /**
   * Allows direct manipulation of the native MongoDB query.
   * @param builder - Function that receives and modifies the native query
   */
  public raw(builder: (native: unknown) => unknown): this {
    this.operationsHelper.addMatchOperation("raw", { builder }, false);
    return this;
  }

  /**
   * Extends the query builder with driver-specific functionality.
   * @param extension - The extension name
   * @param _args - Extension-specific arguments
   * @returns The extension's return value
   */
  public extend<R>(extension: string, ..._args: unknown[]): R {
    // Driver-specific extensions can be added here
    throw new Error(`Extension '${extension}' is not supported by MongoQueryBuilder`);
  }

  /**
   * Creates a deep copy of the query builder.
   * @returns A new query builder instance with copied operations
   */
  public clone(): this {
    const cloned = new MongoQueryBuilder<T>(this.table, this.dataSource) as this;
    cloned.operations = [...this.operations];
    cloned.hydrateCallback = this.hydrateCallback?.bind(cloned);
    cloned.fetchingCallback = this.fetchingCallback?.bind(cloned);
    cloned.hydratingCallback = this.hydratingCallback?.bind(cloned);
    cloned.fetchedCallback = this.fetchedCallback?.bind(cloned);

    // Copy scope state
    cloned.pendingGlobalScopes = this.pendingGlobalScopes;
    cloned.availableLocalScopes = this.availableLocalScopes;
    cloned.disabledGlobalScopes = new Set(this.disabledGlobalScopes);
    cloned.scopesApplied = this.scopesApplied;

    (cloned as any).__operationsHelper = (this as any).__operationsHelper;
    return cloned;
  }

  /**
   * Executes a callback with the query builder without breaking the chain.
   * @param callback - Function to execute with the builder
   */
  public tap(callback: (builder: this) => void): this {
    callback(this);
    return this;
  }

  /**
   * Conditionally applies query modifications based on a condition.
   * @param condition - The condition to evaluate
   * @param callback - Function to execute if condition is true
   * @param otherwise - Optional function to execute if condition is false
   *
   * @example
   * query.when(searchTerm, (q, term) => q.whereLike('name', term))
   */
  public when<V>(
    condition: V | boolean,
    callback: (builder: this, value: V) => void,
    otherwise?: (builder: this) => void,
  ): this {
    if (condition) {
      callback(this, condition as V);
    } else if (otherwise) {
      otherwise(this);
    }
    return this;
  }

  // ============================================================================
  // EXECUTION METHODS
  // ============================================================================

  /**
   * Executes the query and returns all matching documents.
   * @returns an array of matching documents
   */
  public async get<Output = T>(): Promise<Output[]> {
    const startTime = Date.now();

    // Emit onFetching event
    if (this.fetchingCallback) {
      await this.fetchingCallback(this);
    }

    // Execute query and get raw records
    const rawRecords = await this.execute<Output>();

    // Emit onHydrating event
    if (this.hydratingCallback) {
      await this.hydratingCallback(rawRecords, {
        query: this,
        hydrateCallback: this.hydrateCallback,
      });
    }

    // Hydrate records
    const hydratedRecords = this.hydrateCallback
      ? rawRecords.map(this.hydrateCallback)
      : rawRecords;

    // Emit onFetched event
    if (this.fetchedCallback) {
      await this.fetchedCallback(hydratedRecords, {
        query: this,
        rawRecords,
        duration: Date.now() - startTime,
      });
    }

    return hydratedRecords;
  }

  /**
   * Execute the query and get first result
   * This is different than `first` as first adds a `limit = 1` to the pipeline
   */
  public async getFirst<Output = T>(): Promise<Output | null> {
    return (await this.get<Output>())?.[0] ?? null;
  }

  /**
   * Executes the query and returns the first matching document.
   * @returns the first document or null
   */
  public async first<Output = T>(): Promise<Output | null> {
    const results = await this.limit(1).get<Output>();
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Executes the query and returns the first matching document, throwing if none found.
   * @returns the first document
   */
  public async firstOrFail<Output = T>(): Promise<Output> {
    const result = await this.first<Output>();
    if (!result) {
      throw new Error("No records found matching the query");
    }
    return result;
  }

  /**
   * Find a document by its primary key (id field).
   */
  public async find<Output = T>(id: number | string): Promise<Output | null> {
    return this.where("id", id).first<Output>();
  }

  /**
   * Configures the query to retrieve the last matching document.
   */
  public last<Output = T>(field: string = "createdAt"): Promise<Output | null> {
    this.orderBy(field, "desc");
    return this.first<Output>();
  }

  /**
   * Counts the number of documents matching the query.
   * @returns the count of matching documents
   */
  public async count(): Promise<number> {
    const pipeline = this.buildPipeline();
    pipeline.push({ $count: "total" });

    const results = await this.execute<{ total: number }>(pipeline);

    return results.length > 0 ? results[0].total : 0;
  }

  /**
   * Calculates the sum of a numeric field across matching documents.
   * @param field - The numeric field to sum
   * @returns the sum value
   */
  public async sum(field: string): Promise<number> {
    this.groupByRaw({
      _id: null,
      total: { $sum: `$${field}` },
    });

    // make sure to clear the data map callback
    this.hydrateCallback = undefined;

    const result = await this.getFirst<{ total: number }>();

    return result?.total ?? 0;
  }

  /**
   * Calculates the average value of a numeric field across matching documents.
   * @param field - The numeric field to average
   * @returns the average value
   */
  public async avg(field: string): Promise<number> {
    this.groupByRaw({
      _id: null,
      average: { $avg: `$${field}` },
    });

    // make sure to clear the data map callback
    this.hydrateCallback = undefined;

    return (await this.getFirst<{ average: number }>())?.average ?? 0;
  }

  /**
   * Finds the minimum value of a field across matching documents.
   * @param field - The field to find the minimum of
   * @returns the minimum value
   */
  public async min(field: string): Promise<number> {
    this.groupByRaw({
      _id: null,
      minimum: { $min: `$${field}` },
    });

    // make sure to clear the data map callback
    this.hydrateCallback = undefined;

    return (await this.getFirst<{ minimum: number }>())?.minimum ?? 0;
  }

  /**
   * Finds the maximum value of a field across matching documents.
   * @param field - The field to find the maximum of
   * @returns the maximum value
   */
  public async max(field: string): Promise<number> {
    this.groupByRaw({
      _id: null,
      maximum: { $max: `$${field}` },
    });

    // make sure to clear the data map callback
    this.hydrateCallback = undefined;

    return (await this.getFirst<{ maximum: number }>())?.maximum ?? 0;
  }

  /**
   * Returns an array of distinct values for a field, respecting query filters.
   * @param field - The field to get distinct values from
   * @returns an array of distinct values
   */
  public async distinct<T = unknown>(field: string, ignoreNull = true): Promise<T[]> {
    if (ignoreNull) {
      this.whereNotNull(field);
    }

    this.groupBy(field);

    // make sure to clear the data map callback
    this.hydrateCallback = undefined;

    const results = await this.get<{ _id: T }>();
    return results.map((doc) => doc._id);
  }

  /**
   * Count distinct values for a field, respecting query filters.
   * @param field - The field to count distinct values for
   * @returns the count of distinct values
   */
  public async countDistinct(field: string, ignoreNull = true): Promise<number> {
    if (ignoreNull) {
      this.whereNotNull(field);
    }

    return await this.groupBy(field).count();
  }

  /**
   * Extracts a single field value from each matching document.
   * @param field - The field to extract
   * @returns an array of field values
   */
  public async pluck<T = unknown>(field: string): Promise<T[]> {
    // make sure to clear the data map callback
    this.hydrateCallback = undefined;

    // Use object aliasing: { [field]: "value" } to project field as "value"
    const results = await this.selectAs(field, "value").get<{
      value: T;
    }>();

    return results.map((doc) => doc.value).filter((value) => value !== undefined);
  }

  /**
   * Gets the value of a single field from the first matching document.
   * @param field - The field to extract
   * @returns the field value or null
   */
  public async value<T = unknown>(field: string): Promise<T | null> {
    // make sure to clear the data map callback
    this.hydrateCallback = undefined;

    const result = await this.selectAs(field, "value").first<{ value: T }>();
    return result?.value ?? null;
  }

  /**
   * Checks if any documents match the query.
   * @param filter - Optional filter to apply to the query
   * @returns true if documents exist, false otherwise
   */
  public async exists(filter?: GenericObject): Promise<boolean> {
    if (filter) {
      this.where(filter);
    }

    const count = await this.limit(1).count();
    return count > 0;
  }

  /**
   * Checks if no documents match the query.
   * @param filter - Optional filter to apply to the query
   * @returns true if no documents exist, false otherwise
   */
  public async notExists(filter?: GenericObject): Promise<boolean> {
    return !(await this.exists(filter));
  }

  /**
   * Increments a numeric field by the specified amount for first matching document.
   * @param field - The field to increment
   * @param amount - The amount to increment by (default: 1)
   * @returns the new value
   */
  public async increment(field: string, amount: number = 1): Promise<number> {
    const filter = this.buildFilter();

    const result = await this.collection.findOneAndUpdate(
      filter,
      {
        $inc: { [field]: amount },
      },
      {
        returnDocument: "after",
      },
    );

    return get(result, field, 0);
  }

  /**
   * Decrements a numeric field by the specified amount.
   * @param field - The field to decrement
   * @param amount - The amount to decrement by
   * @returns the new value
   */
  public async decrement(field: string, amount: number = 1): Promise<number> {
    return this.increment(field, -amount);
  }

  /**
   * Increments a numeric field by the specified amount for all matching documents.
   * @param field - The field to increment
   * @param amount - The amount to increment by (default: 1)
   * @returns the number of documents modified
   */
  public async incrementMany(field: string, amount: number = 1): Promise<number> {
    const filter = this.buildFilter();

    const result = await this.dataSource.driver.updateMany(this.table, filter, {
      $inc: { [field]: amount },
    });

    return result.modifiedCount;
  }

  /**
   * Decrements a numeric field by the specified amount for all matching documents.
   * @param field - The field to decrement
   * @param amount - The amount to decrement by (default: 1)
   * @returns the number of documents modified
   */
  public async decrementMany(field: string, amount: number = 1): Promise<number> {
    return this.incrementMany(field, -amount);
  }

  /**
   * Delete all documents matching the query.
   */
  public async delete(): Promise<number> {
    const filter = this.buildFilter();
    return await this.dataSource.driver.deleteMany(this.table, filter);
  }

  /**
   * Delete a single document matching the query.
   */
  public async deleteOne(): Promise<number> {
    const filter = this.buildFilter();
    return await this.dataSource.driver.delete(this.table, filter);
  }

  /**
   * Update the given fields for all documents matching the query.
   */
  public async update(fields: Record<string, unknown>): Promise<number> {
    const filter = this.buildFilter();
    const result = await this.dataSource.driver.updateMany(this.table, filter, {
      $set: fields,
    });
    return result.modifiedCount;
  }

  /**
   * Unset the given fields from all documents matching the query.
   */
  public async unset(...fields: string[]): Promise<number> {
    const filter = this.buildFilter();
    const result = await this.dataSource.driver.updateMany(this.table, filter, {
      $unset: fields.reduce(
        (acc, field) => {
          acc[field] = 1;
          return acc;
        },
        {} as Record<string, 1 | true>,
      ),
    });
    return result.modifiedCount;
  }

  // ============================================================================
  // CHUNKING / PAGINATION
  // ============================================================================

  /**
   * Processes query results in chunks, executing a callback for each chunk.
   * @param size - The number of documents per chunk
   * @param callback - Function to execute for each chunk
   * @returns void
   */
  public async chunk(
    size: number,
    callback: (rows: T[], chunkIndex: number) => Promise<boolean | void> | boolean | void,
  ): Promise<void> {
    let chunkIndex = 0;
    let hasMore = true;

    while (hasMore) {
      const chunk = await this.clone()
        .skip(chunkIndex * size)
        .limit(size)
        .get();

      if (chunk.length === 0) {
        break;
      }

      const shouldContinue = await callback(chunk, chunkIndex);

      if (shouldContinue === false) {
        break;
      }

      hasMore = chunk.length === size;
      chunkIndex++;
    }
  }

  /**
   * Executes the query with traditional page-based pagination.
   * @param options - Pagination options
   * @returns pagination result with data and metadata
   */
  public async paginate(options?: PaginationOptions): Promise<PaginationResult<T>> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.clone().skip(skip).limit(limit).get(),
      this.count(),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Executes the query with cursor-based pagination supporting both directions.
   * @param options - Cursor pagination options
   * @returns cursor pagination result with data and cursor info
   */
  public async cursorPaginate(
    options?: CursorPaginationOptions,
  ): Promise<CursorPaginationResult<T>> {
    const limit = options?.limit ?? 10;
    const cursor = options?.cursor;
    const column = options?.column ?? "id";
    const direction = options?.direction ?? "next";

    // Apply cursor filter
    if (cursor) {
      const operator = direction === "next" ? ">" : "<";
      this.where(column, operator, cursor);
    }

    // Apply sorting
    const sortOrder = direction === "next" ? "asc" : "desc";
    this.orderBy(column, sortOrder);

    this.orderBy("_id", sortOrder); // Always sort by _id to ensure consistent order

    // Fetch one extra to detect if there are more results
    const results = await this.limit(limit + 1).get<T>();

    const hasMore = results.length > limit;
    let data = hasMore ? results.slice(0, limit) : results;

    // Reverse results if fetching previous page to keep natural order
    if (direction === "prev") {
      data = data.reverse();
    }

    // Determine cursors based on actual data
    let nextCursor: unknown | undefined;
    let prevCursor: unknown | undefined;
    let hasPrev = false;

    if (data.length > 0) {
      const firstItem = (data[0] as any)[column];
      const lastItem = (data[data.length - 1] as any)[column];

      if (direction === "next") {
        // Forward pagination
        nextCursor = hasMore ? lastItem : undefined;

        // Check if there's a previous page
        if (cursor) {
          hasPrev = true;
          prevCursor = firstItem;
        }
      } else {
        // Backward pagination
        prevCursor = hasMore ? firstItem : undefined;
        hasPrev = hasMore;

        // Check if there's a next page
        if (cursor) {
          nextCursor = lastItem;
        }
      }
    }

    return {
      data,
      pagination: {
        hasMore,
        hasPrev,
        nextCursor,
        prevCursor,
      },
    };
  }

  // ============================================================================
  // INSPECTION / DEBUGGING
  // ============================================================================

  /**
   * Returns the MongoDB aggregation pipeline that will be executed.
   */
  public parse(): DriverQuery {
    return { pipeline: this.buildPipeline() };
  }

  /**
   * Returns a formatted string representation of the query pipeline.
   * @returns A formatted string representation of the pipeline
   */
  public pretty() {
    return this.getParser().toPrettyString();
  }

  /**
   * Returns the MongoDB query execution plan.
   * @returns MongoDB's explain output
   */
  public async explain(): Promise<unknown> {
    // TODO: Trigger the explaining event
    const pipeline = this.buildPipeline();
    const session = databaseTransactionContext.getSession();
    const options = session ? { session, explain: true } : { explain: true };

    return this.collection.aggregate(pipeline, options as any).toArray();
  }

  // ============================================================================
  // INTERNAL PIPELINE BUILDING
  // ============================================================================

  /**
   * Get query parser instance
   */
  protected getParser(): MongoQueryParser {
    this.applyPendingScopes();

    return new MongoQueryParser({
      collection: this.collection,
      operations: this.operations,
      createSubBuilder: () => new MongoQueryBuilder(this.table, this.dataSource),
    });
  }

  /**
   * Build the MongoDB aggregation pipeline from the operations list.
   * @returns The MongoDB aggregation pipeline
   */
  protected buildPipeline() {
    const parser = this.getParser();

    return parser.parse();
  }

  /**
   * Build a MongoDB filter object from the query's where clauses.
   * Used for update operations like increment/decrement.
   * @returns The MongoDB filter object
   */
  protected buildFilter(): Record<string, unknown> {
    // Get all match operations
    const matchOperations = this.operations.filter((op) => op.stage === "$match");

    if (matchOperations.length === 0) {
      return {}; // No filters, match all documents
    }

    // Build the pipeline and extract the first $match stage
    const pipeline = this.buildPipeline();
    const matchStage = pipeline.find((stage) => stage.$match);

    if (matchStage && matchStage.$match) {
      return matchStage.$match;
    }

    return {};
  }

  /**
   * Execute the aggregate command
   */
  protected async execute<T extends any = any>(pipeline?: any[]): Promise<T[]> {
    const aggregationPipeline = pipeline || this.buildPipeline();
    const session = databaseTransactionContext.getSession() as ClientSession | undefined;
    const options: AggregateOptions = { session };

    // TODO: Trigger the executing event
    const results = (await this.collection
      .aggregate(aggregationPipeline, options)
      .toArray()) as T[];

    // TODO: Trigger the fetched event

    // we need to cleanup the operations list
    this.operations = [];
    this.operationsHelper.setOperations(this.operations);

    return results;
  }

  // ============================================================================
  // RELATIONS / EAGER LOADING (Stubs)
  // ============================================================================

  /**
   * Relations to eagerly load.
   */
  public eagerLoadRelations: Map<string, boolean | ((query: QueryBuilderContract) => void)> =
    new Map();

  /**
   * Relations to count.
   */
  public countRelations: string[] = [];

  /**
   * Relations to load via $lookup (single query).
   */
  public joinRelations: Map<string, { alias: string; type: "belongsTo" | "hasOne" | "hasMany" }> =
    new Map();

  /**
   * Relation definitions from the model.
   */
  declare public relationDefinitions?: Record<string, any>;

  /**
   * Model class reference.
   */
  declare public modelClass?: any;

  /**
   * Load relations using MongoDB $lookup in a single aggregation query.
   *
   * Unlike `with()` which uses separate queries, `joinWith()` uses
   * $lookup to fetch related data in a single aggregation pipeline.
   *
   * @param relations - Relation names to load via $lookup
   * @returns This builder for chaining
   */
  public joinWith(...relations: string[]): this {
    for (const relation of relations) {
      const def = this.relationDefinitions?.[relation];
      if (def) {
        this.joinRelations.set(relation, {
          alias: `_rel_${relation}`,
          type: def.type,
        });
      }
    }
    return this;
  }

  /**
   * Eagerly load one or more relations.
   *
   * Supported patterns:
   * - `with("posts")` - Load relation
   * - `with("posts", "comments")` - Load multiple relations
   * - `with("posts", callback)` - Load relation with constraint
   * - `with({ posts: true, comments: callback })` - Object configuration
   *
   * @param args - Relation name(s), callbacks, or configuration object
   */
  public with(
    ...args: (
      | string
      | Record<string, boolean | ((query: QueryBuilderContract) => void)>
      | ((query: QueryBuilderContract) => void)
    )[]
  ): this {
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (typeof arg === "string") {
        // Check if next argument is a callback for this relation
        const nextArg = args[i + 1];
        if (typeof nextArg === "function") {
          this.eagerLoadRelations.set(arg, nextArg);
          i++; // Skip the callback in next iteration
        } else {
          this.eagerLoadRelations.set(arg, true);
        }
      } else if (typeof arg === "object" && arg !== null) {
        for (const [key, value] of Object.entries(arg)) {
          this.eagerLoadRelations.set(key, value);
        }
      }
      // Functions not preceded by a string are ignored (invalid usage)
    }
    return this;
  }

  /**
   * Add a count of related models as a virtual field.
   * @param relations - Relation name(s) to count
   */
  public withCount(...relations: string[]): this {
    this.countRelations.push(...relations);
    return this;
  }

  /**
   * Filter results to only those that have related models.
   * @param relation - Relation name
   * @param operator - Optional comparison operator
   * @param count - Optional count to compare against
   */
  public has(relation: string, operator?: string, count?: number): this {
    // TODO: Implement has() using $lookup and $match
    this.operationsHelper.addMatchOperation("has", { relation, operator, count });
    return this;
  }

  /**
   * Filter results that have related models matching specific conditions.
   * @param relation - Relation name
   * @param callback - Callback to define conditions
   */
  public whereHas(relation: string, callback: (query: QueryBuilderContract) => void): this {
    // TODO: Implement whereHas() using $lookup with pipeline
    this.operationsHelper.addMatchOperation("whereHas", { relation, callback });
    return this;
  }

  /**
   * Filter results that don't have any related models.
   * @param relation - Relation name
   */
  public doesntHave(relation: string): this {
    // TODO: Implement doesntHave() using $lookup and $match
    this.operationsHelper.addMatchOperation("doesntHave", { relation });
    return this;
  }

  /**
   * Filter results that don't have related models matching specific conditions.
   * @param relation - Relation name
   * @param callback - Callback to define conditions
   */
  public whereDoesntHave(relation: string, callback: (query: QueryBuilderContract) => void): this {
    // TODO: Implement whereDoesntHave() using $lookup with pipeline
    this.operationsHelper.addMatchOperation("whereDoesntHave", { relation, callback });
    return this;
  }

  /**
   * Nearest-neighbour vector similarity search via MongoDB Atlas $vectorSearch.
   *
   * Adds two pipeline stages:
   * 1. `$vectorSearch` — runs the ANN search using the Atlas vector index.
   *    Must be the first stage in the pipeline. Limit is embedded here.
   * 2. `$addFields` — exposes `{ $meta: "vectorSearchScore" }` under `alias`
   *    so callers can filter by minimum score after `.get()`.
   *
   * **Prerequisites:**
   * - MongoDB Atlas cluster (local/Community MongoDB does NOT support $vectorSearch)
   * - A vector search index on the collection, e.g.:
   *   `{ "fields": [{ "type": "vector", "path": "embedding", "numDimensions": 1536, "similarity": "cosine" }] }`
   * - The index name convention used here is `"${column}_index"` (override via `alias` if needed).
   *
   * @param column    - Vector column name (e.g. `"embedding"`)
   * @param embedding - Query embedding as a plain number array
   * @param alias     - Score alias added to each result row (default: `"score"`)
   *
   * @example
   * ```typescript
   * const results = await Vector.query()
   *   .where({ organization_id: "org-123" })
   *   .similarTo("embedding", queryEmbedding)
   *   .limit(5)
   *   .get<VectorRow & { score: number }>();
   * ```
   */
  public similarTo(column: string, embedding: number[], alias = "score"): this {
    // Grab the limit op recorded so far (default to 10 if not set yet)
    const limitOp = this.operations.find((op) => op.type === "limit");
    const limit = (limitOp?.data?.value as number) ?? 10;

    // Stage 1: $vectorSearch — ANN search via Atlas vector index
    this.operationsHelper.addOperation(
      "$vectorSearch",
      "vectorSearch",
      {
        index: `${column}_index`,
        path: column,
        queryVector: embedding,
        numCandidates: limit * 10, // Atlas recommendation: 10–20x the limit
        limit,
      },
      false, // Not mergeable — must stay as its own stage
    );

    // Stage 2: $addFields — expose vectorSearchScore as the score alias
    this.operationsHelper.addOperation(
      "$addFields",
      "vectorSearchScore",
      { [alias]: { $meta: "vectorSearchScore" } },
      false,
    );

    return this;
  }
}
