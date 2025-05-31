import { WhereExpression } from "../WhereExpression";
import { type WhereOperator } from "./../types";
import { booleanFilters } from "./boolean-filters";
import { dateFilters } from "./date-filters";
import { numericFilters } from "./numeric-filters";
import type { ApplyFiltersParams, FilterHandlers, FilterRule } from "./types";

const filterHandlers: FilterHandlers = {
  ...booleanFilters,
  ...numericFilters,
  ...dateFilters,
};

function prepareFilterRule(key: string, rule: FilterRule) {
  if (Array.isArray(rule)) {
    if (rule.length === 1) {
      return {
        type: rule[0],
        column: key,
        columns: undefined,
      } as const;
    }

    if (Array.isArray(rule[1])) {
      return {
        type: rule[0],
        column: undefined,
        columns: rule[1],
      } as const;
    }

    return {
      type: rule[0],
      column: rule[1],
      columns: undefined,
    } as const;
  }

  return {
    type: rule,
    column: key,
    columns: undefined,
  };
}

export function applyFilters({
  query,
  filters,
  data = {},
  options = {},
}: ApplyFiltersParams) {
  for (const key in filters) {
    let value = data[key];
    if (value === undefined) continue;

    const rule = prepareFilterRule(key, filters[key]);

    if (typeof rule.type === "function") {
      rule.type(value, query, data);
      continue;
    }

    const handler = filterHandlers[rule.type as string];

    if (handler) {
      handler({
        column: rule.column,
        columns: rule.columns,
        value,
        query,
        options,
      });
      continue;
    }

    if (
      rule.type.startsWith("in") &&
      rule.type !== "int" &&
      !Array.isArray(value)
    ) {
      value = [value];
    }

    // Handle where operators if not a predefined filter type
    if (WhereExpression.operators[rule.type as WhereOperator]) {
      if (rule.column) {
        query.where(rule.column, rule.type as WhereOperator, value);
      } else if (rule.columns) {
        const columnsAsObject: Record<string, any> = {};
        for (const column of rule.columns) {
          const filterExpression = WhereExpression.parse(
            column,
            rule.type as WhereOperator,
            value,
          );
          columnsAsObject[column] = filterExpression[column];
        }
        query.orWhere(columnsAsObject);
      }
    }
  }
}
