import type { FilterHandler } from "./types";
import { createColumnsObject, parseDate, returnAsArray } from "./utils";

export const dateFilters: Record<string, FilterHandler> = {
  date: ({ column, columns, value, query, options }) => {
    const dateValue = parseDate(value, options?.dateFormat);
    if (column) {
      query.where(column, dateValue);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, dateValue));
    }
  },
  "date>": ({ column, columns, value, query, options }) => {
    const dateValue = parseDate(value, options?.dateFormat);
    if (column) {
      query.where(column, ">", dateValue);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, { $gt: dateValue }));
    }
  },
  "date>=": ({ column, columns, value, query, options }) => {
    const dateValue = parseDate(value, options?.dateFormat);
    if (column) {
      query.where(column, ">=", dateValue);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, { $gte: dateValue }));
    }
  },
  "date<": ({ column, columns, value, query, options }) => {
    const dateValue = parseDate(value, options?.dateFormat);
    if (column) {
      query.where(column, "<", dateValue);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, { $lt: dateValue }));
    }
  },
  "date<=": ({ column, columns, value, query, options }) => {
    const dateValue = parseDate(value, options?.dateFormat);
    if (column) {
      query.where(column, "<=", dateValue);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, { $lte: dateValue }));
    }
  },
  inDate: ({ column, columns, value, query, options }) => {
    const values = returnAsArray(value).map(v =>
      parseDate(v, options?.dateFormat),
    );
    if (column) {
      query.whereIn(column, values);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, { $in: values }));
    }
  },
  dateBetween: ({ column, columns, value, query, options }) => {
    const values = returnAsArray(value).map(v =>
      parseDate(v, options?.dateFormat),
    );
    if (column) {
      query.whereDateBetween(column, [values[0], values[1]]);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, { $between: values }));
    }
  },
  dateTime: ({ column, columns, value, query, options }) => {
    const dateValue = parseDate(value, options?.dateTimeFormat);
    if (column) {
      query.where(column, dateValue);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, dateValue));
    }
  },
  "dateTime>": ({ column, columns, value, query, options }) => {
    const dateValue = parseDate(value, options?.dateTimeFormat);
    if (column) {
      query.where(column, ">", dateValue);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, { $gt: dateValue }));
    }
  },
  "dateTime>=": ({ column, columns, value, query, options }) => {
    const dateValue = parseDate(value, options?.dateTimeFormat);
    if (column) {
      query.where(column, ">=", dateValue);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, { $gte: dateValue }));
    }
  },
  "dateTime<": ({ column, columns, value, query, options }) => {
    const dateValue = parseDate(value, options?.dateTimeFormat);
    if (column) {
      query.where(column, "<", dateValue);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, { $lt: dateValue }));
    }
  },
  "dateTime<=": ({ column, columns, value, query, options }) => {
    const dateValue = parseDate(value, options?.dateTimeFormat);
    if (column) {
      query.where(column, "<=", dateValue);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, { $lte: dateValue }));
    }
  },
  inDateTime: ({ column, columns, value, query, options }) => {
    const values = returnAsArray(value).map(v =>
      parseDate(v, options?.dateTimeFormat),
    );
    if (column) {
      query.whereIn(column, values);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, { $in: values }));
    }
  },
  dateTimeBetween: ({ column, columns, value, query, options }) => {
    const values = returnAsArray(value).map(v =>
      parseDate(v, options?.dateTimeFormat),
    );
    if (column) {
      query.whereDateBetween(column, [values[0], values[1]]);
    } else if (columns) {
      query.orWhere(createColumnsObject(columns, { $between: values }));
    }
  },
};
