import type {
  ChunkCallback,
  CursorPaginationOptions,
  CursorPaginationResult,
  FilterOptions,
  FilterRules,
  PaginationResult,
  WhereOperator,
} from "./types";

/**
 * Query builder contract for building database queries
 * This interface is ORM-agnostic and can be implemented by any data source adapter
 *
 * @template T - The type of records being queried
 */
export interface QueryBuilderContract<T> {
  // ============================================================================
  // WHERE CLAUSES
  // ============================================================================

  /**
   * Add a where clause to the query
   *
   * @param field - Column name
   * @param value - Value to compare
   * @returns Query builder for chaining
   *
   * @example
   * query.where("email", "user@example.com")
   */
  where(field: string, value: any): this;

  /**
   * Add a where clause with operator
   *
   * @param field - Column name
   * @param operator - Comparison operator
   * @param value - Value to compare
   * @returns Query builder for chaining
   *
   * @example
   * query.where("age", ">", 18)
   */
  where(field: string, operator: WhereOperator, value: any): this;

  /**
   * Add multiple where clauses from object
   *
   * @param conditions - Object mapping columns to values
   * @returns Query builder for chaining
   *
   * @example
   * query.where({ email: "user@example.com", isActive: true })
   */
  where(conditions: Record<string, any>): this;

  /**
   * Add a where clause using callback
   *
   * @param callback - Function that receives query builder
   * @returns Query builder for chaining
   *
   * @example
   * query.where(q => q.where("age", ">", 18).orWhere("role", "admin"))
   */
  where(callback: (query: this) => void): this;

  /**
   * Add an OR where clause
   *
   * @param field - Column name
   * @param value - Value to compare
   * @returns Query builder for chaining
   */
  orWhere(field: string, value: any): this;

  /**
   * Add an OR where clause with operator
   *
   * @param field - Column name
   * @param operator - Comparison operator
   * @param value - Value to compare
   * @returns Query builder for chaining
   */
  orWhere(field: string, operator: WhereOperator, value: any): this;

  /**
   * Add an OR where clause from object
   *
   * @param conditions - Object mapping columns to values
   * @returns Query builder for chaining
   */
  orWhere(conditions: Record<string, any>): this;

  /**
   * Add a WHERE IN clause
   *
   * @param field - Column name
   * @param values - Array of values
   * @returns Query builder for chaining
   *
   * @example
   * query.whereIn("id", [1, 2, 3])
   */
  whereIn(field: string, values: any[]): this;

  /**
   * Add a WHERE NOT IN clause
   *
   * @param field - Column name
   * @param values - Array of values
   * @returns Query builder for chaining
   */
  whereNotIn(field: string, values: any[]): this;

  /**
   * Add a WHERE NULL clause
   *
   * @param field - Column name
   * @returns Query builder for chaining
   */
  whereNull(field: string): this;

  /**
   * Add a WHERE NOT NULL clause
   *
   * @param field - Column name
   * @returns Query builder for chaining
   */
  whereNotNull(field: string): this;

  /**
   * Add a WHERE BETWEEN clause
   *
   * @param field - Column name
   * @param range - Tuple of [min, max] values
   * @returns Query builder for chaining
   *
   * @example
   * query.whereBetween("age", [18, 65])
   */
  whereBetween(field: string, range: [any, any]): this;

  /**
   * Add a WHERE LIKE clause
   *
   * @param field - Column name
   * @param pattern - Pattern to match
   * @returns Query builder for chaining
   *
   * @example
   * query.whereLike("email", "%@example.com")
   */
  whereLike(field: string, pattern: string): this;

  /**
   * Pretty print the query
   */
  pretty(): string;

  // ============================================================================
  // SELECT / PROJECTION
  // ============================================================================

  /**
   * Select specific columns
   *
   * @param fields - Array of column names
   * @returns Query builder for chaining
   *
   * @example
   * query.select(["id", "name", "email"])
   */
  select(fields: string[]): this;

  /**
   * Select specific columns (variadic)
   *
   * @param fields - Column names as arguments
   * @returns Query builder for chaining
   *
   * @example
   * query.select("id", "name", "email")
   */
  select(...fields: string[]): this;

  /**
   * Deselect specific columns
   *
   * @param fields - Array of column names to exclude
   * @returns Query builder for chaining
   */
  deselect(fields: string[]): this;

