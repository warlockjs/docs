import type { QueryBuilderContract } from "./query-builder.contract";
import type {
  ChunkCallback,
  CursorPaginationOptions,
  CursorPaginationResult,
  PaginationResult,
} from "./types";

/**
 * Repository adapter contract for data source operations
 * This interface abstracts database/ORM operations and can be implemented
 * for any data source (Cascade, Prisma, Drizzle, etc.)
 *
 * @template T - The type of records managed by this adapter
 */
export interface RepositoryAdapterContract<T> {
  // ============================================================================
  // QUERY BUILDING
  // ============================================================================

  /**
   * Create a new query builder instance
   *
   * @returns Query builder for constructing queries
   *
   * @example
   * const query = adapter.query();
   * const users = await query.where("isActive", true).get();
   */
  query(): QueryBuilderContract<T>;

  /**
   * Register events
   *
   * @returns Array of event callbacks
   */
  registerEvents(eventsCallback: any): any[];

  /**
   * Resolve the repository name
   *
   * @returns The repository name
   */
  resolveRepositoryName(): string;

  /**
   * Serialize the given model for caching
   *
   * @param model - The model to serialize
   * @returns The serialized data
   */
  serializeModel(model: T): any;

  /**
   * Deserialize the given data
   *
   * @param data - The data to deserialize
   * @returns The deserialized model
   */
  deserializeModel(data: any): T;

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Find a record by its ID
   *
   * @param id - Record identifier
   * @returns Promise resolving to record or null if not found
   *
   * @example
   * const user = await adapter.find(1);
   */
  find(id: any): Promise<T | null>;

  /**
   * Find a record by column value
   *
   * @param column - Column name
   * @param value - Value to search for
   * @returns Promise resolving to record or null if not found
   *
   * @example
   * const user = await adapter.findBy("email", "user@example.com");
   */
  findBy(column: string, value: any): Promise<T | null>;

  /**
   * Create a new record
   *
   * @param data - Record data
   * @returns Promise resolving to created record
   *
   * @example
   * const user = await adapter.create({ name: "John", email: "john@example.com" });
   */
  create(data: any): Promise<T>;

  /**
   * Update a record by ID
   *
   * @param id - Record identifier
   * @param data - Updated data
   * @returns Promise resolving to updated record
   *
   * @example
   * const user = await adapter.update(1, { name: "Jane" });
   */
  update(id: any, data: any): Promise<T>;

  /**
   * Delete a record by ID
   *
   * @param id - Record identifier
   * @returns Promise that resolves when deletion is complete
   *
   * @example
   * await adapter.delete(1);
   */
  delete(id: any): Promise<void>;

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Update multiple records matching filter
   *
   * @param filter - Filter criteria
   * @param data - Updated data
   * @returns Promise resolving to number of updated records
   *
   * @example
   * const count = await adapter.updateMany({ isActive: false }, { deletedAt: new Date() });
   */
  updateMany(filter: any, data: any): Promise<number>;

  /**
   * Delete multiple records matching filter
   *
   * @param filter - Filter criteria
   * @returns Promise resolving to number of deleted records
   *
   * @example
   * const count = await adapter.deleteMany({ isActive: false });
   */
  deleteMany(filter: any): Promise<number>;

  // ============================================================================
  // COUNTING
  // ============================================================================

  /**
   * Count records matching optional filter
   *
   * @param filter - Optional filter criteria
   * @returns Promise resolving to count
   *
   * @example
   * const total = await adapter.count();
   * const active = await adapter.count({ isActive: true });
   */
  count(filter?: any): Promise<number>;

  // ============================================================================
  // PAGINATION
  // ============================================================================

  /**
   * Get paginated results
   *
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @returns Promise resolving to pagination result
   *
   * @example
   * const result = await adapter.paginate(1, 10);
   * console.log(result.documents); // Array of records
   * console.log(result.pagination); // { page, limit, total, pages, result }
   */
  paginate(page: number, limit: number): Promise<PaginationResult<T>>;

  /**
   * Get cursor-paginated results
   * More efficient for large datasets as it doesn't require counting total records
   *
   * @param options - Cursor pagination options
   * @returns Promise resolving to cursor pagination result
   *
   * @example
   * const result = await adapter.cursorPaginate({ limit: 10, cursor: lastId });
   * console.log(result.documents); // Array of records
   * console.log(result.pagination); // { limit, result, hasMore, nextCursor, prevCursor }
   */
  cursorPaginate(options: CursorPaginationOptions): Promise<CursorPaginationResult<T>>;

  // ============================================================================
  // CHUNKING
  // ============================================================================

  /**
   * Process records in chunks
   *
   * @param size - Chunk size
   * @param callback - Function called for each chunk
   * @returns Promise that resolves when chunking is complete
   *
   * @example
   * await adapter.chunk(100, async (records, info) => {
   *   await processRecords(records);
   *   // Return false to stop chunking
   * });
   */
  chunk(size: number, callback: ChunkCallback<T>): Promise<void>;

  // ============================================================================
  // MODEL CREATION
  // ============================================================================

  /**
   * Create a model instance from data
   * This is used by repositories to instantiate models from cached or raw data
   *
   * @param data - Raw data
   * @returns Model instance
   *
   * @example
   * const user = adapter.createModel({ id: 1, name: "John" });
   */
  createModel(data: any): T;
}
