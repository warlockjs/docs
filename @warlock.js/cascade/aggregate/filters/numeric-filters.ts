import type { FilterHandler } from "./types";
import { createColumnsObject, returnAsArray } from "./utils";

export const numericFilters: Record<string, FilterHandler> = {
  number: ({ column, columns, value, query }) => {
    const numValue = Number(value);
    if (column) {
      query.where(column, numValue);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, numValue));
    }
  },
  inNumber: ({ column, columns, value, query }) => {
    const values = returnAsArray(value).map(v => Number(v));
    if (column) {
      query.whereIn(column, values);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, { $in: values }));
    }
  },
  int: ({ column, columns, value, query }) => {
    const intValue = parseInt(value);
    if (column) {
      query.where(column, intValue);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, intValue));
    }
  },
  integer: ({ column, columns, value, query }) => {
    numericFilters.int({ column, columns, value, query });
  },
  "!int": ({ column, columns, value, query }) => {
    const intValue = parseInt(value);
    if (column) {
      query.where(column, "!=", intValue);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, { $ne: intValue }));
    }
  },
  "int>": ({ column, columns, value, query }) => {
    const intValue = parseInt(value);
    if (column) {
      query.where(column, ">", intValue);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, { $gt: intValue }));
    }
  },
  "int>=": ({ column, columns, value, query }) => {
    const intValue = parseInt(value);
    if (column) {
      query.where(column, ">=", intValue);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, { $gte: intValue }));
    }
  },
  "int<": ({ column, columns, value, query }) => {
    const intValue = parseInt(value);
    if (column) {
      query.where(column, "<", intValue);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, { $lt: intValue }));
    }
  },
  "int<=": ({ column, columns, value, query }) => {
    const intValue = parseInt(value);
    if (column) {
      query.where(column, "<=", intValue);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, { $lte: intValue }));
    }
  },
  inInt: ({ column, columns, value, query }) => {
    const values = returnAsArray(value).map(v => parseInt(v));
    if (column) {
      query.whereIn(column, values);
      query.whereIn(column, values);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, { $in: values }));
    }
  },
  float: ({ column, columns, value, query }) => {
    const floatValue = parseFloat(value);
    if (column) {
      query.where(column, floatValue);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, floatValue));
    }
  },
  double: ({ column, columns, value, query }) => {
    numericFilters.float({ column, columns, value, query });
  },
};
