import type { FilterHandler } from "./types";
import { createColumnsObject } from "./utils";

export const booleanFilters: Record<string, FilterHandler> = {
  bool: ({ column, columns, value, query }) => {
    const boolValue = value === "0" ? false : Boolean(value);
    if (column) {
      query.where(column, boolValue);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, boolValue));
    }
  },
  boolean: ({ column, columns, value, query }) => {
    booleanFilters.bool({ column, columns, value, query });
  },
  null: ({ column, columns, query }) => {
    if (column) {
      query.whereNull(column);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, null));
    }
  },
  notNull: ({ column, columns, query }) => {
    if (column) {
      query.whereNotNull(column);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, { $ne: null }));
    }
  },
  "!null": ({ column, columns, query }) => {
    booleanFilters.notNull({ column, columns, value: null, query });
  },
};
