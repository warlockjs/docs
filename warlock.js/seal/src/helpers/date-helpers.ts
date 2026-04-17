/**
 * Detect if value is a date value or field name
 *
 * Date values:
 * - Date instance
 * - Number (timestamp)
 * - String with date separators (- or /)
 *
 * Field names:
 * - Strings without - or /
 *
 * @param value - Value to check
 * @returns true if it's a date value, false if it's a field name
 */
export function isDateValue(value: any): boolean {
  if (value instanceof Date) return true;

  const date = new Date(value);

  return !isNaN(date.getTime());
}
