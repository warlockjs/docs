const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;

/**
 * Check if the given value is a valid date value
 */
export function isValidDateValue(value: unknown): boolean {
  // ✅ Handle timestamps
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return false;

    const date = new Date(value);
    return !Number.isNaN(date.getTime());
  }

  // ❌ Only allow strict ISO strings
  if (typeof value !== "string") return false;

  if (!isoRegex.test(value)) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  // 🔥 Critical step: prevent JS auto-correction
  // Example: "2023-02-31" → March 3 (WRONG but "valid")
  const [y, m, d] = value.split("T")[0].split("-").map(Number);

  return date.getUTCFullYear() === y && date.getUTCMonth() + 1 === m && date.getUTCDate() === d;
}
