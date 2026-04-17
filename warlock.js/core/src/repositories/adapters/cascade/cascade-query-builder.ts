import type {
  QueryBuilderContract as CascadeQueryBuilderContract,
  Model,
} from "@warlock.js/cascade";
import type {
  ChunkCallback,
  CursorPaginationOptions,
  CursorPaginationResult,
  FilterOptions,
  FilterRules,
  PaginationResult,
  QueryBuilderContract,
  WhereOperator,
} from "../../contracts";
import { FilterApplicator } from "./filter-applicator";

/**
 * Cascade query builder wrapper
 * Wraps Cascade-Next's ModelAggregate to implement QueryBuilderContract
 *
 * @template T - The model instance type
 */
export class CascadeQueryBuilder<T extends Model> implements QueryBuilderContract<T> {
  /**
   * Constructor
   * @param query - Cascade-Next QueryBuilder instance
   */
  public constructor(private query: CascadeQueryBuilderContract<T>) {}

  // ============================================================================
  // WHERE CLAUSES
  // ============================================================================

  /**
   * {@inheritDoc QueryBuilderContract.where}
   */
  public where(field: string, value: any): this;
  public where(field: string, operator: WhereOperator, value: any): this;
  public where(conditions: Record<string, any>): this;
  public where(callback: (query: this) => void): this;
  public where(
    fieldOrConditionsOrCallback: string | Record<string, any> | ((query: this) => void),
    operatorOrValue?: WhereOperator | any,
    value?: any,
  ): this {
    if (typeof fieldOrConditionsOrCallback === "function") {
      // Callback
      fieldOrConditionsOrCallback(this);
    } else if (typeof fieldOrConditionsOrCallback === "object") {
      // Object conditions
      this.query.where(fieldOrConditionsOrCallback);
    } else if (value !== undefined) {
      // Field, operator, value
      this.query.where(fieldOrConditionsOrCallback, operatorOrValue, value);
    } else {
      // Field, value
      this.query.where(fieldOrConditionsOrCallback, operatorOrValue);
    }

    return this;
  }

  /**
   * Pretty display the query in terminal
   */
  public pretty() {
    return this.query.pretty();
  }

  /**
   * {@inheritDoc QueryBuilderContract.orWhere}
   */
  public orWhere(field: string, value: any): this;
  public orWhere(field: string, operator: WhereOperator, value: any): this;
  public orWhere(conditions: Record<string, any>): this;
  public orWhere(
    fieldOrConditions: string | Record<string, any>,
    operatorOrValue?: WhereOperator | any,
    value?: any,
  ): this {
    if (typeof fieldOrConditions === "object") {
      this.query.orWhere(fieldOrConditions);
    } else if (value !== undefined) {
      this.query.orWhere(fieldOrConditions, operatorOrValue, value);
    } else {
      this.query.orWhere(fieldOrConditions, operatorOrValue);
    }

    return this;
  }

  /**
   * {@inheritDoc QueryBuilderContract.whereIn}
   */
  public whereIn(field: string, values: any[]): this {
    this.query.whereIn(field, values);
    return this;
  }

  /**
   * {@inheritDoc QueryBuilderContract.whereNotIn}
   */
  public whereNotIn(field: string, values: any[]): this {
    this.query.whereNotIn(field, values);
    return this;
  }

  /**
   * {@inheritDoc QueryBuilderContract.whereNull}
   */
  public whereNull(field: string): this {
    this.query.whereNull(field);
    return this;
  }

  /**
   * {@inheritDoc QueryBuilderContract.whereNotNull}
   */
  public whereNotNull(field: string): this {
    this.query.whereNotNull(field);
    return this;
  }

  /**
   * {@inheritDoc QueryBuilderContract.whereBetween}
   */
  public whereBetween(field: string, range: [any, any]): this {
    this.query.whereBetween(field, range);
    return this;
  }

  /**
   * {@inheritDoc QueryBuilderContract.whereLike}
   */
  public whereLike(field: string, pattern: string): this {
    this.query.whereLike(field, pattern);
    return this;
  }

  /**
   * {@inheritDoc QueryBuilderContract.similarTo}
   */
  public similarTo(column: string, embedding: number[], alias?: string): this {
    this.query.similarTo(column, embedding, alias);
    return this;
  }

  // ============================================================================
  // SELECT / PROJECTION
  // ============================================================================

  /**
   * {@inheritDoc QueryBuilderContract.select}
   */
  public select(fields: string[]): this;
  public select(...fields: string[]): this;
  public select(...fields: any[]): this {
    if (Array.isArray(fields[0])) {
      this.query.select(fields[0]);
    } else {
      this.query.select(fields);
    }
    return this;
  }

