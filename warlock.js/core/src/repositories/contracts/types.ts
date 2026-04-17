import { CacheDriver } from "@warlock.js/cache";
import { RepositoryManager } from "../repository.manager";
import { QueryBuilderContract } from "./query-builder.contract";
import { RepositoryAdapterContract } from "./repository-adapter.contract";

/**
 * Pagination result structure returned by repository list methods
 */
export type PaginationResult<T> = {
  /**
   * Array of documents/records in the current page
   */
  data: T[];

  /**
   * Pagination metadata
   */
  pagination: {
    /**
     * Number of items per page
     */
    limit: number;

    /**
     * Number of items in current page
     */
    result: number;

    /**
     * Current page number (1-indexed)
     */
    page: number;

    /**
     * Total number of items across all pages
     */
    total: number;

    /**
     * Total number of pages
     */
    pages: number;
  };
};

/**
 * Cursor pagination result structure
 * More efficient for large datasets as it doesn't require counting total records
 */
export type CursorPaginationResult<T> = {
  /**
   * Array of documents/records in the current page
   */
  data: T[];

  /**
   * Cursor pagination metadata
   */
  pagination: {
    /**
     * Number of items per page
     */
    limit: number;

    /**
     * Number of items in current page
     */
    result: number;

    /**
     * Whether there are more results after this page
     */
    hasMore: boolean;

    /**
     * Cursor for the next page (typically the ID of the last item)
     */
    nextCursor?: string | number;

    /**
     * Cursor for the previous page (typically the ID of the first item)
     */
    prevCursor?: string | number;
  };
};

/**
 * Options for cursor-based pagination
 */
export type CursorPaginationOptions = {
  /**
   * Number of items per page
   */
  limit: number;

  /**
   * Cursor to start from (typically an ID)
   */
  cursor?: string | number;

  /**
   * Direction to paginate
   * @default "next"
   */
  direction?: "next" | "prev";

  /**
   * Column to use for cursor (typically "id")
   * @default "id"
   */
  cursorColumn?: string;
};

/**
 * Callback function for chunking operations
 *
 * @param documents - Array of documents in current chunk
 * @param chunkIndex - Index of current chunk (0-based)
 * @returns Promise that resolves to false to stop chunking, or any other value to continue
 */
export type ChunkCallback<T> = (documents: T[], chunkIndex: number) => Promise<false | any>;

/**
 * SQL-style where operators
 */
export type WhereOperator =
  | "="
  | "!="
  | "<>"
  | ">"
  | ">="
  | "<"
  | "<="
  | "like"
  | "not like"
  | "in"
  | "not in"
  | "between"
  | "not between";

/**
 * Repository-specific filter operators
 */
export type FilterOperator =
  | "bool"
  | "boolean"
  | "number"
  | "inNumber"
  | "null"
  | "notNull"
  | "!null"
  | "int"
  | "int>"
  | "int>="
  | "int<"
  | "int<="
  | "in"
  | "!int"
  | "integer"
  | "inInt"
  | "float"
  | "double"
  | "inFloat"
  | "date"
  | "inDate"
  | "date>"
  | "date>="
  | "date<"
  | "date<="
  | "dateBetween"
  | "dateTime"
  | "inDateTime"
  | "dateTime>"
  | "dateTime>="
  | "dateTime<"
  | "dateTime<="
  | "dateTimeBetween"
  | "location"
  | "scope"
  | "with"
  | "joinWith"
  | "similarTo"
  | WhereOperator;

/**
 * Filter function that receives value, query builder, and context
 */
export type FilterFunction<Q = any> = (value: any, query: Q, context: Record<string, any>) => void;

/**
 * Filter rule definition
 * Can be:
 * - A filter operator string
 * - A custom filter function
 * - An array with operator and optional column name(s)
 */
export type FilterRule<Q = any> =
  | FilterOperator
  | FilterFunction<Q>
  | [FilterOperator]
  | [FilterOperator, string | string[]];

/**
 * Filter rules mapping filter keys to their rules
 */
export type FilterRules<Q = any> = {
  [key: string]: FilterRule<Q>;
};

/**
 * Options passed to filter application
 */
export type FilterOptions = {
  /**
   * Date format for date filters
   */
  dateFormat?: string;

  /**
   * DateTime format for datetime filters
   */
  dateTimeFormat?: string;

  /**
   * Additional custom options
   */
  [key: string]: any;
};

/**
 * Pagination mode type
 */
export type PaginationMode = "pages" | "cursor";

/**
 * Repository list options
 */
