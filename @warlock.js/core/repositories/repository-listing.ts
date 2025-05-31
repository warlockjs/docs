import { get } from "@mongez/reinforcements";
import type {
  FilterRule,
  Model,
  ModelAggregate,
  PaginationListing,
} from "@warlock.js/cascade";
import type { RepositoryManager } from "./repository-manager";
import type { RepositoryOptions } from "./types";

export class RepositoryListing<
  T extends Model,
  M extends typeof Model = typeof Model,
> {
  /**
   * Aggregate query
   */
  public query!: ModelAggregate<T>;

  /**
   * Pagination info
   *
   * Returned when the list is paginated
   */
  public paginationInfo?: PaginationListing<T>["paginationInfo"];

  /**
   * List options
   */
  protected options: RepositoryOptions = {};

  /**
   * Documents list from the query
   */
  public documents: T[] = [];

  /**
   * Date time format
   */
  protected dateTimeFormat = "";

  /**
   * Date format
   */
  protected dateFormat = "";

  /**
   * Constructor
   */
  public constructor(
    protected repositoryManager: RepositoryManager<T, M>,
    protected filters: Record<string, FilterRule> = {},
    options?: RepositoryOptions,
  ) {
    this.prepareOptions(options);
  }

  /**
   * Set date time format
   */
  public setDateTimeFormat(format: string) {
    this.dateTimeFormat = format;

    return this;
  }

  /**
   * Set date format
   */
  public setDateFormat(format: string) {
    this.dateFormat = format;

    return this;
  }

  /**
   * Prepare the query
   */
  public async prepareQuery() {
    this.query = this.repositoryManager.newQuery();

    await this.repositoryManager.beforeListing(this.query, this.options);

    await this.parseFilterBy();

    await this.repositoryManager.filter(this.query, this.options);

    if (this.options.select) {
      this.query.select(this.options.select);
    }

    if (this.options.deselect) {
      this.query.deselect(this.options.deselect);
    }

    if (this.options.perform) {
      this.options.perform(this.query, this.options);
    }

    return this.query;
  }

  /**
   * Parse filter by
   */
  protected async parseFilterBy() {
    this.query.applyFilters(this.filters, this.options, {
      dateFormat: this.dateFormat,
      dateTimeFormat: this.dateTimeFormat,
    });
  }

  /**
   * perform listing
   */
  public async list() {
    await this.prepareQuery();

    let orderByOptions = this.repositoryManager.orderBy?.(this.options);

    if (!orderByOptions) {
      if (this.options.sortBy && this.options.sortDirection) {
        orderByOptions = {
          [this.options.sortBy]: this.options.sortDirection,
        };
      } else if (this.options.orderBy) {
        orderByOptions = this.options.orderBy;
      }
    }

    this.parseOrderBy(orderByOptions);

    let records: T[] = [];

    const paginate = this.options.paginate;

    const limit = Number(this.options.limit);

    if (paginate) {
      const { documents, paginationInfo } = await this.query.paginate(
        Number(this.options.page || 1),
        Number(limit || this.options.defaultLimit),
      );

      records = documents;

      this.paginationInfo = paginationInfo;
    } else {
      if (limit) {
        this.query.limit(limit);
      }

      records = await this.query.get();
    }

    this.documents = await this.repositoryManager.onList(records);
  }

  /**
   * Chunk the documents by the given callback
   */
  public async chunk(
    callback: (
      documents: T[],
      paginationInfo: PaginationListing<T>["paginationInfo"],
    ) => Promise<false | any>,
  ) {
    await this.prepareQuery();

    return this.query.chunk(Number(this.option("limit", 15)), callback);
  }

  /**
   * Count records only
   */
  public async count() {
    this.query = this.repositoryManager.newQuery();

    await this.repositoryManager.beforeListing(this.query, this.options);

    await this.parseFilterBy();

    await this.repositoryManager.filter(this.query, this.options);

    if (this.options.select) {
      this.query.select(this.options.select);
    }

    if (this.options.deselect) {
      this.query.deselect(this.options.deselect);
    }

    if (this.options.perform) {
      this.options.perform(this.query, this.options);
    }

    // NO need to order by when counting

    return await this.query.count();
  }

  /**
   * Check if the list method Has pagination
   */
  public hasPagination() {
    return Boolean(this.paginationInfo);
  }

  /**
   * Get option's value for the given key
   */
  protected option(key: string, defaultValue?: any) {
    return get(this.options, key, defaultValue);
  }

  /**
   * Make order by
   */
  protected parseOrderBy(orderByOptions: any) {
    if (!orderByOptions) return;

    const orderBy = orderByOptions;

    if (Array.isArray(orderBy)) {
      const [column, direction] = orderBy;

      return this.query.orderBy(column, direction);
    }

    if (orderBy === "random") {
      return this.query.random(
        Number(this.options.limit || this.options.defaultLimit),
      );
    }

    this.query.sortBy(orderBy);
  }

  /**
   * Prepare options
   */
  protected prepareOptions(options: RepositoryOptions = {}) {
    this.paginationInfo = undefined;
    this.options = {
      ...options,
    };
  }
}
