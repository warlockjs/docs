import { cache, CacheKey, type CacheDriver } from "@warlock.js/cache";
import { config } from "../config";
import { CascadeAdapter } from "./adapters/cascade";
import type {
  AllRepositoryOptions,
  ChunkCallback,
  CursorPaginationResult,
  FilterRules,
  PaginationResult,
  QueryBuilderContract,
  RepositoryAdapterContract,
  RepositoryOptions,
  SaveMode,
  TypedAllRepositoryOptions,
  TypedRepositoryOptions,
  TypedRepositoryOptionsWithCursor,
  TypedRepositoryOptionsWithPages,
} from "./contracts";

/**
 * Base repository manager class
 * Provides ORM-agnostic data access layer with support for listing, filtering,
 * caching, pagination, and CRUD operations
 *
 * @template T - The type of records managed by this repository
 *
 * @example
 * // Extend with source
 * class UserRepository extends RepositoryManager<User> {
 *   protected source = User;
 *   protected filterBy = { email: "=", role: ["in", "role"] };
 * }
 *
 * @example
 * // Direct instantiation with adapter
 * const userRepo = new RepositoryManager<User>(new PrismaAdapter(prisma.user));
 */
export class RepositoryManager<T = unknown, F = Record<string, any>> {
  /**
   * Adapter instance (lazy-loaded)
   * @private
   */
  protected _adapter?: RepositoryAdapterContract<T>;

  /**
   * Data source reference (Model, Prisma client, table name, etc.)
   * Used by createDefaultAdapter to instantiate the appropriate adapter
   * @protected
   */
  protected source?: any;

  // ============================================================================
  // CONFIGURATION PROPERTIES
  // ============================================================================

  /**
   * Filter definitions
   * Maps filter keys to filter rules
   * @protected
   */
  protected filterBy: FilterRules = {};

  /**
   * Get adapter instance (lazy-loaded)
   * Resolution order:
   * 1. Use injected adapter from constructor
   * 2. Use config-based resolver if available
   * 3. Use createDefaultAdapter
   *
   * @returns Adapter instance
   * @protected
   */
  protected get adapter(): RepositoryAdapterContract<T> {
    if (this._adapter) {
      return this._adapter;
    }

    // Try config-based resolver
    const resolver = config.key("repository.adapterResolver");

    if (resolver) {
      this._adapter = resolver(this);
    } else {
      this._adapter = config.get("repository.defaultAdapter") || this.createDefaultAdapter();
    }

    // Adapter is guaranteed to be set at this point
    return this._adapter!;
  }

  /**
   * Default repository options
   * @protected
   */
  protected defaultOptions: Partial<RepositoryOptions> =
    config.get("repository.defaultOptions") || {};

  /**
   * Simple select columns (used with simple filter)
   * @protected
   */
  protected simpleSelectColumns: string[] = [];

  /**
   * Active column name
   * @default "isActive"
   * @protected
   */
  protected isActiveColumn?: string;

  /**
   * Active column value
   * @default true
   * @protected
   */
  protected isActiveValue?: any;

  /**
   * Repository name (for events)
   * @protected
   */
  protected name?: string;

  /**
   * Whether caching is enabled
   * @default true
   * @protected
   */
  protected isCacheable = config.get("repository.isCacheable") ?? true;

  /**
   * Cache driver instance
   * @protected
   */
  protected cacheDriver: CacheDriver<any, any> = config.get("repository.cacheDriver") || cache;

  /**
   * List of all events callbacks
   */
  protected eventsCallbacks: any[] = [];

  /**
   * Constructor
   * @param adapter - Optional adapter instance for direct injection
   */
  public constructor(adapter?: RepositoryAdapterContract<T>) {
    if (adapter) {
      this._adapter = adapter;
    }

    // Wait for constructor to finish and all properties are properly registered
    // specially for adapter to get instanciated
    setTimeout(() => {
      this.registerEvents();
    }, 0);
  }

  /**
   * Register events
   */
  public registerEvents() {
    this.eventsCallbacks.push(
      ...this.adapter.registerEvents((source: any) => {
        // this.clearCache({ id: source.id });
        this.clearCache();
      }),
    );
  }

  /**
   * Unregister events
   */
  public cleanuEvents() {
    this.eventsCallbacks.forEach((callback) => {
      callback();
    });
    this.eventsCallbacks = [];
  }