export type RepositoryOptions = {
  /**
   * Pagination mode - "pages" for traditional pagination, "cursor" for cursor-based
   * @default "pages"
   */
  paginationMode?: PaginationMode;

  /**
   * Whether to paginate results
   * @default true
   */
  paginate?: boolean;

  /**
   * Current page number (1-indexed)
   * @default 1
   */
  page?: number;

  /**
   * Number of items per page
   */
  limit?: number;

  /**
   * Default limit when no limit is specified
   * @default 15
   */
  defaultLimit?: number;

  /**
   * Columns to select
   */
  select?: string[];

  /**
   * Simple select flag
   * If passed, then only data will be fetched is from simpleSelectColumns property
   * If simpleSelectColumns is empty, this option will be ignored
   */
  simpleSelect?: true;

  /**
   * Columns to exclude from selection
   */
  deselect?: string[];

  /**
   * Order by configuration
   * Can be:
   * - "random" for random ordering
   * - [column, direction] tuple
   * - Object mapping columns to directions
   */
  orderBy?:
    | "random"
    | [string, "asc" | "desc"]
    | {
        [key: string]: "asc" | "desc";
      };

  /**
   * Sort by column name
   */
  sortBy?: string;

  /**
   * Sort direction
   */
  sortDirection?: "asc" | "desc";

  /**
   * Cursor value for cursor-based pagination
   * Used when paginationMode = "cursor"
   */
  cursor?: string | number;

  /**
   * Direction for cursor pagination
   * @default "next"
   */
  direction?: "next" | "prev";

  /**
   * Column to use for cursor pagination
   * @default "_id" for MongoDB, "id" for SQL
   */
  cursorColumn?: string;

  /**
   * Whether to purge cache after reading
   */
  purgeCache?: boolean;

  /**
   * Custom query modifications
   */
  perform?: (query: QueryBuilderContract<any>, options: RepositoryOptions) => void;
};

/**
 * Discriminated union type for page-based pagination options
 */
export interface RepositoryOptionsWithPages extends RepositoryOptions {
  paginationMode?: "pages";
}

/**
 * Discriminated union type for cursor-based pagination options
 */
export interface RepositoryOptionsWithCursor extends RepositoryOptions {
  paginationMode: "cursor";
}

/**
 * Options for cached repository operations
 */
export type CachedRepositoryOptions = RepositoryOptions & {
  /**
   * Whether to use cache
   */
  cache?: boolean;

  /**
   * Whether to cache with current locale
   */
  cacheCurrentLocale?: boolean;

  /**
   * Custom cache key
   */
  cacheKey?: string | Record<string, any>;
};

/**
 * Options for all() method (non-paginated listing)
 */
export type AllRepositoryOptions = Omit<RepositoryOptions, "paginate" | "page">;

/**
 * Typed repository options — merges base options with a repo-specific filter
 * shape `F` so callers get full autocomplete on filter keys.
 *
 * @template F - The filter shape defined by the repository (e.g. `{ id?: number; status?: string }`)
 *
 * @example
 * // In a service:
 * repo.list({ organization_id: 1, status: "active" }); // ← autocompleted & type-checked
 */
export type TypedRepositoryOptions<F = Record<string, any>> = RepositoryOptions & Partial<F>;

/**
 * Typed version of AllRepositoryOptions (no paginate/page) with filter shape.
 * @template F - The filter shape defined by the repository
 */
export type TypedAllRepositoryOptions<F = Record<string, any>> = AllRepositoryOptions & Partial<F>;

/**
 * Typed version of RepositoryOptionsWithPages with filter shape.
 * @template F - The filter shape defined by the repository
 */
export type TypedRepositoryOptionsWithPages<F = Record<string, any>> = RepositoryOptionsWithPages &
  Partial<F>;

/**
 * Typed version of RepositoryOptionsWithCursor with filter shape.
 * @template F - The filter shape defined by the repository
 */
export type TypedRepositoryOptionsWithCursor<F = Record<string, any>> =
  RepositoryOptionsWithCursor & Partial<F>;

/**
 * Repository event names
 */
export type RepositoryEvent =
  | "listing"
  | "list"
  | "creating"
  | "create"
  | "updating"
  | "update"
  | "saving"
  | "save"
  | "patching"
  | "patch"
  | "deleting"
  | "delete";

/**
 * Save mode for repository operations
 */
export type SaveMode = "create" | "update" | "patch";

/**
 * Repositroy configurations
 */
export type RepositoryConfigurations = {
  /**
   * Default cache driver
   */
  cacheDriver?: CacheDriver<any, any>;

  /**
   * Default adapter resolver
   */
  adapterResolver?: (repository: RepositoryManager<any>) => RepositoryAdapterContract<any>;

  /**
   * Default repository options
   */
  defaultOptions?: Partial<RepositoryOptions>;

  /**
   * Default active column name
   */
  isActiveColumn?: string;

  /**
   * Default active column value
   */
  isActiveValue?: any;
};
