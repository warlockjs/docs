import type { ChildModel, Model, QueryBuilderContract } from "@warlock.js/cascade";

/**
 * Base options for database query rules
 */
export type BaseQueryRuleOptions = {
  /** The Model to query against */
  Model: ChildModel<Model> | string;
  /** Callback to customize the query */
  query?: (options: {
    query: QueryBuilderContract;
    value: any;
    allValues: any;
  }) => void | Promise<void>;
  /** The column to filter by (defaults to the key) */
  column?: string;
};

/**
 * Base options for unique validation rules
 */
export type BaseUniqueRuleOptions = BaseQueryRuleOptions;

/**
 * Options for unique rule
 */
export type UniqueRuleOptions = BaseUniqueRuleOptions & {
  /** Field to except from uniqueness check */
  except?: string;
  /** Column name for the except field */
  exceptColumnName?: string;
  /** Value for the except field */
  exceptValue?: any;
};

/**
 * Options for unique except current user rule
 */
export type UniqueExceptCurrentUserRuleOptions = BaseUniqueRuleOptions & {
  /** Column for current user filter (default: id) */
  exceptCurrentUserColumn?: string;
  /** Value field from current user model (default: id) */
  exceptCurrentUserValue?: string;
};

/**
 * Options for unique except current id rule
 */
export type UniqueExceptCurrentIdRuleOptions = BaseUniqueRuleOptions & {
  /** Column for current id filter (default: id) */
  exceptCurrentIdColumn?: string;
};

/**
 * Options for exists rule
 */
export type ExistsRuleOptions = BaseQueryRuleOptions;

/**
 * Options for exists except current user rule
 */
export type ExistsExceptCurrentUserRuleOptions = BaseQueryRuleOptions & {
  /** Column for current user filter (default: id) */
  exceptCurrentUserColumn?: string;
  /** Value field from current user model (default: id) */
  exceptCurrentUserValue?: string;
};

/**
 * Options for exists except current id rule
 */
export type ExistsExceptCurrentIdRuleOptions = BaseQueryRuleOptions & {
  /** Column for current id filter (default: id) */
  exceptCurrentIdColumn?: string;
};
