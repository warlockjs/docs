import dayjs from "dayjs";

/**
 * Convert a value to an array if it isn't already
 */
export function returnAsArray(value: any): any[] {
  if (!Array.isArray(value)) {
    if (value && typeof value === "object" && "toArray" in value) {
      const result = value.toArray();
      return result;
    }

    const result = [value];
    return result;
  }

  return value;
}

/**
 * Parse a date value with optional format
 */
export function parseDate(value: any, format?: string): Date {
  if (value instanceof Date) return value;

  if (typeof value === "number" || !isNaN(Number(value))) {
    return new Date(parseInt(value));
  }

  if (typeof value === "string") {
    return dayjs(value, format).toDate();
  }

  return value;
}

/**
 * Create an object for multiple columns with the same value
 */
export function createColumnsObject(
  columns: string[],
  value: any,
): Record<string, any> {
  const columnsAsObject: Record<string, any> = {};
  for (const column of columns) {
    columnsAsObject[column] = value;
  }
  return columnsAsObject;
}
