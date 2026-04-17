import { type ChildModel, Model } from "@warlock.js/cascade";
import type {
  ChunkCallback,
  CursorPaginationOptions,
  CursorPaginationResult,
  PaginationResult,
  QueryBuilderContract,
  RepositoryAdapterContract,
} from "../../contracts";
import { CascadeQueryBuilder } from "./cascade-query-builder";

/**
 * Cascade adapter for Cascade-Next ORM
 * Implements RepositoryAdapterContract for @warlock.js/cascade
 *
 * @template T - The model instance type
 */
export class CascadeAdapter<T extends Model<any>> implements RepositoryAdapterContract<T> {
  /**
   * Constructor
   * @param model - Cascade-Next Model class
   */
  public constructor(private model: ChildModel<T>) {}

  // ============================================================================
  // QUERY BUILDING
  // ============================================================================

  /**
   * {@inheritDoc RepositoryAdapterContract.query}
   */
  public query(): QueryBuilderContract<T> {
    return new CascadeQueryBuilder<T>(this.model.query());
  }

  /**
   * Register all events
   */
  public registerEvents(eventsCallback: any): any[] {
    const events: any[] = [];

    const modelEvents = this.model.events();

    events.push(
      modelEvents.onCreated((model) => {
        eventsCallback(model);
      }),
      modelEvents.onUpdated((model) => {
        eventsCallback(model);
      }),
      modelEvents.onDeleted((model) => {
        eventsCallback(model);
      }),
    );

    return events;
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * {@inheritDoc RepositoryAdapterContract.find}
   */
  public async find(id: any): Promise<T | null> {
    return await this.model.find(id);
  }

  /**
   * {@inheritDoc RepositoryAdapterContract.findBy}
   */
  public async findBy(column: string, value: any): Promise<T | null> {
    return (await this.query().where(column, value).first()) as T | null;
  }

  /**
   * {@inheritDoc RepositoryAdapterContract.serializeModel}
   */
  public serializeModel(model: T): any {
    return model.toSnapshot();
  }

  /**
   * {@inheritDoc RepositoryAdapterContract.deserializeModel}
   */
  public deserializeModel(data: any): T {
    return this.model.fromSnapshot(data);
  }

  /**
   * {@inheritDoc RepositoryAdapterContract.resolveRepositoryName}
   */
  public resolveRepositoryName(): string {
    return this.model.table;
  }

  /**
   * {@inheritDoc RepositoryAdapterContract.create}
   */
  public async create(data: any): Promise<T> {
    return this.model.create(data);
  }

  /**
   * {@inheritDoc RepositoryAdapterContract.update}
   */
  public async update(id: any, data: any): Promise<T> {
    const model = id instanceof Model ? id : await this.model.find(id);
    if (!model) {
      throw new Error(`Model not found with id ${id}`);
    }

    await model.save({ merge: data });
    return model as T;
  }

  /**
   * {@inheritDoc RepositoryAdapterContract.delete}
   */
  public async delete(id: any): Promise<void> {
    await this.model.delete({ id });
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * {@inheritDoc RepositoryAdapterContract.updateMany}
   */
  public async updateMany(filter: any, data: any): Promise<number> {
    const query = this.query();

    // Apply filter
    if (typeof filter === "object") {
      query.where(filter);
    }

    // Get matching records
    const records = await query.get();

    // Update each record
    for (const record of records) {
      await this.update(record.id, data);
    }

    return records.length;
  }

  /**
   * {@inheritDoc RepositoryAdapterContract.deleteMany}
   */
  public async deleteMany(filter: any): Promise<number> {
    const query = this.query();

    // Apply filter
    if (typeof filter === "object") {
      query.where(filter);
    }

    // Get matching records
    const records = await query.get();

    // Delete each record
    for (const record of records) {
      await record.destroy();
    }

    return records.length;
  }

  // ============================================================================
  // COUNTING
  // ============================================================================

  /**
   * {@inheritDoc RepositoryAdapterContract.count}
   */
  public async count(filter?: any): Promise<number> {
    const query = this.query();

    if (filter && typeof filter === "object") {
      query.where(filter);
    }

    return query.count();
  }

  // ============================================================================
  // PAGINATION
  // ============================================================================

  /**
   * {@inheritDoc RepositoryAdapterContract.paginate}
   */
  public async paginate(page: number, limit: number): Promise<PaginationResult<T>> {
    return this.query().paginate(page, limit);
  }

  /**
   * {@inheritDoc RepositoryAdapterContract.cursorPaginate}
   */
  public async cursorPaginate(
    options: CursorPaginationOptions,
  ): Promise<CursorPaginationResult<T>> {
    return this.query().cursorPaginate(options);
  }

  // ============================================================================
  // CHUNKING
  // ============================================================================

  /**
   * {@inheritDoc RepositoryAdapterContract.chunk}
   */
  public async chunk(size: number, callback: ChunkCallback<T>): Promise<void> {
    return this.query().chunk(size, callback);
  }

  // ============================================================================
  // MODEL CREATION
  // ============================================================================

  /**
   * {@inheritDoc RepositoryAdapterContract.createModel}
   */
  public createModel(data: any): T {
    return new (this.model as any)(data) as T;
  }
}
