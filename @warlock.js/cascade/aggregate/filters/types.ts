import type { GenericObject } from "@mongez/reinforcements";
import { type Aggregate } from "../aggregate";
import type { WhereOperator } from "../types";
import { type ModelAggregate } from "./../../model";

// Data shapes (types)
type FilterOperator =
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
  | WhereOperator;

type FilterFunction = (
  value: any,
  query: ModelAggregate<any>,
  context: Record<string, any>,
) => void;

type FilterRule =
  | FilterOperator
  | FilterFunction
  | [FilterOperator]
  | [FilterOperator, string | string[]];

type FilterStructure = {
  [key: string]: FilterRule;
};

// Contracts (interfaces)
interface FilterHandler {
  (params: {
    column?: string;
    columns?: string[];
    value: any;
    query: Aggregate;
    options?: FilterOptions;
  }): void;
}

interface FilterHandlers {
  [key: string]: FilterHandler;
}

interface FilterOptions extends GenericObject {
  dateFormat?: string;
  dateTimeFormat?: string;
}

interface ApplyFiltersParams {
  /**
   * The query instance to apply filters to
   */
  query: ModelAggregate<any>;
  /**
   * The filter structure defining how to filter
   */
  filters: FilterStructure;
  /**
   * The data to filter with
   */
  data?: GenericObject;
  /**
   * Additional options that will be passed to filter handlers
   */
  options?: FilterOptions;
}

export type {
  ApplyFiltersParams,
  FilterFunction,
  FilterHandler,
  FilterHandlers,
  FilterOperator,
  FilterOptions,
  FilterRule,
  FilterStructure,
};
