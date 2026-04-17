/**
 * Ordering direction supported by query builders.
 */
export type OrderDirection = "asc" | "desc";

/**
 * Options describing a relationship join.
 */
export type JoinOptions = {
  /** Target table or collection. */
  table: string;
  /** Local field used in the join condition. */
  localField?: string;
  /** Operator used in the join condition (defaults to equality). */
  operator?: string;
  /** Foreign field used in the join condition. */
  foreignField?: string;
  /** Join type. */
  type?: "inner" | "left" | "right" | "full" | "cross";
  /** Optional alias for the joined relation. */
  alias?: string;
  /** Driver-specific options (e.g. Mongo pipeline). */
  options?: Record<string, unknown>;
  /** Projection overrides for the joined relation. */
  select?: string[];
  /** Extra join conditions expressed as key/value pairs. */
  conditions?: Record<string, unknown>;
  /** Driver specific pipeline/clauses for advanced joins. */
  pipeline?: unknown[];
};

/**
 * Pagination result returned by paginate helpers.
 */
export type PaginationResult<T> = {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

/**
 * Cursor pagination result.
 */
export type CursorPaginationResult<T> = {
  data: T[];
  pagination: {
    hasMore: boolean;
    hasPrev?: boolean;
    nextCursor?: unknown;
    prevCursor?: unknown;
  };
};

/**
 * Chunk callback signature.
 */
export type ChunkCallback<T> = (
  rows: T[],
  chunkIndex: number,
) => Promise<boolean | void> | boolean | void;

/**
 * Cursor pagination options.
 */
export type CursorPaginationOptions = {
  cursor?: unknown;
  direction?: "next" | "prev";
  limit: number;
  column?: string;
};

/**
 * Standard pagination options.
 */
export type PaginationOptions = {
  page?: number;
  limit?: number;
};

/**
 * Supported comparison operators.
 */
export type WhereOperator =
  | "="
  | "!="
  | ">"
  | ">="
  | "<"
  | "<="
  | "in"
  | "notIn"
  | "between"
  | "notBetween"
  | "like"
  | "notLike"
  | "startsWith"
  | "notStartsWith"
  | "endsWith"
  | "notEndsWith"
  | "exists"
  | string;

/**
 * Object-based predicate definition.
 */
import type { GlobalScopeDefinition, LocalScopeCallback } from "../model/model";
export type WhereObject = Record<string, unknown>;

/**
 * Callback-based predicate definition.
 */
export type WhereCallback<T> = (builder: QueryBuilderContract<T>) => unknown;

/**
 * Group-by payload supporting strings, arrays, or driver specific objects.
 */
export type GroupByInput =
  | string
  | string[]
  | Record<string, unknown>
  | Array<Record<string, unknown>>;

/**
 * Having clause payload.
 */
export type HavingInput =
  | Record<string, unknown>
  | [field: string, value: unknown]
  | [field: string, operator: WhereOperator, value: unknown];

/**
 * Raw expression payload for projection/order/group extensions.
 */
export type RawExpression = string | Record<string, unknown> | unknown;

/**
 * Driver-agnostic representation of a parsed query.
 *
 * Each driver populates only the fields it understands:
 *
 * - **SQL/CQL/Cypher** drivers → `query` + `bindings`
 * - **MongoDB** → `pipeline`
 * - **Elasticsearch** → `pipeline` (JSON DSL body)
 * - **DynamoDB / Redis / custom** → `native`
 *
 * @example
 * // PostgreSQL result:
 * { query: "SELECT * FROM users WHERE id = $1", bindings: [42] }
 *
 * // MongoDB result:
 * { pipeline: [{ $match: { status: "active" } }, { $limit: 10 }] }
 */
export type DriverQuery = {
  /** Text-based query string: SQL, CQL, Cypher, etc. */
  query?: string;
  /** Positional or named parameter bindings for the text query. */
  bindings?: unknown[];
  /** Document pipeline: MongoDB aggregation stages, Elasticsearch DSL body, etc. */
  pipeline?: unknown[];
  /** Full escape hatch for drivers that don't fit any shape above. */
  native?: unknown;
};

/**
 * Contract that all query builders must implement for building queries in a
 * database-agnostic way. This interface provides a fluent, chainable API
 * for constructing complex database queries.
 *
 * @template T - The type of records returned by the query
 */
export interface QueryBuilderContract<T = unknown> {
  /**
   * Table name
   */
  table: string;
  /**
   * Hydrate records after fetching is done successfully
   * Add hydrate callback function
   */
  hydrate(callback: (data: any, index: number) => any): this;

  /**
   * Register a callback to be invoked before query execution.
   * Allows modification of the query before it runs.
   * @returns Unsubscribe function to remove the callback
   */
  onFetching(callback: (query: this) => void | Promise<void>): () => void;

  /**
   * Register a callback to be invoked after records are fetched but before hydration.
   * Receives raw records from the database.
   * @returns Unsubscribe function to remove the callback
   */
  onHydrating(callback: (records: any[], context: any) => void | Promise<void>): () => void;

  /**
   * Register a callback to be invoked after records are fetched and hydrated.
   * Receives hydrated model instances.
   * @returns Unsubscribe function to remove the callback
   */
  onFetched(callback: (records: any[], context: any) => void | Promise<void>): () => void;

  // ============================================================================
  // SCOPES
  // ============================================================================

  /**
   * Pending global scopes to be applied before query execution.
   * Passed from Model.query() and applied in execute().
   */
  pendingGlobalScopes?: Map<string, GlobalScopeDefinition>;

  /**
   * Available local scopes that can be manually applied.
   * Passed from Model.query() for opt-in usage.
   */
  availableLocalScopes?: Map<string, LocalScopeCallback>;

  /**
   * Set of global scope names that have been disabled.
   */
  disabledGlobalScopes?: Set<string>;

  /**
   * Flag indicating whether scopes have been applied.
   */
  scopesApplied?: boolean;

  // ============================================================================
  // RELATIONS / EAGER LOADING
  // ============================================================================

  /**
   * Map of relations to eagerly load.
   * Keys are relation names, values are either:
   * - `true` for simple loading
   * - A callback to customize the related query
   */
  eagerLoadRelations?: Map<string, boolean | ((query: QueryBuilderContract) => void)>;

  /**
   * Array of relation names to count.
   */
  countRelations?: string[];

  /**
   * Map of relations to load via JOIN (single query).
   * Keys are relation names, values contain join configuration.
   */
  joinRelations?: Map<
    string,
    {
      alias: string;
      type: "belongsTo" | "hasOne" | "hasMany";
      model?: any;
      localKey?: string;
      foreignKey?: string;
      ownerKey?: string;
      parentPath?: string | null;
      relationName?: string;
      parentModel?: any;
      select?: string[];
    }
  >;

  /**
   * Relation definitions from the model class.
   * Used by joinWith() to determine how to join tables.
   */
  relationDefinitions?: Record<string, any>;

  /**
   * Model class reference for resolving related models.
   */
  modelClass?: any;

  /**
   * Load relations using database JOINs in a single query.
   *
   * Unlike `with()` which uses separate queries, `joinWith()` uses
   * LEFT JOIN (SQL) or $lookup (MongoDB) to fetch related data
   * in a single query. The related data is hydrated into proper
   * model instances and attached to the main model.
   *
   * Best for: belongsTo and hasOne relations where you need
   * efficient single-query loading.
   *
   * @param relation - Relation name to load via JOIN
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * // Single relation
   * const post = await Post.joinWith("author").first();
   * console.log(post.author); // User model instance
   * console.log(post.data);   // { id, title, authorId } - no author data
   *
   * // Multiple relations
   * const post = await Post.joinWith("author", "category").first();
   * ```
   */
  joinWith(...relations: string[]): this;

  /**
   * Disable one or more global scopes for this query.
   *
   * @param scopeNames - Names of scopes to disable
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * // Disable tenant scope for admin queries
   * await User.query().withoutGlobalScope('tenant').get();
   *
   * // Disable multiple scopes
   * await User.query().withoutGlobalScope('tenant', 'softDelete').get();
   * ```
   */
  withoutGlobalScope(...scopeNames: string[]): this;

  /**
   * Disable all global scopes for this query.
   *
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * // Get all users including soft-deleted and from all tenants
   * await User.query().withoutGlobalScopes().get();
   * ```
   */
  withoutGlobalScopes(): this;

  /**
   * Apply a local scope to this query.
   *
   * @param scopeName - Name of the scope to apply
   * @returns Query builder for chaining
   * @throws Error if scope not found
   *
   * @example
   * ```typescript
   * // Apply 'active' scope
   * await User.query().scope('active').get();
   *
   * // Chain multiple scopes
   * await User.query().scope('active').scope('admins').get();
   * ```
   */
  scope(scopeName: string, ...args: any[]): this;

  // ============================================================================
  // WHERE CLAUSES
  // ============================================================================

  /**
   * Add a where clause to the query.
   *
   * @example
   * // Simple equality
   * query.where('age', 18)
   *
   * // With operator
   * query.where('age', '>', 18)
   *
   * // Object-based
   * query.where({ age: 18, isActive: true })
   *
   * // Callback-based
   * query.where(q => q.where('age', '>', 18).orWhere('role', 'admin'))
   */
  where(field: string, value: unknown): this;
  where(field: string, operator: WhereOperator, value: unknown): this;
  where(conditions: WhereObject): this;
  where(callback: WhereCallback<T>): this;

  /**
   * Add a raw where clause expressed in the native query language.
   *
   * @example
   * query.whereRaw({ $expr: { $gt: ["$stock", "$reserved"] } })
   * query.whereRaw("this.age > ?", [30])
   */
  whereRaw(expression: RawExpression, bindings?: unknown[]): this;

  /**
   * Add a raw OR where clause expressed in the native query language.
   *
   * @example
   * query.orWhereRaw({ $where: "this.isAdmin === true" })
   */
  orWhereRaw(expression: RawExpression, bindings?: unknown[]): this;

  /**
   * Compare two columns/fields directly.
   *
   * @example
   * query.whereColumn('stock', '>', 'reserved')
   */
  whereColumn(first: string, operator: WhereOperator, second: string): this;

  /**
   * Compare two columns/fields directly using OR logic.
   *
   * @example
   * query.orWhereColumn('startDate', '<', 'endDate')
   */
  orWhereColumn(first: string, operator: WhereOperator, second: string): this;

  /**
   * Compare multiple column pairs at once.
   *
   * @example
   * query.whereColumns([
   *   ['price', '>', 'discountPrice'],
   *   ['stock', '>=', 'reserved'],
   * ])
   */
  whereColumns(comparisons: Array<[left: string, operator: WhereOperator, right: string]>): this;

  /**
   * Ensure a value falls between two other column values.
   *
   * @example
   * query.whereBetweenColumns('age', 'minAge', 'maxAge')
   */
  whereBetweenColumns(field: string, lowerColumn: string, upperColumn: string): this;

  /**
   * Constrain a field to a specific date (time portion ignored).
   *
   * @example
   * query.whereDate('createdAt', '2024-05-01')
   */
  whereDate(field: string, value: Date | string): this;

  /**
   * Require a field to match a given date exactly.
   */
  whereDateEquals(field: string, value: Date | string): this;

  /**
   * Require a field to be before the given date.
   */
  whereDateBefore(field: string, value: Date | string): this;

  /**
   * Require a field to be after the given date.
   */
  whereDateAfter(field: string, value: Date | string): this;

  /**
   * Constrain a field to match a specific time.
   *
   * @example
   * query.whereTime('opensAt', '08:00')
   */
  whereTime(field: string, value: string): this;

  /**
   * Constrain the day-of-month extracted from a date field.
   */
  whereDay(field: string, value: number): this;

  /**
   * Constrain the month extracted from a date field.
   */
  whereMonth(field: string, value: number): this;

  /**
   * Constrain the year extracted from a date field.
   */
  whereYear(field: string, value: number): this;

  /**
   * Ensure a JSON/array path contains the given value.
   */
  whereJsonContains(path: string, value: unknown): this;

  /**
   * Ensure a JSON/array path does not contain the given value.
   */
  whereJsonDoesntContain(path: string, value: unknown): this;

  /**
   * Ensure a JSON/array path exists.
   */
  whereJsonContainsKey(path: string): this;

  /**
   * Constrain the length of a JSON/array path.
   *
   * @example
   * query.whereJsonLength('tags', '>', 3)
   */
  whereJsonLength(path: string, operator: WhereOperator, value: number): this;

  /**
   * Ensure a JSON path resolves to an array.
   */
  whereJsonIsArray(path: string): this;

  /**
   * Ensure a JSON path resolves to an object.
   */
  whereJsonIsObject(path: string): this;

  /**
   * Constrain the length of an array field.
   *
   * @example
   * query.whereArrayLength('roles', '>=', 2)
   */
  whereArrayLength(field: string, operator: WhereOperator, value: number): this;

  /**
   * Shortcut for filtering by the primary key.
   */
  whereId(value: string | number): this;

  /**
   * Shortcut for filtering by multiple primary keys.
   */
  whereIds(values: Array<string | number>): this;

  /**
   * Shortcut for UUID-based identifiers.
   */
  whereUuid(value: string): this;

  /**
   * Shortcut for ULID-based identifiers.
   */
  whereUlid(value: string): this;

  /**
   * Perform a full-text search across the specified fields.
   */
  whereFullText(fields: string | string[], query: string): this;

  /**
   * Apply a full-text OR clause.
   */
  orWhereFullText(fields: string | string[], query: string): this;

  /**
   * Convenience alias for simple text searches.
   */
  whereSearch(field: string, query: string): this;

  /**
   * Negate a nested callback block.
   */
  whereNot(callback: WhereCallback<T>): this;

  /**
   * Negate a nested callback block with OR logic.
   */
  orWhereNot(callback: WhereCallback<T>): this;

  /**
   * Apply a nested existence check.
   *
   * @example
   * query.whereExists(q => q.where('status', 'active'))
   * query.whereExists('optionalField')
   */
  whereExists(callback: WhereCallback<T>): this;

  /**
   * Apply a nested non-existence check.
   *
   * @example
   * query.whereNotExists(q => q.where('status', 'inactive'))
   * query.whereNotExists('deletedAt')
   */
  whereNotExists(callback: WhereCallback<T>): this;

  /**
   * Add an OR where clause to the query.
   *
   * @example
   * query.where('role', 'admin').orWhere('role', 'moderator')
   */
  orWhere(field: string, value: unknown): this;
  orWhere(field: string, operator: WhereOperator, value: unknown): this;
  orWhere(conditions: WhereObject): this;
  orWhere(callback: WhereCallback<T>): this;

  /**
   * Add a where IN clause to the query.
   *
   * @example
   * query.whereIn('status', ['active', 'pending'])
   */
  whereIn(field: string, values: unknown[]): this;

  /**
   * Add a where NOT IN clause to the query.
   *
   * @example
   * query.whereNotIn('status', ['deleted', 'archived'])
   */
  whereNotIn(field: string, values: unknown[]): this;

  /**
   * Constrain the field to be NULL.
   *
   * @example
   * query.whereNull('deletedAt')
   */
  whereNull(field: string): this;

  /**
   * Constrain the field to be NOT NULL.
   *
   * @example
   * query.whereNotNull('email')
   */
  whereNotNull(field: string): this;

  /**
   * Constrain the field to be between the given range (inclusive).
   *
   * @example
   * query.whereBetween('age', [18, 65])
   */
  whereBetween(field: string, range: [unknown, unknown]): this;

  /**
   * Constrain the field to be outside the given range.
   *
   * @example
   * query.whereNotBetween('age', [18, 65])
   */
  whereNotBetween(field: string, range: [unknown, unknown]): this;

  /**
   * Apply pattern matching (case-insensitive) for the given field.
   *
   * @example
   * query.whereLike('name', '%john%')
   */
  whereLike(field: string, pattern: RegExp | string): this;

  /**
   * Apply pattern exclusion (case-insensitive) for the given field.
   *
   * @example
   * query.whereNotLike('email', '%@spam.com')
   */
  whereNotLike(field: string, pattern: string): this;

  /**
   * Constrain the field to start with the given value.
   *
   * @example
   * query.whereStartsWith('name', 'John')
   */
  whereStartsWith(field: string, value: string | number): this;

  /**
   * Constrain the field to not start with the given value.
   *
   * @example
   * query.whereNotStartsWith('name', 'Admin')
   */
  whereNotStartsWith(field: string, value: string | number): this;

  /**
   * Constrain the field to end with the given value.
   *
   * @example
   * query.whereEndsWith('email', '@example.com')
   */
  whereEndsWith(field: string, value: string | number): this;

  /**
   * Constrain the field to not end with the given value.
   *
   * @example
   * query.whereNotEndsWith('email', '@spam.com')
   */
  whereNotEndsWith(field: string, value: string | number): this;

  /**
   * Constrain the date field to be between the given range.
   *
   * @example
   * query.whereDateBetween('createdAt', [startDate, endDate])
   */
  whereDateBetween(field: string, range: [Date, Date]): this;

  /**
   * Constrain the date field to not be between the given range.
   *
   * @example
   * query.whereDateNotBetween('createdAt', [startDate, endDate])
   */
  whereDateNotBetween(field: string, range: [Date, Date]): this;

  /**
   * Check that a field exists (MongoDB-specific).
   *
   * @example
   * query.whereExists('optionalField')
   */
  whereExists(field: string): this;

  /**
   * Check that a field does not exist (MongoDB-specific).
   *
   * @example
   * query.whereNotExists('optionalField')
   */
  whereNotExists(field: string): this;

  /**
   * Constrain an array/collection field by size.
   *
   * @example
   * // Exact size
   * query.whereSize('tags', 3)
   *
   * // With operator
   * query.whereSize('tags', '>', 0)
   */
  whereSize(field: string, size: number): this;
  whereSize(field: string, operator: ">" | ">=" | "=" | "<" | "<=", size: number): this;

  /**
   * Perform a full-text search (driver-specific implementation).
   *
   * @example
   * query.textSearch('javascript tutorial', { language: 'en' })
   */
  textSearch(query: string, filters?: WhereObject): this;

  /**
   * Constrain an array field to contain the given value.
   * Optionally match by a specific key within array of objects.
   *
   * @example
   * // Simple array
   * query.whereArrayContains('tags', 'javascript')
   *
   * // Array of objects
   * query.whereArrayContains('items', 'laptop', 'name')
   */
  whereArrayContains(field: string, value: unknown, key?: string): this;

  /**
   * Constrain an array field to not contain the given value.
   *
   * @example
   * query.whereArrayNotContains('tags', 'deprecated')
   */
  whereArrayNotContains(field: string, value: unknown, key?: string): this;

  /**
   * Constrain an array field to contain the value OR be empty.
   *
   * @example
   * query.whereArrayHasOrEmpty('permissions', 'admin')
   */
  whereArrayHasOrEmpty(field: string, value: unknown, key?: string): this;

  /**
   * Constrain an array field to not contain the value OR be empty.
   *
   * @example
   * query.whereArrayNotHaveOrEmpty('blockedUsers', userId)
   */
  whereArrayNotHaveOrEmpty(field: string, value: unknown, key?: string): this;

  // ============================================================================
  // SELECT / PROJECTION
  // ============================================================================

  /**
   * Specify the columns/fields to be selected.
   *
   * @example
   * query.select(['name', 'email', 'age'])
   */
  select(fields: string[]): this;
  select(fields: Record<string, 0 | 1 | boolean>): this;
  select(...fields: Array<string | string[]>): this;
  select(...args: Array<string | string[]>): this;

  /**
   * Select a field with an alias.
   *
   * @example
   * query.selectAs('name', 'fullName')
   */
  selectAs(field: string, alias: string): this;

  /**
   * Add a raw selection/projection expression.
   *
   * @example
   * query.selectRaw({ total: { $sum: "$items.price" } })
   */
  selectRaw(expression: RawExpression, bindings?: unknown[]): this;

  /**
   * Add multiple raw selections at once.
   *
   * @example
   * query.selectRawMany([
   *   { alias: "firstName", expression: "$profile.name.first" },
   *   { alias: "isAdult", expression: { $gte: ["$age", 18] } },
   * ])
   */
  selectRawMany(
    definitions: Array<{
      alias: string;
      expression: RawExpression;
      bindings?: unknown[];
    }>,
  ): this;

  /**
   * Inject a sub-select expression under the given alias.
   *
   * @example
   * query.selectSub({ $sum: "$items.price" }, "itemsTotal")
   */
  selectSub(expression: RawExpression, alias: string): this;

  /**
   * Add a sub-select expression without clearing previous selects.
   */
  addSelectSub(expression: RawExpression, alias: string): this;

  /**
   * Add a simple aggregate expression to the projection.
   *
   * @example
   * query.selectAggregate("items.price", "sum", "itemsTotal")
   */
  selectAggregate(
    field: string,
    aggregate: "sum" | "avg" | "min" | "max" | "count" | "first" | "last",
    alias: string,
  ): this;

  /**
   * Project whether the given field exists.
   *
   * @example
   * query.selectExists("deletedAt", "isDeleted")
   */
  selectExists(field: string, alias: string): this;

  /**
   * Project the number of items in an array field.
   *
   * @example
   * query.selectCount("permissions", "permissionsCount")
   */
  selectCount(field: string, alias: string): this;

  /**
   * Build CASE / switch like conditions in the projection.
   *
   * @example
   * query.selectCase(
   *   [
   *     { when: { $eq: ["$status", "active"] }, then: "Active" },
   *     { when: { $eq: ["$status", "pending"] }, then: "Pending" },
   *   ],
   *   "Unknown",
   *   "statusLabel",
   * )
   */
  selectCase(
    cases: Array<{ when: RawExpression; then: RawExpression | unknown }>,
    otherwise: RawExpression | unknown,
    alias: string,
  ): this;

  /**
   * Convenience helper for single condition CASE statements.
   *
   * @example
   * query.selectWhen({ $gt: ["$age", 18] }, "Adult", "Minor", "ageLabel")
   */
  selectWhen(
    condition: RawExpression,
    thenValue: RawExpression | unknown,
    elseValue: RawExpression | unknown,
    alias: string,
  ): this;

  /**
   * Allow direct access to the driver projection object for advanced cases.
   *
   * @example
   * query.selectDriverProjection(projection => {
   *   projection.score = { $meta: "textScore" };
   * })
   */
  selectDriverProjection(callback: (projection: Record<string, unknown>) => void): this;

  /**
   * Project a nested JSON path under a new alias.
   *
   * @example
   * query.selectJson("settings->theme", "theme")
   */
  selectJson(path: string, alias?: string): this;

  /**
   * Apply a raw expression to a JSON path.
   *
   * @example
   * query.selectJsonRaw("stats->views", { $ifNull: ["$stats.views", 0] }, "views")
   */
  selectJsonRaw(path: string, expression: RawExpression, alias: string): this;

  /**
   * Exclude a nested JSON path from the projection.
   */
  deselectJson(path: string): this;

  /**
   * Compute concatenated string fields.
   *
   * @example
   * query.selectConcat(["$firstName", " ", "$lastName"], "fullName")
   */
  selectConcat(fields: Array<string | RawExpression>, alias: string): this;

  /**
   * Coalesce a list of values, returning the first non-null entry.
   *
   * @example
   * query.selectCoalesce(["$nickname", "$name"], "displayName")
   */
  selectCoalesce(fields: Array<string | RawExpression>, alias: string): this;

  /**
   * Attach window function output to the projection.
   *
   * @example
   * query.selectWindow({
   *   partitionBy: "$category",
   *   sortBy: { createdAt: 1 },
   *   output: { rank: { $denseRank: {} } },
   * })
   */
  selectWindow(spec: RawExpression): this;

  /**
   * Exclude the given fields from the projection.
   *
   * @example
   * query.deselect(['password', 'token'])
   */
  deselect(fields: string[]): this;

  /**
   * Reset the projection to its default state.
   */
  clearSelect(): this;

  /**
   * Alias for clearSelect() - keeps all fields.
   */
  selectAll(): this;

  /**
   * Restore the default projection (all columns).
   */
  selectDefault(): this;

  /**
   * Mark the query as distinct values for the given fields.
   *
   * @example
   * query.distinctValues('category')
   * query.distinctValues(['category', 'status'])
   */
  distinctValues(fields?: string | string[]): this;

  /**
   * Add additional select fields to the existing projection.
   *
   * @example
   * query.select(['name', 'email']).addSelect(['age'])
   */
  addSelect(fields: string[]): this;

  // ============================================================================
  // JOINS
  // ============================================================================

  /**
   * Add a join clause to the query.
   *
   * Performs an INNER JOIN by default. Use leftJoin/rightJoin for outer joins.
   *
   * - **SQL**: Translates to `INNER JOIN table ON localField = foreignField`
   * - **MongoDB**: Translates to `$lookup` aggregation stage
   *
   * @param table - The table/collection to join
   * @param localField - The field from the current table
   * @param foreignField - The field from the joined table
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * // Simple join
   * query.join('profiles', 'id', 'userId');
   *
   * // With options
   * query.join({
   *   table: 'profiles',
   *   localField: 'id',
   *   foreignField: 'userId',
   *   alias: 'profile',
   *   select: ['bio', 'avatar']
   * });
   * ```
   */
  join(table: string, localField: string, foreignField: string): this;
  join(options: JoinOptions): this;

  /**
   * Add a LEFT JOIN clause to the query.
   *
   * Returns all records from the left table, and matched records from the right.
   * If no match, NULL values are returned for right table columns.
   *
   * - **SQL**: Translates to `LEFT JOIN table ON localField = foreignField`
   * - **MongoDB**: Translates to `$lookup` (always behaves like LEFT JOIN)
   *
   * @param table - The table/collection to join
   * @param localField - The field from the current table
   * @param foreignField - The field from the joined table
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * // Get users with their optional profiles
   * query.leftJoin('profiles', 'id', 'userId');
   * ```
   */
  leftJoin(table: string, localField: string, foreignField: string): this;
  leftJoin(options: JoinOptions): this;

  /**
   * Add a RIGHT JOIN clause to the query.
   *
   * Returns all records from the right table, and matched records from the left.
   * If no match, NULL values are returned for left table columns.
   *
   * - **SQL**: Translates to `RIGHT JOIN table ON localField = foreignField`
   * - **MongoDB**: Not directly supported; may throw or emulate
   *
   * @param table - The table/collection to join
   * @param localField - The field from the current table
   * @param foreignField - The field from the joined table
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * // Get all profiles with their users (if any)
   * query.rightJoin('profiles', 'id', 'userId');
   * ```
   */
  rightJoin(table: string, localField: string, foreignField: string): this;
  rightJoin(options: JoinOptions): this;

  /**
   * Add an INNER JOIN clause to the query.
   *
   * Returns only records that have matching values in both tables.
   * Alias for join() with explicit intent.
   *
   * - **SQL**: Translates to `INNER JOIN table ON localField = foreignField`
   * - **MongoDB**: Translates to `$lookup` + `$match` to filter unmatched
   *
   * @param table - The table/collection to join
   * @param localField - The field from the current table
   * @param foreignField - The field from the joined table
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * // Get only users that have profiles
   * query.innerJoin('profiles', 'id', 'userId');
   * ```
   */
  innerJoin(table: string, localField: string, foreignField: string): this;
  innerJoin(options: JoinOptions): this;

  /**
   * Add a FULL OUTER JOIN clause to the query.
   *
   * Returns all records when there is a match in either table.
   * NULL values for non-matching rows on either side.
   *
   * - **SQL**: Translates to `FULL OUTER JOIN table ON localField = foreignField`
   * - **MongoDB**: Not supported; throws error
   *
   * @param table - The table/collection to join
   * @param localField - The field from the current table
   * @param foreignField - The field from the joined table
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * query.fullJoin('profiles', 'id', 'userId');
   * ```
   */
  fullJoin(table: string, localField: string, foreignField: string): this;
  fullJoin(options: JoinOptions): this;

  /**
   * Add a CROSS JOIN clause to the query.
   *
   * Returns the Cartesian product of both tables (every combination).
   * Use with caution as this can produce very large result sets.
   *
   * - **SQL**: Translates to `CROSS JOIN table`
   * - **MongoDB**: Not supported; throws error
   *
   * @param table - The table/collection to cross join
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * // Get all combinations of products and colors
   * query.crossJoin('colors');
   * ```
   */
  crossJoin(table: string): this;

  /**
   * Add a raw JOIN clause using native query syntax.
   *
   * Allows full control over the JOIN expression for complex scenarios.
   *
   * - **SQL**: Passed directly to the query
   * - **MongoDB**: Passed as raw `$lookup` pipeline stage
   *
   * @param expression - Raw JOIN expression in driver's native syntax
   * @param bindings - Optional parameter bindings for SQL placeholders
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * // SQL raw join
   * query.joinRaw('LEFT JOIN profiles ON profiles.user_id = users.id AND profiles.active = $1', [true]);
   *
   * // MongoDB raw $lookup
   * query.joinRaw({
   *   $lookup: {
   *     from: 'profiles',
   *     let: { userId: '$_id' },
   *     pipeline: [{ $match: { $expr: { $eq: ['$userId', '$$userId'] } } }],
   *     as: 'profile'
   *   }
   * });
   * ```
   */
  joinRaw(expression: RawExpression, bindings?: unknown[]): this;

  // ============================================================================
  // RELATIONS / EAGER LOADING
  // ============================================================================

  /**
   * Eagerly load one or more relations with the query results.
   *
   * Relations are loaded in separate optimized queries to prevent N+1 problems.
   * The loaded relations are attached to each model instance.
   *
   * @param relation - Single relation name to load
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * // Load single relation
   * const user = await User.query().with("posts").find(1);
   * console.log(user.posts); // Post[]
   *
   * // Load multiple relations
   * const user = await User.query().with("posts", "organization").find(1);
   *
   * // Load nested relations
   * const user = await User.query().with("posts.comments.author").find(1);
   * ```
   */
  with(relation: string): this;

  /**
   * Eagerly load multiple relations.
   *
   * @param relations - Relation names to load
   * @returns Query builder for chaining
   */
  with(...relations: string[]): this;

  /**
   * Eagerly load a relation with a constraint callback.
   *
   * The callback receives the relation query builder, allowing you to
   * add conditions, ordering, or limits to the related query.
   *
   * @param relation - Relation name to load
   * @param constraint - Callback to configure the relation query
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * const user = await User.query()
   *   .with("posts", (query) => {
   *     query.where("isPublished", true)
   *       .orderBy("createdAt", "desc")
   *       .limit(5);
   *   })
   *   .find(1);
   * ```
   */
  with(relation: string, constraint: (query: QueryBuilderContract) => void): this;

  /**
   * Eagerly load multiple relations with constraints.
   *
   * Pass an object where keys are relation names and values are either:
   * - `true` to load without constraints
   * - A callback function to configure the relation query
   *
   * @param relations - Object mapping relation names to constraints
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * const user = await User.query()
   *   .with({
   *     posts: (query) => query.where("isPublished", true),
   *     organization: true,
   *     roles: (query) => query.orderBy("priority"),
   *   })
   *   .find(1);
   * ```
   */
  with(relations: Record<string, boolean | ((query: QueryBuilderContract) => void)>): this;

  /**
   * Add a count of related models as a virtual field.
   *
   * The count is added as `{relationName}Count` on each result.
   *
   * @param relation - Single relation name to count
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * const users = await User.query().withCount("posts").get();
   * console.log(users[0].postsCount); // number
   * ```
   */
  withCount(relation: string): this;

  /**
   * Add counts of multiple related models as virtual fields.
   *
   * @param relations - Relation names to count
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * const users = await User.query()
   *   .withCount("posts", "comments", "followers")
   *   .get();
   * ```
   */
  withCount(...relations: string[]): this;

  /**
   * Filter results to only those that have related models.
   *
   * @param relation - Relation name to check
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * // Get users who have at least one post
   * const usersWithPosts = await User.query().has("posts").get();
   * ```
   */
  has(relation: string): this;

  /**
   * Filter results based on the count of related models.
   *
   * @param relation - Relation name to check
   * @param operator - Comparison operator
   * @param count - Number to compare against
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * // Get users with at least 5 posts
   * const prolificUsers = await User.query().has("posts", ">=", 5).get();
   *
   * // Get users with exactly 3 roles
   * const users = await User.query().has("roles", "=", 3).get();
   * ```
   */
  has(relation: string, operator: string, count: number): this;

  /**
   * Filter results that have related models matching specific conditions.
   *
   * @param relation - Relation name to check
   * @param callback - Callback to define conditions on the related query
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * // Get users with published posts
   * const users = await User.query()
   *   .whereHas("posts", (query) => {
   *     query.where("isPublished", true);
   *   })
   *   .get();
   *
   * // Get users with posts in a specific category
   * const users = await User.query()
   *   .whereHas("posts", (query) => {
   *     query.where("categoryId", categoryId);
   *   })
   *   .get();
   * ```
   */
  whereHas(relation: string, callback: (query: QueryBuilderContract) => void): this;

  /**
   * Filter results that don't have any related models.
   *
   * @param relation - Relation name to check
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * // Get users without any posts
   * const usersWithoutPosts = await User.query().doesntHave("posts").get();
   * ```
   */
  doesntHave(relation: string): this;

  /**
   * Filter results that don't have related models matching specific conditions.
   *
   * @param relation - Relation name to check
   * @param callback - Callback to define conditions on the related query
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * // Get users without any published posts
   * const users = await User.query()
   *   .whereDoesntHave("posts", (query) => {
   *     query.where("isPublished", true);
   *   })
   *   .get();
   * ```
   */
  whereDoesntHave(relation: string, callback: (query: QueryBuilderContract) => void): this;

  // ============================================================================
  // ORDERING
  // ============================================================================

  /**
   * Order results by the specified field and direction.
   *
   * @example
   * query.orderBy('createdAt', 'desc')
   * query.orderBy({ id: 'asc', age: 'desc' })
   */
  orderBy(field: string, direction?: OrderDirection): this;
  orderBy(fields: Record<string, OrderDirection>): this;

  /**
   * Order results descending by the specified field (shortcut).
   *
   * @example
   * query.orderByDesc('createdAt')
   */
  orderByDesc(field: string): this;

  /**
   * Order results using a raw expression.
   *
   * @example
   * query.orderByRaw('RANDOM()')
   */
  orderByRaw(expression: RawExpression, bindings?: unknown[]): this;

  /**
   * Order results randomly.
   *
   * @example
   * query.orderByRandom(100)
   */
  orderByRandom(limit: number): this;

  /**
   * Order by the latest records using a timestamp column (descending).
   * Defaults to 'createdAt'.
   *
   * @example
   * query.latest() // orderBy('createdAt', 'desc')
   * query.latest('updatedAt') // orderBy('updatedAt', 'desc')
   */
  latest(column?: string): Promise<T[]>;

  /**
   * Order by the oldest records using a timestamp column (ascending).
   * Defaults to 'createdAt'.
   *
   * @example
   * query.oldest() // orderBy('createdAt', 'asc')
   */
  oldest(column?: string): this;

  // ============================================================================
  // LIMITING / PAGINATION
  // ============================================================================

  /**
   * Limit the number of results.
   *
   * @example
   * query.limit(10)
   */
  limit(value: number): this;

  /**
   * Skip the specified number of results (alias for offset).
   *
   * @example
   * query.skip(20)
   */
  skip(value: number): this;

  /**
   * Skip the specified number of results.
   *
   * @example
   * query.offset(20)
   */
  offset(value: number): this;

  /**
   * Alias for limit() - take the first N results.
   *
   * @example
   * query.take(5)
   */
  take(value: number): this;

  /**
   * Apply cursor pagination hints.
   *
   * @example
   * query.cursor({ after: lastId })
   */
  cursor(after?: unknown, before?: unknown): this;

  // ============================================================================
  // GROUPING / AGGREGATION
  // ============================================================================

  /**
   * Group results by the given fields.
   *
   * @example
   * query.groupBy('category')
   * query.groupBy(['category', 'status'])
   */
  groupBy(fields: GroupByInput): this;

  /**
   * Group results by the given fields with aggregate operations.
   *
   * This method allows you to group documents and compute aggregates in a single
   * operation. It accepts abstract aggregate expressions (from $agg helpers) or
   * raw database-specific expressions.
   *
   * @param fields - Field(s) to group by
   * @param aggregates - Aggregate operations to perform
   *
   * @example
   * ```typescript
   * import { $agg } from '@warlock.js/cascade';
   *
   * // Using abstract expressions (works for all databases)
   * query.groupBy("type", {
   *   count: $agg.count(),
   *   total: $agg.sum("duration"),
   *   avg: $agg.avg("rating")
   * });
   *
   * // Using raw expressions (database-specific)
   * // MongoDB:
   * query.groupBy("type", {
   *   count: { $sum: 1 },
   *   total: { $sum: "$duration" }
   * });
   *
   * // SQL (future):
   * query.groupBy("type", {
   *   count: "COUNT(*)",
   *   total: "SUM(duration)"
   * });
   * ```
   */
  groupBy(fields: GroupByInput, aggregates: Record<string, RawExpression>): this;

  /**
   * Apply raw grouping expressions.
   *
   * @example
   * query.groupByRaw('DATE(createdAt)')
   */
  groupByRaw(expression: RawExpression, bindings?: unknown[]): this;

  /**
   * Apply having clause to aggregated results.
   *
   * @example
   * query.groupBy('category').having('count', '>', 10)
   */
  having(field: string, value: unknown): this;
  having(field: string, operator: WhereOperator, value: unknown): this;
  having(condition: HavingInput): this;

  /**
   * Apply raw having clause to aggregated results.
   *
   * @example
   * query.havingRaw('COUNT(*) > ?', [10])
   */
  havingRaw(expression: RawExpression, bindings?: unknown[]): this;

  // ============================================================================
  // JOINS
  // ============================================================================

  /**
   * Join another table/collection using a structured payload.
   *
   * @example
   * query.join({
   *   table: 'posts',
   *   localField: 'userId',
   *   foreignField: 'authorId',
   *   type: 'left'
   * })
   */
  join(options: JoinOptions): this;

  // ============================================================================
  // UTILITY / EXTENSIONS
  // ============================================================================

  /**
   * Add driver-specific raw modifications to the query.
   *
   * @example
   * query.raw(nativeQuery => {
   *   // Modify native query object
   *   return nativeQuery;
   * })
   */
  raw(builder: (native: unknown) => unknown): this;

  /**
   * Extend the query builder with driver-specific extensions.
   *
   * @example
   * query.extend('mongoAggregation', { $match: { ... } })
   */
  extend<R>(extension: string, ...args: unknown[]): R;

  /**
   * Clone the current query builder instance.
   *
   * @example
   * const baseQuery = User.query().where('isActive', true);
   * const adminQuery = baseQuery.clone().where('role', 'admin');
   */
  clone(): this;

  /**
   * Tap into the query builder for debugging or side effects without
   * breaking the fluent chain.
   *
   * @example
   * query.where('age', '>', 18).tap(q => console.log(q.parse())).get()
   */
  tap(callback: (builder: this) => void): this;

  /**
   * Conditionally apply a callback to the query.
   *
   * @example
   * query.when(searchTerm, (q, term) => q.whereLike('name', term))
   */
  when<V>(
    condition: V | boolean | (() => boolean),
    callback: (builder: this, value: V) => void,
    otherwise?: (builder: this) => void,
  ): this;

  // ============================================================================
  // EXECUTION METHODS
  // ============================================================================

  /**
   * Execute the query and return all matching records.
   *
   * @example
   * const users = await User.query().where('isActive', true).get();
   */
  get<Output = T>(): Promise<Output[]>;

  /**
   * Execute the query and return the first matching record.
   *
   * @example
   * const user = await User.query().where('email', 'john@example.com').first();
   */
  first<Output = T>(): Promise<Output | null>;

  /**
   * Execute the query and return the first matching record or throw an error.
   *
   * @throws {Error} If no record is found
   * @example
   * const user = await User.query().where('id', 123).firstOrFail();
   */
  firstOrFail<Output = T>(): Promise<Output>;

  /**
   * Configure query to retrieve the last record.
   *
   * @example
   * const lastUser = await User.query().last().first();
   */
  last<Output = T>(field?: string): Promise<Output | null>;

  /**
   * Count the records matching the query.
   *
   * @example
   * const total = await User.query().where('isActive', true).count();
   */
  count(): Promise<number>;

  /**
   * Aggregate sum for the given field.
   *
   * @example
   * const total = await Order.query().sum('amount');
   */
  sum(field: string): Promise<number>;

  /**
   * Aggregate average for the given field.
   *
   * @example
   * const avgAge = await User.query().avg('age');
   */
  avg(field: string): Promise<number>;

  /**
   * Aggregate minimum for the given field.
   *
   * @example
   * const minPrice = await Product.query().min('price');
   */
  min(field: string): Promise<number>;

  /**
   * Aggregate maximum for the given field.
   *
   * @example
   * const maxPrice = await Product.query().max('price');
   */
  max(field: string): Promise<number>;

  /**
   * Retrieve distinct values for a field.
   * @param field - The field to get distinct values from
   * @returns an array of distinct values
   *
   * @example
   * const categories = await Product.query().distinct('category');
   */
  distinct<T = unknown>(field: string): Promise<T[]>;

  /**
   * Retrieve a list of values for the given field.
   *
   * @example
   * const names = await User.query().pluck('name');
   */
  pluck(field: string): Promise<unknown[]>;

  /**
   * Retrieve a single scalar value for the given field from the first record.
   *
   * @example
   * const email = await User.query().where('id', 123).value('email');
   */
  value<T = unknown>(field: string): Promise<T | null>;

  /**
   * Determine if any record matches the current query.
   *
   * @example
   * const hasActiveUsers = await User.query().where('isActive', true).exists();
   */
  exists(): Promise<boolean>;

  /**
   * Determine if no records match the current query.
   *
   * @example
   * const noAdmins = await User.query().where('role', 'admin').doesntExist();
   */
  notExists(): Promise<boolean>;

  /**
   * Count distinct values for the given field.
   *
   * @example
   * const uniqueCategories = await Product.query().countDistinct('category');
   */
  countDistinct(field: string): Promise<number>;

  /**
   * Increment a field's value by the given amount.
   *
   * @returns the new value
   * @example
   * await User.query().where('id', 123).increment('loginCount', 1);
   */
  increment(field: string, amount?: number): Promise<number>;

  /**
   * Decrement a field's value by the given amount.
   *
   * @returns the new value
   * @example
   * await Product.query().where('id', 456).decrement('stock', 5);
   */
  decrement(field: string, amount?: number): Promise<number>;

  /**
   * Increment a field's value by the given amount for all matching documents.
   * @param field - The field to increment
   * @param amount - The amount to increment by (default: 1)
   * @returns the number of documents modified
   */
  incrementMany(field: string, amount?: number): Promise<number>;

  /**
   * Decrement a field's value by the given amount for all matching documents.
   * @param field - The field to decrement
   * @param amount - The amount to decrement by (default: 1)
   * @returns the number of documents modified
   */
  decrementMany(field: string, amount?: number): Promise<number>;

  // ============================================================================
  // CHUNKING / PAGINATION
  // ============================================================================

  /**
   * Iterate through results in chunks, executing the callback for each chunk.
   * Return false from the callback to stop iteration.
   *
   * @example
   * await User.query().chunk(100, async (users, index) => {
   *   await processUsers(users);
   *   // Return false to stop
   * });
   */
  chunk(size: number, callback: ChunkCallback<T>): Promise<void>;

  /**
   * Paginate the results with standard page/limit pagination.
   *
   * @example
   * const result = await User.query().paginate({ page: 1, limit: 10 });
   * // { data: [...], total: 100, page: 1, limit: 10, pages: 10 }
   */
  paginate(options: PaginationOptions): Promise<PaginationResult<T>>;

  /**
   * Paginate using cursor-based strategy for better performance.
   *
   * @example
   * const result = await User.query().cursorPaginate({ limit: 10, cursor: lastId });
   * // { data: [...], hasMore: true, nextCursor: '...' }
   */
  cursorPaginate(options: CursorPaginationOptions): Promise<CursorPaginationResult<T>>;

  // ============================================================================
  // INSPECTION / DEBUGGING
  // ============================================================================

  /**
   * Return the driver-native query representation without executing it.
   * SQL drivers populate `query` + `bindings`; MongoDB populates `pipeline`;
   * exotic drivers use `native`.
   *
   * @example
   * // PostgreSQL:
   * const { query, bindings } = builder.parse();
   * console.log(query, bindings);
   *
   * // MongoDB:
   * const { pipeline } = builder.parse();
   * console.log(pipeline); // [{ $match: { age: { $gt: 18 } } }, ...]
   */
  parse(): DriverQuery;

  /**
   * Returns a formatted string representation of the query pipeline | SQL string.
   * @returns A formatted string representation of the pipeline|SQL string
   */
  pretty(): string;

  /**
   * Ask the underlying driver to explain the query execution plan.
   *
   * @example
   * const plan = await query.explain();
   */
  explain(): Promise<unknown>;

  /**
   * Nearest-neighbour vector similarity search.
   *
   * Simultaneously:
   *  1. Adds `1 - (column <=> $n::vector) AS score` to the SELECT clause
   *     so the similarity value is available on every returned row.
   *  2. Adds `ORDER BY column <=> $n::vector` so the database can use
   *     the vector index (IVFFlat / HNSW) rather than doing a sequential scan.
   *
   * The two expressions MUST reference the same embedding literal so pgvector
   * plans the nearest-neighbour scan correctly. Calling `.orderBy()` on the
   * alias afterwards would break index usage.
   *
   * Drivers that do not support vector search (e.g. MongoDB without Atlas)
   * should throw an `UnsupportedOperationError`.
   *
   * @param column   - Name of the vector column (e.g. `"embedding"`)
   * @param embedding - Query embedding as a plain number array
   * @param alias    - Alias for the similarity score column (default: `"score"`)
   *
   * @example
   * ```typescript
   * const results = await Vector.query()
   *   .where({ organization_id: "org-123", content_type: "summary" })
   *   .similarTo("embedding", queryEmbedding)
   *   .limit(5)
   *   .get<VectorRow & { score: number }>();
   * ```
   */
  similarTo(column: string, embedding: number[], alias?: string): this;
}