  /**
   * Create default adapter instance
   * Override this method to provide custom adapter creation logic
   *
   * @returns Adapter instance
   * @throws Error if no source is configured
   * @protected
   */
  protected createDefaultAdapter(): RepositoryAdapterContract<T> {
    if (!this.source) {
      throw new Error(
        "No adapter or source configured. Either pass an adapter to the constructor, " +
          "set the 'source' property, or configure 'repository.adapterResolver' in config.",
      );
    }

    // Default: assume source is a Cascade Model
    if (typeof this.source === "function") {
      // Lazy import to avoid circular dependencies
      return new CascadeAdapter(this.source) as unknown as RepositoryAdapterContract<T>;
    }

    throw new Error(
      "Cannot create default adapter for this source type. " +
        "Please provide an adapter or configure repository.adapterResolver.",
    );
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get repository name
   * @returns Repository name
   * @public
   */
  public getName(): string {
    if (this.name) {
      return this.name;
    }

    // Try to get collection name from source
    this.name = this.adapter.resolveRepositoryName() || "unknown";

    return this.name;
  }

  /**
   * Get is active column
   */
  protected getIsActiveColumn(): string {
    return this.isActiveColumn || config.key("repository.isActiveColumn") || "isActive";
  }

  /**
   * Get is active value
   */
  protected getIsActiveValue(): any {
    return this.isActiveValue ?? config.key("repository.isActiveValue") ?? true;
  }

  /**
   * Create new query builder instance
   * @returns Query builder
   * @public
   */
  public newQuery() {
    return this.adapter.query();
  }

  /**
   * Create new model instance
   * @param data - Model data
   * @returns Model instance
   * @public
   */
  public newModel(data?: any): T {
    return this.adapter.createModel(data);
  }

  /**
   * Get active filter object
   * @returns Filter object for active records
   * @protected
   */
  protected getIsActiveFilter() {
    return {
      [this.getIsActiveColumn()]: this.getIsActiveValue(),
    };
  }

  // ============================================================================
  // FINDING METHODS
  // ============================================================================

  /**
   * Find a record by ID
   * @param id - Record ID or model instance
   * @returns Promise resolving to record or null
   * @public
   */
  public async find(id: string | number | T): Promise<T | null> {
    return this.adapter.find(id);
  }

  /**
   * Find a record by column value
   * @param column - Column name
   * @param value - Value to search for
   * @returns Promise resolving to record or null
   * @public
   */
  public async findBy(column: string, value: any): Promise<T | null> {
    return this.adapter.findBy(column, value);
  }

  /**
   * Find active record by ID
   * @param id - Record ID or model instance
   * @returns Promise resolving to active record or null
   * @public
   */
  public async findActive(id: string | number | T): Promise<T | null> {
    return this.newQuery()
      .where({
        id,
        ...this.getIsActiveFilter(),
      })
      .first();
  }

  /**
   * Find active record by column value
   * @param column - Column name
   * @param value - Value to search for
   * @returns Promise resolving to active record or null
   * @public
   */
  public async findByActive(column: string, value: any): Promise<T | null> {
    return this.newQuery()
      .where({
        [column]: value,
        ...this.getIsActiveFilter(),
      })
      .first();
  }

  /**
   * Get first record matching options
   * @param options - Repository options
   * @returns Promise resolving to first record or null
   * @public
   */
  public async first(options?: TypedRepositoryOptions<F>): Promise<T | null> {
    const query = this.newQuery();
    const opts = this.prepareOptions(options);

    this.applyOptionsToQuery(query, opts);

    return query.limit(1).first();
  }

  /**
   * Get id by the given filter
   */
  public async firstId(options?: TypedRepositoryOptions<F>): Promise<string | number | undefined> {
    const record = await this.first(options);
    return (record as any)?.id;
  }

  /**
   * Get first active id
   */
  public async firstActiveId(
    options?: TypedRepositoryOptions<F>,
  ): Promise<string | number | undefined> {
    const record = await this.firstActive(options);
    return (record as any)?.id;
  }

  /**
   * Get first cached id
   */
  public async firstCachedId(
    options?: TypedRepositoryOptions<F>,
  ): Promise<string | number | undefined> {
    const record = await this.firstCached(options);
    return (record as any)?.id;
  }

  /**
   * Get first active cached id
   */
  public async firstActiveCachedId(
    options?: TypedRepositoryOptions<F>,
  ): Promise<string | number | undefined> {
    const record = await this.firstActiveCached(options);
    return (record as any)?.id;
  }

  /**
   * Get first uuid
   */
  public async firstUuid(options?: TypedRepositoryOptions<F>): Promise<string | undefined> {
    const record = await this.first(options);
    return (record as any)?.uuid;
  }

  /**
   * Get first active uuid
   */
  public async firstActiveUuid(options?: TypedRepositoryOptions<F>): Promise<string | undefined> {
    const record = await this.firstActive(options);
    return (record as any)?.uuid;
  }

  /**
   * Get first cached uuid
   */
  public async firstCachedUuid(options?: TypedRepositoryOptions<F>): Promise<string | undefined> {
    const record = await this.firstCached(options);
    return (record as any)?.uuid;
  }

  /**
   * Get first active cached uuid
   */
  public async firstActiveCachedUuid(
    options?: TypedRepositoryOptions<F>,
  ): Promise<string | undefined> {
    const record = await this.firstActiveCached(options);
    return (record as any)?.uuid;
  }

  /**
   * Get first cached record
   */
  public async firstCached(options?: TypedRepositoryOptions<F>): Promise<T | null> {
    const results = await this.allCached({
      ...options,
      limit: 1,
    } as TypedAllRepositoryOptions<F>);

    return results[0] || null;
  }

  /**
   * Get first active record
   * @param options - Repository options
   * @returns Promise resolving to first active record or null
   * @public
   */
  public async firstActive(options?: TypedRepositoryOptions<F>): Promise<T | null> {
    return this.first({
      ...this.getIsActiveFilter(),
      ...options,
    } as TypedRepositoryOptions<F>);
  }

  /**
   * Get first active cached record
   * @param options - Repository options
   * @returns Promise resolving to first active cached record or null
   * @public
   */
  public async firstActiveCached(options?: TypedRepositoryOptions<F>): Promise<T | null> {
    return this.firstCached({
      ...this.getIsActiveFilter(),
      ...options,
    } as TypedRepositoryOptions<F>);
  }

  /**
   * Get last record matching options
   * @param options - Repository options
   * @returns Promise resolving to last record or null
   * @public
   */
  public async last(options?: TypedRepositoryOptions<F>): Promise<T | null> {
    return this.first({
      orderBy: {
        id: "desc",
      },
      ...options,
    } as TypedRepositoryOptions<F>);
  }

  /**
   * Get last cached record
   */
  public async lastCached(options?: TypedRepositoryOptions<F>): Promise<T | null> {
    const results = await this.allCached(
      this.asTypedAll({
        ...options,
        limit: 1,
        orderBy: { id: "desc" },
      }),
    );

    return results[0] || null;
  }

  /**
   * Get last active record
   * @param options - Repository options
   * @returns Promise resolving to last active record or null
   * @public
   */
  public async lastActive(options?: TypedRepositoryOptions<F>): Promise<T | null> {
    return this.last({
      ...this.getIsActiveFilter(),
      ...options,
    } as TypedRepositoryOptions<F>);
  }

  /**
   * Get last active cached record
   * @param options - Repository options
   * @returns Promise resolving to last active cached record or null
   * @public
   */
  public async lastActiveCached(options?: TypedRepositoryOptions<F>): Promise<T | null> {
    return this.lastCached({
      ...this.getIsActiveFilter(),
      ...options,
    } as TypedRepositoryOptions<F>);
  }

  // ============================================================================
  // LISTING METHODS
  // ============================================================================

  /**
   * List records with pagination
   * Supports both traditional page-based and cursor-based pagination
   *
   * @param options - Repository options
   * @returns Promise resolving to pagination result
   *
   * @example
   * // Traditional pagination (default)
   * const result = await repo.list({ page: 2, limit: 10 });
   *
   * @example
   * // Cursor pagination
   * const result = await repo.list({
   *   paginationMode: "cursor",
   *   limit: 20,
   *   cursor: lastId,
   *   direction: "next"
   * });
   *
   * @public
   */
  public async list(options?: TypedRepositoryOptionsWithPages<F>): Promise<PaginationResult<T>>;
  public async list(
    options: TypedRepositoryOptionsWithCursor<F>,
  ): Promise<CursorPaginationResult<T>>;
  public async list(
    options?: TypedRepositoryOptions<F>,
  ): Promise<PaginationResult<T> | CursorPaginationResult<T>> {
    return this._listImpl(options);
  }

  /**
   * Internal list implementation - no overloads, handles union type
   * @param options - Repository options
   * @returns Promise resolving to pagination result
   * @private
   */
  private async _listImpl(
    options?: RepositoryOptions,
  ): Promise<PaginationResult<T> | CursorPaginationResult<T>> {
    const query = this.newQuery();
    const opts = this.prepareOptions(options as TypedRepositoryOptions<F>);
    const paginationMode = opts.paginationMode || "pages";

    // applyOptionsToQuery handles cursor phase 1 (WHERE + ORDER BY) internally
    // when paginationMode === "cursor", ensuring the cursor column is always
    // the primary sort key before any other options are applied.
    this.applyOptionsToQuery(query, opts);

    if (paginationMode === "cursor") {
      return query.cursorPaginate({
        limit: opts.limit || opts.defaultLimit || 15,
        cursor: opts.cursor,
        direction: opts.direction,
        cursorColumn: opts.cursorColumn,
      });
    }

    // Traditional page-based pagination (default)
    const page = opts.page || 1;
    const limit = opts.limit || opts.defaultLimit || 15;

    return query.paginate(page, limit);
  }

  /**
   * List all records without pagination
   * @param options - Repository options
   * @returns Promise resolving to array of records
   * @public
   */
  public async all(options?: TypedAllRepositoryOptions<F>): Promise<T[]> {
    const query = this.newQuery();

    // Apply options
    const opts = this.prepareOptions(options);
    this.applyOptionsToQuery(query, opts);

    return query.get();
  }

  /**
   * List active records with pagination
   * Supports both page-based and cursor-based pagination
   *
   * @param options - Repository options
   * @returns Promise resolving to pagination result
   * @public
   */
  public async listActive(
    options?: TypedRepositoryOptionsWithPages<F>,
  ): Promise<PaginationResult<T>>;
  public async listActive(
    options: TypedRepositoryOptionsWithCursor<F>,
  ): Promise<CursorPaginationResult<T>>;
  public async listActive(
    options?: TypedRepositoryOptions<F>,
  ): Promise<PaginationResult<T> | CursorPaginationResult<T>> {
    return this._listImpl({
      ...this.getIsActiveFilter(),
      ...options,
    });
  }

  /**
   * List all active records without pagination
   * @param options - Repository options
   * @returns Promise resolving to array of active records
   * @public
   */
  public async allActive(options?: TypedAllRepositoryOptions<F>): Promise<T[]> {
    return this.all(this.asTypedAll({ ...this.getIsActiveFilter(), ...options }));
  }

  // ============================================================================
  // EXISTENCE CHECKS
  // ============================================================================

  /**
   * Check if record exists matching filter
   * @param filter - Repository options
   * @returns Promise resolving to true if exists
   * @public
   */
  public async exists(filter?: TypedRepositoryOptions<F>): Promise<boolean> {
    return !!(await this.first(filter));
  }

  /**
   * Check if active record exists matching filter
   * @param filter - Repository options
   * @returns Promise resolving to true if active record exists
   * @public
   */
  public async existsActive(filter?: TypedRepositoryOptions<F>): Promise<boolean> {
    return !!(await this.firstActive(filter));
  }

  /**
   * Check if record exists by ID
   * @param id - Record ID
   * @returns Promise resolving to true if exists
   * @public
   */
  public async idExists(id: number | string): Promise<boolean> {
    return !!(await this.find(id));
  }

  /**
   * Check if active record exists by ID
   * @param id - Record ID
   * @returns Promise resolving to true if active record exists
   * @public
   */
  public async idExistsActive(id: number | string): Promise<boolean> {
    return !!(await this.findActive(id));
  }

  /**
   * Prepare options — merges defaultOptions with caller options.
   * Returning as TypedRepositoryOptions<F> ensures internal composition
   * (spread + forward) satisfies the typed public API without per-call casts.
   */
  protected prepareOptions(options?: TypedRepositoryOptions<F>): TypedRepositoryOptions<F> {
    return { ...(this.defaultOptions || {}), ...(options || {}) } as TypedRepositoryOptions<F>;
  }

  /**
   * Cast a plain `RepositoryOptions` spread to the typed variant.
   * Used internally when composing options across method calls where the
   * spread breaks the F-generic inference chain.
   */
  protected asTyped(opts: RepositoryOptions): TypedRepositoryOptions<F> {
    return opts as TypedRepositoryOptions<F>;
  }

  protected asTypedAll(opts: AllRepositoryOptions): TypedAllRepositoryOptions<F> {
    return opts as TypedAllRepositoryOptions<F>;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Apply repository options to query
   * @param query - Query builder instance
   * @param options - Repository options
   * @protected
   */
  protected applyOptionsToQuery(
    query: QueryBuilderContract<T>,
    options: RepositoryOptions,
  ): RepositoryOptions {
    // ── Cursor phase 1: WHERE + ORDER BY ──────────────────────────────────────
    // Must run first so the cursor column is always the PRIMARY sort key.
    // Any orderBy appended below becomes a harmless secondary sort key.
    if (options.paginationMode === "cursor") {
      const cursorColumn = options.cursorColumn ?? "id";
      const direction = options.direction ?? "next";

      if (options.cursor) {
        query.where(cursorColumn, direction === "next" ? ">" : "<", options.cursor);
      }

      query.orderBy(cursorColumn, direction === "next" ? "asc" : "desc");

      // Warn and strip orderBy that targets the same column as the cursor —
      // it would produce a duplicate / conflicting sort clause.
      if (options.orderBy) {
        const conflictingKeys = Array.isArray(options.orderBy)
          ? [options.orderBy[0]]
          : typeof options.orderBy === "object"
            ? Object.keys(options.orderBy)
            : [];

        if (conflictingKeys.includes(cursorColumn)) {
          console.warn(
            `[Repository] orderBy on "${cursorColumn}" conflicts with cursorColumn and will be ignored. ` +
              `Cursor pagination owns the sort order for its cursor column.`,
          );
          options = { ...options, orderBy: undefined };
        }
      }
    }

    // Apply filters
    if (this.filterBy && Object.keys(this.filterBy).length > 0) {
      query.applyFilters(this.filterBy, options, {
        dateFormat: "DD-MM-YYYY",
        dateTimeFormat: "DD-MM-YYYY HH:mm:ss",
      });
    }

    // Apply select
    if (options.select) {
      query.select(options.select);
    }

    // Apply deselect
    if (options.deselect) {
      query.deselect(options.deselect);
    }

    if (options.simpleSelect && this.simpleSelectColumns.length > 0) {
      query.select(this.simpleSelectColumns);
    }

    // Apply ordering
    if (options.orderBy) {
      if (options.orderBy === "random") {
        query.random();
      } else if (Array.isArray(options.orderBy)) {
        query.orderBy(options.orderBy[0], options.orderBy[1]);
      } else if (typeof options.orderBy === "object") {
        query.sortBy(options.orderBy);
      }
    }

    // Apply limit (for non-paginated queries)
    if (options.limit && options.paginate === false) {
      query.limit(options.limit);
    }

    // Apply custom perform function
    if (options?.perform) {
      options.perform(query, options);
    }

    return options;
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new record
   * @param data - Record data
   * @returns Promise resolving to created record
   * @public
   */
  public async create(data: any): Promise<T> {
    return this.adapter.create(data);
  }

  /**
   * Update a record by ID
   * @param id - Record ID
   * @param data - Updated data
   * @returns Promise resolving to updated record
   * @public
   */
  public async update(id: string | number | any, data: any): Promise<T> {
    return this.adapter.update(id, data);
  }

  /**
   * Delete a record by ID
   * @param id - Record ID
   * @returns Promise that resolves when deletion is complete
   * @public
   */
  public async delete(id: string | number): Promise<void> {
    return this.adapter.delete(id);
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Update multiple records matching filter
   * @param filter - Filter criteria
   * @param data - Updated data
   * @returns Promise resolving to number of updated records
   * @public
   */
  public async updateMany(filter: any, data: any): Promise<number> {
    return this.adapter.updateMany(filter, data);
  }

  /**
   * Delete multiple records matching filter
   * @param filter - Filter criteria
   * @returns Promise resolving to number of deleted records
   * @public
   */
  public async deleteMany(filter: any): Promise<number> {
    return this.adapter.deleteMany(filter);
  }

  // ============================================================================
  // CHUNKING
  // ============================================================================

  /**
   * Process records in chunks
   * @param size - Chunk size
   * @param callback - Function called for each chunk
   * @param options - Repository options
   * @returns Promise that resolves when chunking is complete
   * @public
   */
  public async chunk(
    size: number,
    callback: ChunkCallback<T>,
    options?: TypedRepositoryOptions<F>,
  ): Promise<void> {
    const query = this.newQuery();
    const opts = this.prepareOptions(options);

    this.applyOptionsToQuery(query, opts);

    return query.chunk(size, callback);
  }

  /**
   * Process active records in chunks
   * @param size - Chunk size
   * @param callback - Function called for each chunk
   * @param options - Repository options
   * @returns Promise that resolves when chunking is complete
   * @public
   */
  public async chunkActive(
    size: number,
    callback: ChunkCallback<T>,
    options?: TypedRepositoryOptions<F>,
  ): Promise<void> {
    return this.chunk(size, callback, this.asTyped({ ...this.getIsActiveFilter(), ...options }));
  }

  // ============================================================================
  // CONVENIENCE METHODS
  // ============================================================================

  /**
   * Get latest records (ordered by ID descending)
   * Supports both pagination modes
   *
   * @param options - Repository options
   * @returns Promise resolving to pagination result
   * @public
   */
  public async latest(options?: TypedRepositoryOptionsWithPages<F>): Promise<PaginationResult<T>>;
  public async latest(
    options: TypedRepositoryOptionsWithCursor<F>,
  ): Promise<CursorPaginationResult<T>>;
  public async latest(
    options?: TypedRepositoryOptions<F>,
  ): Promise<PaginationResult<T> | CursorPaginationResult<T>> {
    return this._listImpl({
      orderBy: ["id", "desc"],
      ...options,
    });
  }

  /**
   * Get oldest records (ordered by ID ascending)
   * Supports both pagination modes
   *
   * @param options - Repository options
   * @returns Promise resolving to pagination result
   * @public
   */
  public async oldest(options?: TypedRepositoryOptionsWithPages<F>): Promise<PaginationResult<T>>;
  public async oldest(
    options: TypedRepositoryOptionsWithCursor<F>,
  ): Promise<CursorPaginationResult<T>>;
  public async oldest(
    options?: TypedRepositoryOptions<F>,
  ): Promise<PaginationResult<T> | CursorPaginationResult<T>> {
    return this._listImpl({
      orderBy: ["id", "asc"],
      ...options,
    });
  }

  /**
   * Get latest active records
   * Supports both pagination modes
   *
   * @param options - Repository options
   * @returns Promise resolving to pagination result
   * @public
   */
  public async latestActive(
    options?: TypedRepositoryOptionsWithPages<F>,
  ): Promise<PaginationResult<T>>;
  public async latestActive(
    options: TypedRepositoryOptionsWithCursor<F>,
  ): Promise<CursorPaginationResult<T>>;
  public async latestActive(
    options?: TypedRepositoryOptions<F>,
  ): Promise<PaginationResult<T> | CursorPaginationResult<T>> {
    return this._listImpl({
      orderBy: ["id", "desc"],
      ...this.getIsActiveFilter(),
      ...options,
    });
  }

  /**
   * Get oldest active records
   * Supports both pagination modes
   *
   * @param options - Repository options
   * @returns Promise resolving to pagination result
   * @public
   */
  public async oldestActive(
    options?: TypedRepositoryOptionsWithPages<F>,
  ): Promise<PaginationResult<T>>;
  public async oldestActive(
    options: TypedRepositoryOptionsWithCursor<F>,
  ): Promise<CursorPaginationResult<T>>;
  public async oldestActive(
    options?: TypedRepositoryOptions<F>,
  ): Promise<PaginationResult<T> | CursorPaginationResult<T>> {
    return this._listImpl({
      orderBy: ["id", "asc"],
      ...this.getIsActiveFilter(),
      ...options,
    });
  }

  // ============================================================================
  // LIFECYCLE HOOKS (Override these in child classes)
  // ============================================================================

  /**
   * Called before listing records
   * @param options - Repository options
   * @protected
   */
  protected async beforeListing(options: any): Promise<void> {
    // Override in child class
  }

  /**
   * Called after listing records
   * @param result - Pagination result
   * @param options - Repository options
   * @protected
   */
  protected async onList(result: PaginationResult<T>, options: any): Promise<void> {
    // Override in child class
  }

  /**
   * Called before creating a record
   * @param data - Record data
   * @protected
   */
  protected async onCreating(data: any): Promise<void> {
    // Override in child class
  }

  /**
   * Called after creating a record
   * @param record - Created record
   * @param data - Original data
   * @protected
   */
  protected async onCreate(record: T, data: any): Promise<void> {
    // Override in child class
  }

  /**
   * Called before updating a record
   * @param id - Record ID
   * @param data - Updated data
   * @protected
   */
  protected async onUpdating(id: string | number, data: any): Promise<void> {
    // Override in child class
  }

  /**
   * Called after updating a record
   * @param record - Updated record
   * @param data - Original data
   * @protected
   */
  protected async onUpdate(record: T, data: any): Promise<void> {
    // Override in child class
  }

  /**
   * Called before saving a record (create or update)
   * @param data - Record data
   * @param mode - Save mode
   * @protected
   */
  protected async onSaving(data: any, mode: SaveMode): Promise<void> {
    // Override in child class
  }

  /**
   * Called after saving a record (create or update)
   * @param record - Saved record
   * @param data - Original data
   * @param mode - Save mode
   * @protected
   */
  protected async onSave(record: T, data: any, mode: SaveMode): Promise<void> {
    // Override in child class
  }

  /**
   * Called before deleting a record
   * @param id - Record ID
   * @protected
   */
  protected async onDeleting(id: string | number): Promise<void> {
    // Override in child class
  }

  /**
   * Called after deleting a record
   * @param id - Record ID
   * @protected
   */
  protected async onDelete(id: string | number): Promise<void> {
    // Override in child class
  }

  // ============================================================================
  // COUNT METHODS
  // ============================================================================

  /**
   * Count total records matching options
   * @param options - Repository options
   * @returns Promise resolving to count
   * @public
   */
  public async count(options?: TypedRepositoryOptions<F>): Promise<number> {
    const query = this.newQuery();
    const opts = this.prepareOptions(options);

    this.applyOptionsToQuery(query, opts);

    return await query.count();
  }

  /**
   * Count total active records
   * @param options - Repository options
   * @returns Promise resolving to count of active records
   * @public
   */
  public async countActive(options?: TypedRepositoryOptions<F>): Promise<number> {
    return await this.count(this.asTyped({ ...this.getIsActiveFilter(), ...options }));
  }

  /**
   * Count records with caching
   * @param options - Repository options
   * @returns Promise resolving to cached count
   * @public
   */
  public async countCached(options?: TypedRepositoryOptions<F>): Promise<number> {
    if (!this.isCacheable || !this.cacheDriver) {
      return await this.count(options);
    }

    const opts = this.prepareOptions(options);

    const cacheKey = this.cacheKey("count", opts);
    let count = await this.cacheDriver.get(cacheKey);

    if (count !== undefined) return count;

    count = await this.count(options);
    await this.cache(cacheKey, count);
    return count;
  }

  /**
   * Count active records with caching
   * @param options - Repository options
   * @returns Promise resolving to cached count of active records
   * @public
   */
  public async countActiveCached(options?: TypedRepositoryOptions<F>): Promise<number> {
    return await this.countCached(this.asTyped({ ...this.getIsActiveFilter(), ...options }));
  }

  // ============================================================================
  // CACHING METHODS
  // ============================================================================

  /**
   * Set cache driver
   * @param driver - Cache driver instance
   * @returns This repository for chaining
   * @public
   */
  public setCacheDriver(driver: any): this {
    this.cacheDriver = driver;
    return this;
  }

  /**
   * Get cache driver
   * @returns Cache driver instance
   * @public
   */
  public getCacheDriver(): any {
    return this.cacheDriver;
  }

  /**
   * Generate cache key
   * @param key - Base key or object
   * @param moreOptions - Additional options for key
   * @returns Generated cache key
   * @protected
   */
  protected cacheKey(key: string | Record<string, any>, moreOptions?: Record<string, any>): string {
    let cacheKey = `repositories.${this.getName()}`;

    if (key) {
      cacheKey += "." + (typeof key === "string" ? key : JSON.stringify(key));
    }

    if (moreOptions) {
      cacheKey += "." + JSON.stringify(moreOptions);
    }

    return cacheKey;
  }

  /**
   * Cache a value
   * @param key - Cache key
   * @param value - Value to cache
   * @protected
   */
  protected async cache(key: string, value: any): Promise<void> {
    if (!this.isCacheable || !this.cacheDriver) return;
    await this.cacheDriver.set(key, value);
  }

  /**
   * Get cached record by ID
   * @param id - Record ID
   * @returns Promise resolving to cached record or null
   * @public
   */
  public async getCached(id: string | number): Promise<T | null> {
    return await this.getCachedBy("id", id);
  }

  /**
   * @alias getCached
   */
  public async findCached(id: string | number): Promise<T | null> {
    return await this.getCachedBy("id", id);
  }

  /**
   * Get cached record by column value
   * @param column - Column name
   * @param value - Column value
   * @param cacheKeyOptions - Additional cache key options
   * @returns Promise resolving to cached record or undefined
   * @public
   */
  public async getCachedBy(
    column: string,
    value: any,
    cacheKeyOptions?: Record<string, any>,
  ): Promise<T | null> {
    if (!this.isCacheable || !this.cacheDriver) {
      return await this.findBy(column, value);
    }

    const cacheKey = this.cacheKey(`${column}.${value}`, cacheKeyOptions);
    const cachedData = await this.cacheDriver.get(cacheKey);

    if (cachedData) {
      return this.adapter.deserializeModel(cachedData);
    }

    const model = await this.findBy(column, value);

    if (!model) return null;

    this.cache(cacheKey, this.adapter.serializeModel(model));
    return model;
  }

  /**
   * Get all cached records
   * @param options - Repository options
   * @returns Promise resolving to array of cached records
   * @public
   */
  public async allCached(options?: TypedAllRepositoryOptions<F>): Promise<T[]> {
    if (!this.isCacheable || !this.cacheDriver) {
      return await this.all(options);
    }

    const opts = this.prepareOptions(options);

    const cacheKey = this.cacheKey("all", opts);
    const cachedData = await this.cacheDriver.get<T[]>(cacheKey);

    if (cachedData) {
      return cachedData.map((record) => this.adapter.deserializeModel(record));
    }

    const records = await this.all(options);
    await this.cache(
      cacheKey,
      records.map((record) => this.adapter.serializeModel(record)),
    );
    return records;
  }

  /**
   * Get all active cached records
   * @param options - Repository options
   * @returns Promise resolving to array of cached active records
   * @public
   */
  public async allActiveCached(options?: TypedAllRepositoryOptions<F>): Promise<T[]> {
    return await this.allCached(this.asTypedAll({ ...this.getIsActiveFilter(), ...options }));
  }

  /**
   * List cached records with pagination
   * @param options - Repository options
   * @returns Promise resolving to cached pagination result
   * @public
   */
  public async listCached(options?: TypedRepositoryOptions<F>): Promise<PaginationResult<T>> {
    if (!this.isCacheable || !this.cacheDriver) {
      return (await this._listImpl(options)) as PaginationResult<T>;
    }

    const opts = this.prepareOptions(options);

    const cacheKey = this.cacheKey("list", opts);
    const cachedData = await this.cacheDriver.get(cacheKey);

    if (cachedData) {
      return {
        data: (cachedData?.data || []).map((record: T) => this.adapter.deserializeModel(record)),
        pagination: cachedData.pagination,
      };
    }

    const result = (await this._listImpl(options)) as PaginationResult<T>;

    await this.cache(cacheKey, {
      data: result.data.map((record) => this.adapter.serializeModel(record)),
      pagination: result.pagination,
    });
    return result;
  }

  /**
   * List active cached records with pagination
   * @param options - Repository options
   * @returns Promise resolving to cached pagination result of active records
   * @public
   */
  public async listActiveCached(options?: TypedRepositoryOptions<F>): Promise<PaginationResult<T>> {
    return await this.listCached(this.asTyped({ ...this.getIsActiveFilter(), ...options }));
  }

  /**
   * Get active cached record by ID
   * @param id - Record ID
   * @returns Promise resolving to cached active record or undefined
   * @public
   */
  public async getActiveCached(id: string | number): Promise<T | undefined> {
    const model = await this.getCached(id);
    if (!model) return undefined;

    if (typeof (model as any).get === "function") {
      return (model as any).get(this.getIsActiveColumn()) === this.getIsActiveValue()
        ? model
        : undefined;
    }

    // Check if model is active
    const isActive = (model as any)[this.getIsActiveColumn()] === this.getIsActiveValue();
    return isActive ? model : undefined;
  }

  /**
   * Cache a model
   * @param model - Model to cache
   * @public
   */
  public async cacheModel(model: T): Promise<void> {
    if (!this.isCacheable || !this.cacheDriver) return;

    const id = (model as any).id;
    if (!id) return;

    const cacheKey = this.cacheKey(`id.${id}`);
    await this.cache(cacheKey, this.adapter.serializeModel(model));
  }

  /**
   * Cleanup all events and cache as well
   * Please note this is mostly used with development server to be
   * exported as cleanup
   *
   * @example
   * ```typescript
   */
  public cleanup() {
    this.clearCache();
    this.cleanuEvents();
  }

  /**
   * Cleanup all events and cache as well
   * Please note this is mostly used with development server to be
   * exported as cleanup
   * export const cleanup = usersRepository.cleanup.bind(usersRepository);
   */
  public $cleanup() {
    this.cleanup();
    this.cacheDriver.flush();
  }

  /**
   * Clear all cache for this repository
   * @public
   */
  public async clearCache(key?: CacheKey): Promise<void> {
    if (!this.isCacheable || !this.cacheDriver) return;

    await this.cacheDriver.removeNamespace(this.cacheKey(key || ""));
  }

  /**
   * Clear cache for specific model
   * @param model - Model to clear cache for
   * @public
   */
  public async clearModelCache(model: T): Promise<void> {
    if (!this.isCacheable || !this.cacheDriver) return;

    const id = (model as any).id;
    if (!id) return;

    const cacheKey = this.cacheKey(`id.${id}`);
    await this.cacheDriver.removeNamespace(cacheKey);
  }

  /**
   * Map documents to models
   * @param documents - Array of document data
   * @returns Array of model instances
   * @protected
   */
  protected mapModels(documents: any[]): T[] {
    return documents.map((doc) => this.newModel(doc));
  }

  // ============================================================================
  // CONVENIENCE METHODS
  // ============================================================================

  /**
   * Find or create a record
   * @param where - Conditions to find by
   * @param data - Data to create if not found
   * @returns Promise resolving to found or created record
   * @public
   */
  public async findOrCreate(
    where: TypedRepositoryOptions<F>,
    data: Record<string, any>,
  ): Promise<T> {
    const model = await this.first(where);
    return model || (await this.create(data));
  }

  /**
   * Update or create a record
   * @param where - Conditions to find by
   * @param data - Data to update or create
   * @returns Promise resolving to updated or created record
   * @public
   */
  public async updateOrCreate(
    where: TypedRepositoryOptions<F>,
    data: Record<string, any>,
  ): Promise<T> {
    const model = await this.first(where);
    if (model) {
      return await this.update(model, data);
    }
    return await this.create(data);
  }
}