  /**
   * Deselect specific columns (variadic)
   *
   * @param fields - Column names to exclude as arguments
   * @returns Query builder for chaining
   */
  deselect(...fields: string[]): this;

  // ============================================================================
  // ORDERING
  // ============================================================================

  /**
   * Order results by column
   *
   * @param field - Column name
   * @param direction - Sort direction (default: "asc")
   * @returns Query builder for chaining
   *
   * @example
   * query.orderBy("createdAt", "desc")
   */
  orderBy(field: string, direction?: "asc" | "desc"): this;

  /**
   * Order results using object mapping
   *
   * @param orderBy - Object mapping columns to directions
   * @returns Query builder for chaining
   *
   * @example
   * query.sortBy({ createdAt: "desc", name: "asc" })
   */
  sortBy(orderBy: Record<string, "asc" | "desc">): this;

  /**
   * Order results randomly
   *
   * @param limit - Optional limit for random selection
   * @returns Query builder for chaining
   */
  random(limit?: number): this;

  // ============================================================================
  // LIMITING
  // ============================================================================

  /**
   * Limit number of results
   *
   * @param limit - Maximum number of records
   * @returns Query builder for chaining
   */
  limit(limit: number): this;

  /**
   * Skip a number of results
   *
   * @param offset - Number of records to skip
   * @returns Query builder for chaining
   */
  offset(offset: number): this;

  /**
   * Alias for offset
   *
   * @param count - Number of records to skip
   * @returns Query builder for chaining
   */
  skip(count: number): this;

  // ============================================================================
  // FILTERING (Repository-specific)
  // ============================================================================

  /**
   * Apply repository filters to query
   *
   * @param filters - Filter structure definition
   * @param data - Data containing filter values
   * @param options - Filter options (date formats, etc.)
   * @returns Query builder for chaining
   */
  applyFilters(filters: FilterRules<this>, data: any, options: FilterOptions): this;

  // ============================================================================
  // EXECUTION
  // ============================================================================

  /**
   * Execute query and get all results
   *
   * @returns Promise resolving to array of records
   */
  get(): Promise<T[]>;

  /**
   * Execute query and get first result
   *
   * @returns Promise resolving to first record or null
   */
  first(): Promise<T | null>;

  /**
   * Count total matching records
   *
   * @returns Promise resolving to count
   */
  count(): Promise<number>;

  /**
   * Execute query with pagination
   *
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @returns Promise resolving to pagination result
   */
  paginate(page: number, limit: number): Promise<PaginationResult<T>>;

  /**
   * Execute query with cursor-based pagination
   * More efficient for large datasets as it doesn't require counting total records
   *
   * @param options - Cursor pagination options
   * @returns Promise resolving to cursor pagination result
   *
   * @example
   * const result = await query.cursorPaginate({ limit: 10, cursor: lastId });
   */
  cursorPaginate(options: CursorPaginationOptions): Promise<CursorPaginationResult<T>>;

  /**
   * Process results in chunks
   *
   * @param size - Chunk size
   * @param callback - Function called for each chunk
   * @returns Promise that resolves when chunking is complete
   */
  chunk(size: number, callback: ChunkCallback<T>): Promise<void>;

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Eager-load a relation by name
   *
   * @param relation - Name of the relation defined on the model
   * @returns Query builder for chaining
   *
   * @example
   * query.with("ai_model")
   */
  with?(relation: string): this;

  /**
   * Load relations using database JOINs in a single query
   *
   * @param relations - Relation names to load via JOIN
   * @returns Query builder for chaining
   *
   * @example
   * query.joinWith("ai_model", "unit")
   */
  joinWith?(...relations: string[]): this;

  /**
   * Clone the query builder
   *
   * @returns New query builder instance with same state
   */
  clone(): this;

  /**
   * Vector similarity search.
   *
   * Adds a score SELECT and vector ORDER BY (SQL) or $vectorSearch stage (MongoDB Atlas)
   * in one call. Driver implementations handle the specifics.
   *
   * @param column    - Vector column name (e.g. `"embedding"`)
   * @param embedding - Query embedding as a number array
   * @param alias     - Result score field alias (default: `"score"`)
   *
   * @example
   * ```typescript
   * const results = await vectorsRepository
   *   .newQuery()
   *   .where({ organization_id: "org-123" })
   *   .similarTo("embedding", queryEmbedding)
   *   .limit(5)
   *   .get<VectorRow & { score: number }>();
   * ```
   */
  similarTo(column: string, embedding: number[], alias?: string): this;
}