  /**
   * {@inheritDoc QueryBuilderContract.deselect}
   */
  public deselect(fields: string[]): this;
  public deselect(...fields: string[]): this;
  public deselect(...fields: any[]): this {
    if (Array.isArray(fields[0])) {
      this.query.deselect(fields[0]);
    } else {
      this.query.deselect(fields);
    }
    return this;
  }

  // ============================================================================
  // ORDERING
  // ============================================================================

  /**
   * {@inheritDoc QueryBuilderContract.orderBy}
   */
  public orderBy(field: string, direction: "asc" | "desc" = "asc"): this {
    this.query.orderBy(field, direction);
    return this;
  }

  /**
   * {@inheritDoc QueryBuilderContract.sortBy}
   */
  public sortBy(orderBy: Record<string, "asc" | "desc">): this {
    // Apply each order clause individually
    for (const [field, direction] of Object.entries(orderBy)) {
      this.query.orderBy(field, direction);
    }
    return this;
  }

  /**
   * {@inheritDoc QueryBuilderContract.random}
   */
  public random(limit: number): this {
    this.query.orderByRandom(limit);
    return this;
  }

  // ============================================================================
  // LIMITING
  // ============================================================================

  /**
   * {@inheritDoc QueryBuilderContract.limit}
   */
  public limit(limit: number): this {
    this.query.limit(limit);
    return this;
  }

  /**
   * {@inheritDoc QueryBuilderContract.offset}
   */
  public offset(offset: number): this {
    this.query.offset(offset);
    return this;
  }

  /**
   * {@inheritDoc QueryBuilderContract.skip}
   */
  public skip(count: number): this {
    return this.offset(count);
  }

  // ============================================================================
  // FILTERING (Repository-specific)
  // ============================================================================

  /**
   * {@inheritDoc QueryBuilderContract.applyFilters}
   */
  public applyFilters(filters: FilterRules<this>, data: any, options: FilterOptions): this {
    const applicator = new FilterApplicator();
    applicator.apply(this.query as any, filters, data, options);
    return this;
  }

  // ============================================================================
  // EXECUTION
  // ============================================================================

  /**
   * {@inheritDoc QueryBuilderContract.get}
   */
  public async get(): Promise<T[]> {
    return this.query.get();
  }

  /**
   * {@inheritDoc QueryBuilderContract.first}
   */
  public async first(): Promise<T | null> {
    return this.query.first();
  }

  /**
   * {@inheritDoc QueryBuilderContract.count}
   */
  public async count(): Promise<number> {
    return this.query.count();
  }

  /**
   * {@inheritDoc QueryBuilderContract.paginate}
   */
  public async paginate(page: number, limit: number): Promise<PaginationResult<T>> {
    const result = await this.query.paginate({ limit, page });

    // Convert Cascade-Next pagination to repository format
    return {
      data: result.data,
      pagination: {
        ...result.pagination,
        result: result.data.length,
      },
    };
  }

  /**
   * {@inheritDoc QueryBuilderContract.cursorPaginate}
   *
   * NOTE: This method is a pure executor.
   * The caller (e.g. RepositoryManager._listImpl) is responsible for applying
   * the cursor WHERE condition and ORDER BY BEFORE calling this method,
   * so that the cursor column is always the primary sort key.
   */
  public async cursorPaginate(
    options: CursorPaginationOptions,
  ): Promise<CursorPaginationResult<T>> {
    const { limit, cursor, cursorColumn = "id" } = options;

    // Fetch limit + 1 to detect whether more pages exist
    this.limit(limit + 1);

    const results = await this.get();
    const hasMore = results.length > limit;

    // Drop the extra record used for the hasMore check
    const documents = hasMore ? results.slice(0, limit) : results;

    const nextCursor = hasMore ? (documents[documents.length - 1] as any)[cursorColumn] : undefined;

    return {
      data: documents,
      pagination: {
        limit,
        result: documents.length,
        hasMore,
        nextCursor,
        prevCursor: cursor,
      },
    };
  }

  /**
   * {@inheritDoc QueryBuilderContract.chunk}
   */
  public async chunk(size: number, callback: ChunkCallback<T>): Promise<void> {
    return this.query.chunk(size, callback);
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * {@inheritDoc QueryBuilderContract.with}
   */
  public with(relation: string): this {
    this.query.with(relation);
    return this;
  }

  /**
   * {@inheritDoc QueryBuilderContract.joinWith}
   */
  public joinWith(...relations: string[]): this {
    if (this.query.joinWith) {
      this.query.joinWith(...relations);
    } else {
      console.warn(
        "[Repository] joinWith is not supported by the underlying query builder. Falling back to with.",
      );
      for (const relation of relations) {
        this.query.with(relation);
      }
    }
    return this;
  }

  /**
   * {@inheritDoc QueryBuilderContract.clone}
   */
  public clone(): this {
    return new CascadeQueryBuilder(this.query.clone()) as this;
  }
}
